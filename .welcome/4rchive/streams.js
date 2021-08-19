import { appendUrls, addUrls, consoleHelper, htmlToElement, importCSS } from '../.tools/misc.mjs';
import '../shared.styl';
consoleHelper();


const deps = [
	'/shared/vendor/localforage.min.js'
];
const delay = ms => new Promise(res => setTimeout(res, ms))
const flattenTree = (tree) => {
		const results = [];
		const recurse = (branch, parent = '/') => {
				const leaves = Object.keys(branch);
				leaves.map(key => {
						const children = Object.keys(branch[key]);
						if(!children || !children.length){
								results.push({
										name: key,
										code: parent + key,
										path: parent + key
								});
						} else {
								if(!branch[key]){ debugger; }
								recurse(branch[key], `${parent}${key}/`);
						}
				});
		};
		recurse(tree);
		return results;
};
const stringIndexAll = (str, term, overlap) => {
	var indices = [];
	for(var i=0; i<str.length;i++) {
		i = str.toLowerCase().indexOf(term.toLowerCase(), i);
		if(i === -1) break;
		indices.push(i);
		if(!overlap & term.length > 1) i+= (term.length-1)
	}
	return indices
};

function getStores(){
	const driverOrder = [
		localforage.INDEXEDDB,
		localforage.WEBSQL,
		localforage.LOCALSTORAGE,
	];
	const metaStore = localforage
		.createInstance({
				driver: driverOrder,
				name: 'serviceRequest',
				version: 1.0,
				storeName: 'meta', // Should be alphanumeric, with underscores.
				description: 'directory stucture, service type, etc'
		});
	const fileStore = localforage
		.createInstance({
				driver: driverOrder,
				name: 'serviceRequest',
				version: 1.0,
				storeName: 'files', // Should be alphanumeric, with underscores.
				description: 'contents of files'
		});
	return { metaStore, fileStore };
};

class FileSearch {
	path
	term
	lines
	
	currentLine
	currentColumn
	
	constructor(fileStore){
		this.fileStore = fileStore;
	}
	async load(path){
		this.path = path;
		const file = await this.fileStore.getItem(path);
		if(typeof file !== "string"){
			this.done = true;
			return;
		}
		this.lines = file.split('\n')
			.map(x => x.toLowerCase());
		this.reset()
	}
	reset(){
		this.currentLine = 0;
		this.currentColumn = 0;
		this.done = false;
	}
	next(term){
		if(this.done) return -1;
		if(!this.lines || !this.path) return -1;

		if(term.toLowerCase() !== this.term){
			this.term = term.toLowerCase();
			this.reset();
		}
		while(true){
			const newIndex = (this.lines[this.currentLine]||'').indexOf(this.term, this.currentColumn);
			if(newIndex === -1){
				this.currentColumn = 0;
				this.currentLine++;
				if(this.currentLine > this.lines.length -1){
					this.done = true;
					return -1;
				}
				continue;
			}
			this.currentColumn = newIndex+1;
			return {
				file: this.path,
				line: this.currentLine,
				column: this.currentColumn-1,
				text: this.lines[this.currentLine]
					.slice(Math.max(0, newIndex - 30), Math.max(newIndex + 30 + this.term.length))
					.trim()
			};
		}
	}
}

const MAX_RESULTS = 10000;
class ServiceSearch {
	timer
	stream
	async init({ term, path, fileStore }){
		this.timer = {
			t1: performance.now()
		};
		const cache = {};
		await fileStore.iterate((value, key) => {
			if(path && !key.startsWith(path)) return;
			cache[key] = value;
		})
		const fileStoreCache = {
			getItem: async (key) => cache[key]
		}
		const fileSearch = new FileSearch(fileStoreCache);
		let count = 0;
		let currentFileIndex = -1;

		const files = Object.keys(cache);
		
		console.log(`init: ${performance.now() - this.timer.t1} ms`)

		this.stream = new ReadableStream({
			start(controller) {},

			// if it has search term, queue up search results per occurence
			// if not, search files until one is found with search term in it
			// when done with all files, close controller
			async pull(controller){
				while(true){
					const q1 = performance.now()
					const result = fileSearch.next(term);
					if(result === -1 && currentFileIndex === files.length - 1){
						controller.close();
						return;
					}
					if(result === -1){
						await fileSearch.load('.' +files[++currentFileIndex]);
						continue;
					}
					//console.log(`q: ${performance.now() - q1} ms`)
					controller.enqueue(result);
				}
			}
		});

	}
	// does this ever need to be awaited?
	async search(handler){
		const reader = this.stream.getReader();
		let ct = 0;
		while(true){
			const { done, value } = await reader.read();
			if(done) break;
			handler(value)
			ct++;
			if(ct === MAX_RESULTS) break
		}
		this.timer.t2 = performance.now();

		// should this be returned or passed to handler?
		// or should this be avoided and result totals passed with each stream item?
		handler({
			summary: {
				timer: this.timer.t2 - this.timer.t1,
				count: ct
			}
		});
	}
	
}

function simpleStreamExample(){
		let count = 0;
	const stream = new ReadableStream({
		start(controller) {
			// start timer
			// get service
			// read all files of service
			// localforage.getItem('keys')
		},
		async pull(controller){
			if (count >= 10) {
				controller.close();
				return;
			}
			console.log(`enqueued something: ${count}`)
			controller.enqueue('hello');
			count++;
		}

	});
	
	async function readStream(stream) {
		const reader = stream.getReader();
		let ct = 0;
		while(true){
			await delay(100);
			const { done, value } = await reader.read();
			if(done) break;
			console.log(`${value}: ${ct}`)
			ct++
		}
	}
	if(stream instanceof ReadableStream){
		readStream(stream);
	}
}

(async () => {
	await appendUrls(deps);
	const { metaStore, fileStore } = getStores();

	const serviceSearch = new ServiceSearch();
	await serviceSearch.init({
		term: "provid" + "er",
		path: "./.welcome/5upport/",
		fileStore
	})
	console.log('start')
	const t1 = performance.now();
	let touched = false;
	serviceSearch.search(x => {
		if(!touched){
			console.log(`first result: ${performance.now() - t1}`)
			touched = true;
		}
		//console.log(JSON.stringify(x, null, 2))
		if(x.summary) console.log(JSON.stringify(x, null, 2))
		else console.log(JSON.stringify(x, null, 2))
	})
	
	//simpleStreamExample()

})()



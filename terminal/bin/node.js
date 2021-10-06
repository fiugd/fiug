/*

	node should not be able to create its own workers
	instead, it should call a "spawn" function by sending message to terminal
	this way terminal can clean up node's spawned processes when it kills node
	this would also keep node very simple
	
	it's also debateable whether or not "node" should be a worker
*/


// NOTE: this is not a function that is ran in main window context
// instead it's source is dumped into a worker
// be mindful of this!!!
const operationOLD = async (args, state={}) => {
	const { file, cwd } = args;
	let filePath='';
	if(file.includes('/')){
		filePath = '/' + file.split('/').slice(0,-1).join('/');
	}

	const scriptUrl = `${location.origin}/${cwd}/${file}`;
	const scriptText = await (await fetch(scriptUrl)).text();

	function AsyncHooked(original){
		const replaced = `self.asyncHooks[self.hookCount++] = `;
		return original
			//.replace(/async /gm, replaced + 'async ')
			.replace(/^[\s\t]*await /gm, '' + replaced);
	}
	
	// CRIPE! this won't work because "node" itself is running in a worker...
	function WithSession(original){
		try {
			const storageKeys = Array.from(original.matchAll(/sessionStorage.getItem\(['`"](.*)['`"]\)/g)).map(([,x])=>x);
			const stored = storageKeys.reduce((all,one) => ({ ...all, [one]: sessionStorage.getItem(one) }), {});
			const fakeStorage = `const sessionStorage = { getItem: (key) => { return ${JSON.stringify(stored)}[key]; } };\n`;
			return fakeStorage + original;
		} catch(e){
			return '// ERROR adding session to worker: ${e.message}\n' + original;
		}
	}

	const runScript = (name, src, logger) => new Promise((resolve, reject) => {
		const upParent = (root, base) => {
			const oneUp = `${root}/${base}`.split('/').slice(0,-1).join('/');
			return oneUp;
		};
		const workerSrc = `
			const cwd = '${location.origin}/${cwd}';
			console.log = (...args) => postMessage({ log: args });
			console.warn = console.info = console.log;
			console.error = (error) => {
				const cleanerError = error?.message
					? { message: error.message, stack: error.stack }
					: error;
				postMessage({ error: cleanerError });
			};
			self.asyncHooks = [];
			self.hookCount = 0;

			${WithSession(AsyncHooked(src))}

			//queueMicrotask(() => {
			//	postMessage({ exit: true });
			//});
			setTimeout(async () => {
				//console.log(self.asyncHooks.length);
				await Promise.allSettled(self.asyncHooks);
				//console.log(self.asyncHooks.length);
				queueMicrotask(() => {
					postMessage({ exit: true });
				});
			}, 1);
		`.replace(/^			/gm, '')
		.replace(/from \'\.\./gm, `from '${upParent(location.origin, cwd+filePath)}`)
		.replace(/from \"\.\./gm, `from "${upParent(location.origin, cwd+filePath)}`)
		.replace(/from \'\./gm, `from '${location.origin}/${cwd+filePath}`)
		.replace(/from \"\./gm, `from "${location.origin}/${cwd+filePath}`)
		.trim()
		.split('\n')
		.map(line => {
			if(!line.includes('self.asyncHooks[self.hookCount++] =')) return line;
			return line+`\nawait self.asyncHooks[self.hookCount-1];`
		})
		.join('\n') + `
//# sourceURL=https://beta.fiug.dev/node-${file}
`;

		//console.log(workerSrc)

		const blob = new Blob([ workerSrc ], { type: "text/javascript" });
		const type = 'module';
		//TODO: give option in node to choose type
		//TODO: give option in node to run script outside worker

		//TODO: consider using SW to help add stuff to files loaded as workers
		// for the time being, the above approach works (replace)
		//let url = new URL(scriptUrl+/::WORKER::/, window.location.origin);
		//let worker = new Worker(url.toString());
		
		// NOTE/TODO: local storage and session storage not available in worker scope!!!
		if(state.previousUrl) URL.revokeObjectURL(state.previousUrl);
		const url = URL.createObjectURL(blob);
		state.previousUrl = url;

		if(state.worker) state.worker.terminate();
		const worker = new Worker(url, { name, type });
		state.worker = worker;
		const exitWorker = () => { resolve(); };
		worker.onerror = (error) => {
			console.error(error?.message
				? error.message
				: error || 'unknown error'
			);
			exitWorker();
		};
		worker.onmessage = (e) => {
			const { log, error, exit } = e.data;
			log && console.log(...log);
			if(exit) exitWorker();
		};
	});
	return await runScript(`node-${file}`, scriptText, postMessage);
};

// NOTE: this is not a function that is ran in main window context
// instead it's source is dumped into a worker
// be mindful of this!!!
const operation = async (args, state={}, event={}) => {
	const { file, cwd } = args;
	const { eventName } = event.data || {};

	if (eventName && eventName !== 'fileChange') return;

	let filePath='';
	if(file.includes('/')){
		filePath = '/' + file.split('/').slice(0,-1).join('/');
	}

	const scriptUrl = `${location.origin}/!/${cwd}/${file}`;

	const runScript = (name, url, logger) => new Promise((resolve, reject) => {
		if(self.worker) self.worker.terminate();

		self.worker = new Worker(url, { type: 'module' });

		const exitWorker = ({ error }={}) => {
			if(error) postMessage({ error: error.message || 'unknown error occured' });
			self.worker.terminate();
			self.worker = undefined;
			resolve();
		};
		self.worker.onmessage = (e) => {
			const { log, error, exit } = e.data;
			log && console.log(...log);
			if(exit) exitWorker();
		};
		self.worker.onerror = (error) => exitWorker({ error });
		self.worker.onmessageerror = worker.onerror;
	});

	return await runScript(file, scriptUrl, postMessage);
};

export default class Node {
	name = 'Node (js runner)';
	keyword = 'node';
	description = 'Run javascript files in the terminal, similar to node.js but in a browser and less awesome.  Use watch flag to re-run on file changes.';
	usage = '[--watch] [FILE]';

	listenerKeys = [];
	previousUrl; 

	args = [{
		name: 'file', alias: 'f', type: String, defaultOption: true, required: true
	}, { 
		name: 'watch', alias: 'w', type: Boolean, required: false 
	}]

	constructor(){
		this.operation = operation;
	}
};

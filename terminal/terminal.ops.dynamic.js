/*

"dynamic" basically just means that this command is not cached with sw
instead this module loads "dynamic" op from github / uses terminalCache

it may be tempting to think that "dynamic" means that crosshj/fiug-beta/terminal/bin
files are ran autommatically, but this is not the case

basically, this file just shortcuts the need for sw and service.manifest.json entry

*/


import { chalk, jsonColors } from './terminal.utils.js';
import ansiEscapes from 'https://cdn.skypack.dev/ansi-escapes';
const showCursor = ansiEscapes.cursorShow;

const cacheName = 'terminal-cache'

const fetchJSON = url => fetch(url).then(x => x.json());

export const readDir = async (serviceName, dir) => {
	let response, error;
	try {
		const { result: allServices } = await fetchJSON('/service/read')
		const { id: serviceId } = allServices.find(x => x.name === serviceName );
		const { result: [service] } = await fetchJSON(`/service/read/${serviceId}`)
		const tree = service.tree[serviceName];
		const response = Object.keys(
			dir.split('/').filter(x=>x).reduce((all,one) => all[one], tree)
		).map(name => ({ name }));
		return { response };
	} catch({ message: error }) {
		return { error };
	}
};

export const readSourceDir = async (dir) => {
	if(location.href.includes('/::preview::/')){
		return readDir('crosshj/fiug-beta', dir);
	}
	const site = location.origin;
	const root = site.includes('beta')
		? `https://api.github.com/repos/crosshj/fiug-beta`
		: `https://api.github.com/repos/crosshj/fiug`;
	const branch = site.includes('beta')
		? 'main'
		: 'master';
	const githubContentsUrl = `${root}/contents${dir||''}?ref=${branch}`;
	let response, error;
	try {
		const cache = await caches.open(cacheName);
		const match = await cache.match(githubContentsUrl)
			|| await cache.add(githubContentsUrl)
			|| await cache.match(githubContentsUrl);
		response = await match.json();
	} catch(e) {
		error = e.message;
	}
	return { response, error };
};

const updateSWCache = (bins) => {
	console.warn(`
		TODO: add files to SW cache under /_/modules/terminal/bin
		this avoids having to add these to service.manifest.json
	`.replace(/^\t+/gm, '').trim());
};

const debounce = (func, wait) => {
	let timeout;
	let throttleTime;
	let args;
	let context;
	return function() {
		context = this;
		args = arguments;
		const later = function() {
			func.apply(context, args);
			timeout = null;
		};
		if(!timeout) throttleTime = performance.now();
		if(timeout && (performance.now() - throttleTime) > wait){
			func.apply(context, args);
			throttleTime = performance.now();
		}
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

class ProcessWorker {
	header = `
		console.log = (...log) => postMessage({
			log: log.join('')+'\\n'
		});
	`.replace(/^		/gm, '').trim()
	
	footer = (url) => `
		let script;
		let state = {};
		onmessage = async (e) => {
			let result, error, exit;

			// TODO: maybe in future be more fancy with events
			if(e.data?.type === "events"){}

			try {
				script = script || e.data;
				result = await operation(script || e.data, state, e);
			} catch(e){
				error = e.message;
			}
			exit = !(script || e.data).watch;
			postMessage({ result, error, exit });
		}

		//# sourceURL=${url}
	`.replace(/^		/gm, '').trim()

	constructor(url, {comm, exit, setListenerKey}){
		this.comm = comm;
		this.exit = exit;
		this.setListenerKey = setListenerKey;
		this.url = url;

		let moduleResolver;
		this.module = new Promise((resolve) => { moduleResolver = resolve; });
		let blobResolver;
		this.blob = new Promise((resolve) => { blobResolver = resolve; });
		const baseUrl = (new URL('./', location)).href.split('terminal')[0] + 'terminal';
		(async (resolve) => {
			const module = new (await import(url)).default;
			moduleResolver(module);
			if(module.type === 'plain') return blobResolver();

			const body = `
				const baseUrl = "${baseUrl}";
				const operation = ${module.operation.toString()};
			`.replace(/^				/gm, '');
			const blob = new Blob(
				[ this.header, '\n\n', body, '\n\n',this.footer(url) ],
				{ type: "text/javascript" }
			);
			blobResolver(blob);
		})();
	}
	run(args, logger, done){
		const { comm, setListenerKey } = this;
		const { attach } = comm;
		const finish = (resolve) => {
			logger('\n')
			done();
			resolve();
			this.exit();
		};
		const debounceTime = 300;

		const promise = new Promise(async (resolve) => {
			const module = await this.module;
			if(module.type === 'plain'){
				const runOperation = (eventName) => async (event) => {
					let serviceUrl;
					try {
						serviceUrl = (new URL(`/${event.detail.service}`, location)).href;
					} catch(e){}
					const result = await module.operation({
						...args, event, eventName, serviceUrl
					}, (msg)=>{
						msg && logger(msg);
						finish(resolve);
					});
					result && logger(result);
					if(!args.watch){
						return finish(resolve);
					}
				};
				const listener = (eventName) => debounce(runOperation(eventName), debounceTime);
				await listener('init')(args);
				if(!args.watch) return;

				const listenTo = module.listen || ['fileChange'];
				for (const eventName of listenTo) {
					const response = await attach({
						name: module.name,
						listener: listener(eventName),
						eventName
					});
					setListenerKey(response.key);
				}
				return;
			}
			const blob = await this.blob;
			const worker = new Worker(
				URL.createObjectURL(blob),
				{ name: this.url.split('/').pop() }
			);
			const exitWorker = () => {
				worker.onmessage = undefined;
				worker.terminate();
				finish(resolve);
			};
			this.kill = () => {
				worker.terminate();
			};
			worker.onmessage = (e) => {
				const { result, log, exit, error } = e.data;
				log && logger(log);
				result && logger(result);
				error && logger('ERROR: ' + error);//should be red?
				if(exit || (error && !args.watch)) exitWorker();
			};
			worker.postMessage(args);

			//NOTE: this is a very rough version of watch mode
			// eventName 'Operations' is hard coded and maybe should change
			if(args.watch){
				const messagePost = (eventName) => (args) => {
					worker.postMessage({
						type: "events", eventName, ...args
					});
				};
				const listener = (eventName) => debounce(messagePost(eventName), debounceTime);
				const listenTo = ['fileChange', 'fileSelect'];
				for (const eventName of listenTo) {
					const response = await attach({
						name: module.name,
						listener: listener(eventName),
						eventName
					});
					setListenerKey(response.key);
				}
				//worker.postMessage({ type: "events", ...response });
			}
		});
		return promise;
	}
}

async function invoke(args, done){
	const cwd = await this.getCwd();
	const logger = (msg) => {
		this.term.write(msg);
	};
	logger('\n');
	await this.process.run({ cwd, ...args }, logger, done);
}

function exit(){
	if(this.listenerKey){
		const { detach } = this.comm;
		this.listenerKey.forEach(detach);
		this.listenerKey = undefined;
	}
	try {
		this.process.kill();
	} catch(e){}
	this.term.write(showCursor);
}

const link = url => chalk.hex('#9cdcfe')(url);
const commandHelp = (command) => `

${chalk.bold('Usage:')} ${command.keyword} ${chalk.hex('#BBB')(command.usage||'')}

${command.description || 'MISSING DESCRIPTION: bug someone to add a description.'}

  -?, --????   ${chalk.hex('#BBB')('TODO')}        TODO: add args description
  -h, --help   ${/* SPACER                */''}    Prints this guide

${chalk.bold('Examples:')}
  TODO: add examples

${chalk.italic(`
Online help: ${link('https://github.com/crosshj/fiug/wiki')}
Report bugs: ${link('https://github.com/crosshj/fiug/issues')}
`)}
`;

class DynamicOp {
	constructor(url, term, comm, getCwd){
		this.term = term;
		this.comm = comm;
		this.invoke = invoke.bind(this);
		this.exit = exit.bind(this);
		this.getCwd = getCwd;

		this.setListenerKey = (key) => {
			if(this.listenerKey){
				this.listenerKey = [...this.listenerKey, key];
				return;
			}
			this.listenerKey = [ key ];
		}
		
		const process = new ProcessWorker(url, this);
		this.process = process;
		this.worker = process.worker;
		const thisOp = this;
		return new Promise(async (resolve) => {
			const module = await process.module;
			thisOp.args = module.args
			thisOp.keyword = module.keyword;
			thisOp.help = () => commandHelp(module);
			resolve(thisOp);
		});
	}
}

const GetDynamicOps = async (term, comm, getCwd) => {
	const bins = await readSourceDir('/terminal/bin');
	updateSWCache(bins);
	const ops = [];
	for(let i=0, len=bins.response.length; i<len; i++){
		const {name} = bins.response[i];
		const op = await new DynamicOp(
			`./bin/${name}`,
			term, comm, getCwd
		);
		ops.push(op);
	}
	//TODO: should attach a listener which watches for file changes
	//when invoke is called with watch arg, should register with this listener
	//then when file changes, will refresh
	return ops;
}
export default GetDynamicOps

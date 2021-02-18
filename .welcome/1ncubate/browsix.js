//show-preview

// see https://github.com/jvilk/BrowserFS

import { appendUrls, consoleHelper } from '../.tools/misc.mjs';
consoleHelper();

const proxy = 'https://api.allorigins.win/raw?url=';
const exampleFsUrl = proxy + 'https://unix.bpowers.net/fs';

const deps = [
	'../shared.styl',
	'https://unpkg.com/browsix@0.9.2/lib-dist/lib/kernel/kernel.js',
	//'https://unpkg.com/browsix@0.9.2/lib-dist/lib/syscall-api/syscall-api.js',
	//'https://unpkg.com/browsix@0.9.2/lib-dist/lib/browser-node/browser-node.js',
];

(async () => {
	window.exports = {};
	await appendUrls(deps);

	const { Boot } = window;

	const getKernel = () => new Promise((resolve, reject) => {
		const bootArgs = [
			"XmlHttpRequest", //fsType
			["index.json", exampleFsUrl, true], //fsArgs
			(error, kernel ) => {
				if(error) return reject(error);
				resolve(kernel);
			}, //cb
			{ readOnly: false } //args
		];
		Boot(...bootArgs);
	});
	
	const getKernelWithCustomFS = () => new Promise(async (resolve, reject) => {
		const fsArgs = ["index.json", exampleFsUrl, true];
		const browsixFSes = BrowsixFSes();
		const rootFS = new browsixFSes.XmlHttpRequest(...fsArgs);
		rootFS.supportsSynch = () => false;

		const proxyGet = (target, key) => {
			if(key === "constructor") return target[key];
			if(typeof target[key] !== 'function') return target[key];
			return (...args) => {
				// NOTE: could make the FS retrieve whatever I want
				return target[key](...args)
			};
		};
		const proxiedRootFS = new Proxy(rootFS, { get: proxyGet });

		const bootArgs = [
			proxiedRootFS,
			(error, kernel ) => error ? reject(error) : resolve(kernel), //cb
			{ readOnly: false } //args
		];
		BootWith(...bootArgs);
	});

	const kernel = await getKernelWithCustomFS();
	const lsCallArgs = [
		'cat README',
		() => {},
		(err, output) => console.info(output),
		console.error
	]
	kernel.system(...lsCallArgs);
	//console.log(Object.keys(kernel.system))
	
})();
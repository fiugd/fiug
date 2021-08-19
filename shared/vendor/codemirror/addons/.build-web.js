//show-preview
const uglifyUrl = 'https://unpkg.com/uglifyjs-lite@2018.8.15/lib.uglifyjs.js';

// TODO: get this dynamically
const cwd = `crosshj/fiug-beta/shared/vendor/codemirror/addons`;
const serviceId = 3000;

//TODO: need to save output to 

const appendNewScript = (url) => new Promise((resolve) => {
	const newScript = document.createElement('script');
	newScript.src = url;
	newScript.onload = resolve;
	document.head.appendChild(newScript);
});

const readdir = async () => {
	const res = await (await fetch(`/service/read/${serviceId}`)).json();
	const { name, tree } = res.result[0];
	const root = tree[name];
	let files = [];
	try {
		files = Object.keys(
			root.shared.vendor.codemirror.addons
		);
	} catch(e){}
	return files;
};

const readFile = async (filename) => {
	const res = await (await fetch(`/${cwd}/${filename}`)).text()
	return res;
};

const writeFile = async (filename, minified) => {
	console.warn(`PLEASE WRITE TO: ${filename}`)
	//console.log(minified);
};

const promisify = (which) => {
	const ops = { readdir, readFile, writeFile };
	return ops[which];
};

const mocked = {
	fs: {
		readdir: 'readdir',
		readFile: 'readFile',
		writeFile: 'writeFile'
	},
	path: {
		basename: () => {}
	},
	util: { promisify } 
};

(async () => {
	await appendNewScript(uglifyUrl);
	const { uglify } = utility2_uglifyjs;
	mocked["uglify-js"] = {
		minify: ({code: _code}, options) => {
			let code, error;
			try {
				code = uglify(_code);
			} catch(e){
				error = e;
			}
			return { code, error };
		}
	}; 

	window.__filename = '';
	window.require = (which) => mocked[which];

	appendNewScript('./.build.js');

})()

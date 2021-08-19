import '/shared/vendor/stylus.min.js';

const delay = ms => new Promise(res => setTimeout(res, ms));

const alreadyAppended = {};
const appendScript = (url) => {
	if(alreadyAppended[url]){ return; }
	return new Promise((resolve, reject) => {
		alreadyAppended[url] = true;
		const script = document.createElement('script');
		script.crossOrigin = "anonymous";
		script.onload = resolve;
		script.src = url;
		document.head.appendChild(script);
	});
};
const appendStyleSheet = (url) => {
	if(alreadyAppended[url]){ return; }
	return new Promise((resolve, reject) => {
		alreadyAppended[url] = true;
		const style = document.createElement('link');
		style.rel = "stylesheet";
		style.crossOrigin = "anonymous";
		style.onload = resolve;
		style.href = url;
		document.head.appendChild(style);
	});
};
const appendCompiledStyleSheet = (url) => {
	if(alreadyAppended[url]) return;
	return new Promise(async (resolve, reject) => {
		alreadyAppended[url] = true;
		const cssBody = await (await fetch(url)).text();
		const style = document.createElement('style');
		style.id = 'foo-'+Math.random().toString().replace('0.','')
		style.textContent = stylus.render(cssBody);
		document.head.appendChild(style);
		resolve();
	});
};
const appendUrls = async (urls=[]) => {
	const queue = Array.isArray(urls)
		? [ ...urls ]
		: [ urls ];

	for(var i=0; i<queue.length; i++){
		let url = queue[i];
		if(url[0] === '/'){
			url = location.origin + url;
		}
		if(["css"].includes(url.split('.').pop()) ){
			await appendStyleSheet(url);
			continue;
		}
		if(["styl"].includes(url.split('.').pop()) ){
			await appendCompiledStyleSheet(url);
			continue;
		}
		if(url.split('.').pop() === "js"){
			await appendScript(url);
			continue;
		}
		console.error('error appendUrl: ' + url);
	}
}
const importCSS = async (url) => await appendUrls([url]);

// like append, but in parallel except when nested
const addUrls = async (urls=[]) => {
	const queue = Array.isArray(urls)
		? [ ...urls ]
		: [ urls ];

	const promisedQueue = queue.map(url => {
		if(url[0] === '/'){
			url = location.origin + url;
		}
		if(Array.isArray(url)) return window.appendUrls(url);

		if(["css"].includes(url.split('.').pop()) ){
			return appendStyleSheet(url);
		}
		if(["styl"].includes(url.split('.').pop()) ){
			return appendCompiledStyleSheet(url);
		}
		if(url.split('.').pop() === "js"){
			return appendScript(url);
		}
	})
	return Promise.all(promisedQueue);
}

const htmlToElement = function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	//also would be cool to remove indentation from all lines
	return template.content.firstChild;
}

// this relies on dependency being present in hosting page: see js.html
function prism(lang, code, classList){
	const codeEl = document.createElement('code');
	codeEl.innerHTML = code.trim();
	codeEl.className = "language-" + lang;

	const preEl = document.createElement('pre');
	preEl.className = (classList ? classList : '');
	preEl.appendChild(codeEl);
	document.body.appendChild(preEl);

	Prism.highlightElement(codeEl);
}

function consoleHelper(){
	console.bak = console.log;
	console.log = (...args) => {
		const text = args[0];
		const el = document.createElement('pre');
		el.innerText = text;
		document.body.appendChild(el);
		console.bak(...args);
	};

	console.bakInfo = console.info;
	console.info = (...args) => {
		const text = args[0];
		const el = document.createElement('pre');
		el.innerText = text;
		el.className = "info";
		document.body.appendChild(el);
		console.bakInfo(...args);
	};

	console.bakError = console.error;
	console.error = (...args) => {
		const text = args[0];
		const el = document.createElement('pre');
		el.innerHTML = typeof text === 'object'
			? JSON.stringify(text, null, 2)
			: text;
		el.className = "error";
		document.body.appendChild(el);
		console.bakError(...args);
	};
}

const stringify = o => JSON.stringify(o,null,2);
const logJSON = (obj, replacer, space=2) => console.log(
	JSON.stringify(obj, replacer, space)
);
const fetchJSON = (url, opts) => fetch(url, opts).then(x => x.json());
const fetchTEXT = (url, opts) => fetch(url, opts).then(x => x.text());

const getStored = (varName) => {
	const stored = sessionStorage.getItem(varName);
	if(stored) return stored;
	const prompted = prompt(varName);
	sessionStorage.setItem(varName, prompted);
	return prompted;
};

export {
	delay,
	importCSS,
	htmlToElement,
	prism,
	consoleHelper,
	
	stringify,
	logJSON,
	fetchJSON,
	fetchTEXT,
	getStored,

	//DEPRECATE exporting these?
	appendUrls,
	addUrls
};

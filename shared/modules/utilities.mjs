function codemirrorModeFromFileType(fileType){
	const conversions = {
		assemblyscript: { name: 'javascript', typescript: true, assemblyscript: true },
		apl: 'text/apl',
		typescript: { name: 'javascript', typescript: true },
		react: 'jsx',
		svg: 'xml',
		html: {
			name: 'htmlmixed',
			tags: {
				style: [
					["type", /^text\/(x-)?scss$/, "text/x-scss"],
					[null, null, "css"]
				],
				custom: [[null, null, "customMode"]]
			}
		},
		sass: 'text/x-scss',
		less: 'text/x-less',
		image: { name  : 'default' },
		bat: { name: 'default' },
		mjs: { name: 'javascript' },
		json: { name: 'javascript', json: true },
		c: 'text/x-csrc',
		cpp: 'text/x-c++src',
		ocaml: 'text/x-ocaml',
		fsharp: 'text/x-fsharp',
		csharp: 'text/x-csharp',
		java: 'text/x-java',
		kotlin: 'text/x-kotlin',
		lisp: 'commonlisp',
		raku: 'perl6',
		zig: 'rust',
		sql: 'text/x-pgsql',
	};
	//console.log({ fileType, conversions: conversions[fileType] });
	return conversions[fileType] || fileType;
}

// https://davidwalsh.name/javascript-debounce-function
/*
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};
*/
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

function pather(cwd, path, opts={}){
	const child = path||'';
	let parent = (cwd||'').split('/').filter(x=>!!x);
	if(['~','/'].includes(child[0])){
		parent = [];
	}
	return child.split('/')
		.filter(x=>!!x)
		.reduce((all, one) => {
			if(one === '..') return all.slice(0,-1);
			if(one === '~') return all;
			if(one === '.') return all;
			return [...all, one];
		}, parent)
		.join('/');
}

export {
	codemirrorModeFromFileType, debounce, pather
};
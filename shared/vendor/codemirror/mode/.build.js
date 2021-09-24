const UglifyJS = require("uglify-js");
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

var scriptName = path.basename(__filename);
const bundleName = '../mode.bundle.js';
const priority = [
	'simple.js',
	'multiplex.js',

	'xml.js',
	'javascript.js',
	'css.js',
	'clike.js',
	'mllike.js',
	'htmlmixed.js',
	'htmlembedded.js',
];
const ignore = [
	scriptName,
	'codemirror-javascript.js'
];
const exclude = (file) => file.includes('.json') ||
	file.includes('node_modules') ||
	ignore.includes(file) ||
	priority.includes(file);

(async() => {
	const files = [
		...priority,
		...(await readdir('./')).filter(x => !exclude(x))
	];
	let allText = `/*
		Codemirror Mode Bundle
		${new Date().toLocaleString('en')}\n
		MODES: ${files.map(x=>x.replace('.js','')).join(', ')}
		*/`.replace(new RegExp('		','g'), '')
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const code = await readFile(file, 'utf8');
		var options = {
			warnings: true
		};
		var result = UglifyJS.minify({code}, options);
		allText += `\n\n\n\n\n
			// -----  ${file}
			${result.error ? code : result.code}
			`.replace(new RegExp('			','g'), '');
	}
	await writeFile(bundleName, allText)
})()

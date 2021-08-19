//show-preview
import { appendUrls, addUrls, consoleHelper, htmlToElement, importCSS } from '../.tools/misc.mjs';
import '../shared.styl';
consoleHelper();

/*

*/
const deps = [
	"https://unpkg.com/systemjs@6.8.1/dist/system.min.js",
	"https://unpkg.com/systemjs@6.8.1/dist/extras/amd.min.js",
	"https://unpkg.com/systemjs-unpkg@1.0.1/dist/systemjs-unpkg.js",
	//"https://unpkg.com/typescript@4.0.3/lib/typescriptServices.js",
	"https://unpkg.com/require1k@2.0.0/require1k.min.js"
];


const eslintConfig = {
  "extends": "standard"
}

const eslintEvaluate = `
/*eslint spaced-comment: "off"*/
/*eslint prefer-const: "error"*/
/*eslint no-unused-vars: "off"*/
/*eslint semi: "off"*/
/*eslint indent: "warn"*/
/*eslint quotes: "off"*/
/*eslint standard/object-curly-even-spacing: "off"*/
/*eslint standard/array-bracket-even-spacing: "off"*/
/*eslint standard/computed-property-even-spacing: "off"*/
/*eslint promise/param-names: "off"*/

const foo = "hello"
const hello = foo + '--';
const fooFn = x => {
	x = 5; return x;
};
`.trim()+'\n';

const code = (() => {
	const logJSON = x => console.log(JSON.stringify(x,null,2));

	console.info('LODASH');
	const { camelCase } = require('lodash@4.17.20');
	console.log(camelCase('Hello World There'));

	console.info('ESLINT');
	const { default: standard } = require("eslint-config-standard@6.0/eslintrc.json");
	//logJSON(standard.rules);
	window.eslint = require('eslint-browser@3.8.1');
	console.info(eslintEvaluate);
	//logJSON(standard);
	standard.rules.indent = ['error', 'tab'];
	standard.rules['no-tabs'] = 0;
	const lintResults = eslint.verify(eslintEvaluate, standard);
	logJSON(lintResults);

	console.info('PRETTIER');
	window.prettier = require('prettier@2.2.1/standalone.js');
	const prettierTypescript = require('prettier@2.2.1/parser-typescript.js');
	const prettierOpts = {
		parser: "typescript",
		printWidth: 120,
		tabWidth: 4,
		semi: true,
		bracketSpacing: true,
		singleQuote: true,
		trailingComma: "es5",
		arrowParens: "always",
		useTabs: true,
	};
	try {
		console.log('PASS: '+prettier.check(eslintEvaluate, {
			...prettierOpts, plugins: [prettierTypescript]
		}));
		console.log(prettier.format(eslintEvaluate, {
			...prettierOpts, plugins: [prettierTypescript]
		}));
	} catch(e){
		console.log('prettier check and format failed');
	}

	console.info('FOOTILS | TIMER');
	require('browser-process-hrtime')
	window.process = { hrtime: module.exports };
	window.module = { exports: {} };

	const footils = require('footils@1.0.12');
	const { timer } = module.exports;
	timer.start('Timing Some Task');
	timer.log('Timing Some Task');

	console.info('NGRAPH');
	const ngraph = (require('ngraph.graph')).default;
	var g = ngraph();
	g.on('changed', logJSON);
	g.addNode('hello');
	g.addNode('world');
	g.addLink('space', 'bar');
	g.forEachNode(function(node){
		console.log(node.id, node.data);
	});
}).toString();

const systemJsSrc = "(async " +
	code.replace(/require\(/g, 'await System.import(') +
")()";

/*
	SystemJs can be added to javascript template
*/

(async () => {
	await addUrls(deps);
	/*
	const tsConfig = {
		"target": "es5",
		"module": ts.ModuleKind.None,
		"strict": true,
		"esModuleInterop": true,
		"inlineSourceMap": true,
		"inlineSources": true
	};
	*/
	const custom = {};

	//const exportShim = 'export=0;\n';
	System.defaultJSExtensions = true;
	R(r => {
		window.require= (...args) =>
			custom[args[0]] || r(...args);
	})
	window.module = {};
	window.global = window;
	window.process = {};

	// const transpiled = ts.transpile(exportShim+code, tsConfig).replace(/require\(/g, 'await System.import(');
	eval(systemJsSrc)
	//appendNewScript(systemJsSrc, 'systemjs')
})();
//show-preview
import { appendUrls, consoleHelper, htmlToElement, importCSS } from '../../.tools/misc.mjs';
import 	'../../shared.styl';

consoleHelper();

/*

https://codemirror.net/demo/lint.html

https://eslint.org/demo - built with browserify and hard to extract just eslint module; also, eslint does not support browser due to maintenance burden

https://github.com/angelozerr/codemirror-lint-eslint - might be able to get eslint working using this

https://www.unpkg.com/browse/codemirror@5.58.1/addon/lint/

would be nice to:
	- run eslint
	- OR define rules for JSHINT in some configuration file
	- run prettier
	- lint before updating preview (use as protection)
*/

const deps = [
	"/shared/vendor/codemirror.js",
	"https://www.unpkg.com/jshint@2.9.6/dist/jshint.js",
	"https://www.unpkg.com/codemirror@5.58.1/addon/lint/lint.js",
	"https://www.unpkg.com/codemirror@5.58.1/addon/lint/javascript-lint.js",
	"https://www.unpkg.com/codemirror@5.58.1/addon/lint/lint.css",
	"/shared/css/codemirror.css",
	"/shared/css/vscode.codemirror.css",
	"/shared/vendor/codemirror/mode.bundle.js"
];

const dummyText = `
/*jshint esversion: 6 */

console.log('Hello, World');
console.log("Hello, World");
console.;

function fred (){
}

const foo = 'hello';
foo = 'wow';

	var germ;
for(var i=0; i<3;i++){
	cons
}
`.trim()+'\r\n';

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const setupEditor = function(){
	const editorDiv = document.createElement('div');
	editorDiv.id = 'editor-div';
	editorDiv.style.width = "100%";
	editorDiv.style.height = "90vh";
	editorDiv.style.border = "1px solid black";
	document.body.appendChild(editorDiv);

	const cm = CodeMirror(editorDiv, {
		lineNumbers: true,
		tabSize: 2,
		mode: 'javascript',
		theme: 'vscode-dark',
		value: dummyText,
		gutters: ["CodeMirror-lint-markers"],
		lint: true
	});
	cm.setSize(null, 1000);
};

(async () => {
	await appendUrls(deps);
	const editorDiv = setupEditor();

})();



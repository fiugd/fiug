//show-preview
import EditorModule from "/crosshj/fiug-beta/shared/modules/editor.mjs";

import { importCSS, htmlToElement } from '/crosshj/fiug-beta/.welcome/.tools/misc.mjs';

var theBase = document.getElementsByTagName("base"); 
theBase[0].href = '/crosshj/fiug-beta/shared/modules';

const fetchTEXT = (url, opts) => fetch(url, opts).then(x => x.text());

const Editor = (opts) => new Promise((resolve, reject) => {
	EditorModule(opts, (err, data) => {
		if(err) return reject(err);
		resolve(data);
	})
});

const text = JSON.stringify(JSON.parse(localStorage.getItem('react-todo')||''), null, 2)
	|| (new Array(100)).fill().map(x => 'console.log("hello world")').join('\n');

const opts = {
	text,
	mode: 'javascript',
	lineWrapping: false,
	lineNumbers: true,
	addModeClass: true,
	autocorrect: true,
	showInvisibles: true,
	styleActiveLine: true,
	styleActiveSelected: true,
	matchBrackets: true,
	scrollPastEnd: true,
	foldGutter: true,
	gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
	foldOptions: {
		widget: (from, to) => {
			return "...";
		}, 
		minFoldSize: 3,
	},
	miniMap: true,
	miniMapSide: "right",
	miniMapWidth: 64,
}; 

const baseDom = () => {
	return `
<style>
	body .simulation {
		height: auto; position: absolute; left: 0; right: 0; top: 2.2em; bottom: 0em;
		overflow: scroll; display: flex; flex-direction: row;
	}
	body .simulation .CodeMirror { height: 100%; }
</style>
<div class="simulation">
	<textarea class="functionInput">
	</textarea>
</div>
`.trim();
};

(async () => {
	await importCSS('/crosshj/fiug-beta/.welcome/shared.styl')
	await importCSS('/index.css')
	document.documentElement.className = 'dark-enabled';
	document.body.innerHTML += baseDom();
	const sampleText = await fetchTEXT('/crosshj/fiug-beta/.welcome/.tools/misc.mjs');
	opts.text='';
	opts.text+=sampleText;
	opts.text+=sampleText;
	opts.text += `\n\n\n\n\n/*======================================================*/\n\n\n\n\n`;
	opts.text+=sampleText;
	opts.text+=sampleText;
	const editor = await Editor(opts);

	CodeMirror.commands.foldAll(editor)
})();

import { appendUrls, addUrls, consoleHelper, htmlToElement, importCSS } from '../.tools/misc.mjs';
import '../shared.styl';
consoleHelper();

/*
- [ ] integrate with client
- [x] fix concurrency issues
- [x] figure out how/where doc changes should be saved
- [x] update plugin to save changes automatically
- [x] recall/restore selections
- [x] recall/restore individual document history/undo
- [x] recall/restore scroll position
- [x] recall/restore cursor position

see defineExtension here https://codemirror.net/doc/manual.html

*/

const deps = [
	"/shared/vendor/codemirror.js",
	"/shared/css/codemirror.css",
	"/shared/css/vscode.codemirror.css",
	"/shared/vendor/codemirror/mode.bundle.js",
	'/shared/vendor/localforage.min.js'
];

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

window.docs = [{
	name: 'example.js',
	mode: 'javascript'
},{
	name: 'demo.js',
	mode: 'javascript'
}];

const EditorDom = () => {
	const style = `
		<style>
			body { overflow: hidden; }
			.CodeMirror {
				height: 100%;
			}
			#editor-div {
				box-shadow: 0px 0px 22px 0px #00000061;
				position: absolute;
				top: 73px;
				bottom: 1em;
				left: 1em; right: 1em;
			}
			#tabs-div {
				z-index: 1;
			}
			#tabs-div ul {
				list-style: none;
				padding: 0;
				margin: 0;
			}
			li {
				display: inline;
				background: #272727;
				color: #90969080;
				cursor: default;
				padding: 7px 15px 8px 15px;
				box-shadow: 0px -4px 9px 0px #0000005e;
				border-bottom: 1px solid #0000007d;
			}
			li.active {
				background: #1e1e1e;
				color: inherit;
				border-bottom: 0;
			}
		</style>
	`;
	
	const editorDiv = htmlToElement(`<div id="editor-div">${style}</div>`);
	document.body.appendChild(editorDiv);

	const tabsDiv = htmlToElement(`<div id="tabs-div"><ul></ul></div>`);
	const tabsList = tabsDiv.querySelector('ul');
	
	tabsList.innerHTML = docs.map((x,i) => `
		<li
			data-name="${x.name}"
			${i === 0 ? 'class="active"' : ''}
		>${x.name}</li>
	`).join('\n');
	document.body.appendChild(tabsDiv);
	
	return editorDiv;
};

const attachListeners = (editor, dom) => {
	const tabsList = dom.parentNode.querySelector('#tabs-div ul');

	tabsList.addEventListener('click', e => {
		const filename = e.target.dataset.name.toLowerCase();
		const tag = e.target.tagName.toLowerCase();

		if(tag === 'li'){
			const storedDoc = docs.find(x => x.name === filename);
			const oldDocTab = tabsList.querySelector('li.active');
			oldDocTab.classList.remove('active');
			event.target.classList.add('active');
			cm.loadDoc(storedDoc);
		}
	});
};

const setupEditor = function(){
	const editorDiv = EditorDom();

(function(mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define(["../../lib/codemirror"], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function(CodeMirror) {
	"use strict";

	let currentDoc;
	const SCROLL_MARGIN = 50;
	const allDocs = {};

	CodeMirror.defineOption('docStore', () => {},(cm, localforage) => {
		const driverOrder = [
			localforage.INDEXEDDB,
			localforage.WEBSQL,
			localforage.LOCALSTORAGE,
		];
		cm.options.docStore = localforage
			.createInstance({
					driver: driverOrder,
					name: 'editorState',
					version: 1.0,
					storeName: 'editor',
					description: 'scroll and cursor position, history, selection'
			});
	});

	function prepareStorageDoc(cmDoc){
		const other = {};
		other.sel = cmDoc.sel;
		other.text = cmDoc.getValue();
		other.cursor = cmDoc.getCursor();
		other.scrollTop = cmDoc.scrollTop;
		other.scrollLeft = cmDoc.scrollLeft;
		other.mode = cmDoc.mode.name;
		return other;
	}

	function rehydrateDoc(newDoc, stored){
		if(stored.text){
			newDoc.setValue(stored.text)
		}
		if(stored.scrollTop){
			newDoc.scrollTop = stored.scrollTop;
		}
		if(stored.scrollLeft){
			newDoc.scrollLeft = stored.scrollLeft;
		}
		if(stored.history){
			newDoc.clearHistory()
			newDoc.setHistory(stored.history);
		}
		if(stored.cursor){
			newDoc.setCursor(stored.cursor);
		}
		if(stored.sel){
			newDoc.setSelections(stored.sel.ranges);
		}
		return newDoc;
	}

	const debounce = (func, wait, immediate) => {
			var timeout;
			return async function() {
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

	CodeMirror.defineExtension('loadDoc', async function ({
		name, text, mode, scrollTop, scrollLeft, line, ch
	}){
		if(currentDoc && name === currentDoc.name) return;

		const initialized = !!allDocs[name];
		const storedDoc = initialized
				? undefined
				: await this.options.docStore.getItem(name);

		let newDoc = (allDocs[name] || {}).editor || CodeMirror.Doc('', mode || storedDoc.mode);
		newDoc.name = name;
		if(storedDoc){
			newDoc = rehydrateDoc(newDoc, storedDoc);
		}
		currentDoc = {
			name,
			editor: newDoc,
			swapping: true
		};
		allDocs[name] = currentDoc;

		this.swapDoc(newDoc);
		if(initialized) return;

		const thisOptions = this.options;
		async function persistDoc(){
			await thisOptions.docStore.setItem(
				name,
				prepareStorageDoc(currentDoc.editor)
			);
		}
		const debouncedPersist = debounce(persistDoc, 1000, false);

		if(line) {
			const pos = { line, ch };
			this.setCursor(pos);
			const t = this.charCoords({line, ch}, "local").top;
			this.scrollTo(0, t - SCROLL_MARGIN);
		}
		if(scrollTop){
			this.scrollTo(0, scrollTop);
		}

		if(!storedDoc)  debouncedPersist();
		CodeMirror.on(currentDoc.editor, "change", debouncedPersist);
		CodeMirror.on(currentDoc.editor, "cursorActivity", debouncedPersist);
		CodeMirror.on(this, "scroll", () => {
			if(name !== currentDoc.name) return;
			if(currentDoc.swapping){
				currentDoc.swapping = false;
				return;
			}
			debouncedPersist();
		});
	});
});

	window.cm = CodeMirror(editorDiv, {
		lineNumbers: true,
		//autofocus: true,
		tabSize: 2,
		mode: 'javascript',
		theme: 'vscode-dark',
		docStore: localforage,
		gutters: [],
	});

	cm.loadDoc({ name: 'example.js', mode: 'javascript', text: '//hello world'});
	
	attachListeners(cm, editorDiv);
};

(async () => {
	await appendUrls(deps);
	const editorDiv = setupEditor();

})();
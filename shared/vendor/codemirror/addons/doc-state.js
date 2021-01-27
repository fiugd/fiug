/*

Document State:

will store/recall (and load doc with)
  - cursor position
  - scrollTop and scrollLeft
  - selections
  - mode

In order for it to work:
- must pass localforage in options: "docStore: localforage"
- must call cm.loadDoc to load document
  - pass at least name as option
  - other args available: name, text, mode, scrollTop, scrollLeft, line, ch

example:

  const cm = CodeMirror(editorDiv, {
		lineNumbers: true,
		tabSize: 2,
		mode: 'javascript',
		theme: 'vscode-dark',
		docStore: localforage,
		gutters: [],
	});

	cm.loadDoc({ name: 'example.js', mode: 'javascript', text: '//hello world'});


further reference, see defineExtension here https://codemirror.net/doc/manual.html
(and nearby methods)

*/

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

	CodeMirror.defineOption('docStore', () => {}, (cm, localforage) => {
		if(!localforage || !localforage.createInstance) return;

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
		const storedDoc = await this.options.docStore.getItem(name);

		let newDoc = (allDocs[name] || {}).editor || CodeMirror.Doc('', mode || storedDoc.mode);
		newDoc.name = name;
		if(storedDoc){
			newDoc = rehydrateDoc(newDoc, { ...storedDoc, ...{ text, mode, scrollTop, scrollLeft }});
		} else {
			newDoc = rehydrateDoc(newDoc, { text, mode, scrollTop, scrollLeft });
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

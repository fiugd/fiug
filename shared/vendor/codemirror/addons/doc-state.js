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
	let currentMode;

	const SCROLL_MARGIN = 100;
	let docsInStore = [];
	let docsLoad;
	const docsCache = {};

	const sleep = (time) => new Promise((resolve)=> setTimeout(() => resolve('done'), time) );

	CodeMirror.defineOption('docStore', () => {}, (cm, localforage) => {
		if(!localforage || !localforage.createInstance) return;

		const driverOrder = [
			localforage.INDEXEDDB,
			localforage.WEBSQL,
			localforage.LOCALSTORAGE,
		];
		const docStore = localforage
			.createInstance({
					driver: driverOrder,
					name: 'editorState',
					version: 1.0,
					storeName: 'editor',
					description: 'scroll and cursor position, history, selection'
			});
		cm.options.docStore = {
			setItem: (key, value) => {
				//docsCache[key] = value;
				docStore.setItem(key, value);
			},
			getItem: async (key) => {
				if(docsCache[key]) return docsCache[key];
				const value = await docStore.getItem(key);
				//docsCache[key] = value;
				!docsInStore.includes(key) && docsInStore.push(key);
				return value;
			}
		};
		docsLoad = docStore.keys();
		(async () => {
			docsInStore = await docsLoad;
		})();
	});

	function prepareStorageDoc(cmDoc){
		const other = {};
		other.sel = cmDoc.sel;
		other.text = cmDoc.getValue();
		other.cursor = cmDoc.getCursor();
		other.scrollTop = cmDoc.scrollTop;
		other.scrollLeft = cmDoc.scrollLeft;
		other.mode = cmDoc.mode.name;
		other.history = cmDoc.getHistory();
		try {
			other.folded = cmDoc.getAllMarks()
				.filter(m => m.__isFold)
				.map(m => m.lines[0].lineNo());
		} catch(e){}
		return other;
	}

	const persistDoc = (ref) => () => {
		if(!currentDoc.path) return;
		ref.options.docStore.setItem(
			currentDoc.path,
			prepareStorageDoc(ref.doc)
		);
		if(!docsInStore.find(x => x === currentDoc.path)){
			docsInStore.push(currentDoc.path);
		}
	}

	function foldLine(doc, line){
		try {
			doc.foldCode({ line, ch: 0 }, null, "fold");
		} catch(e){}
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

	const selectLine = (cm, doc, line, ch) => {
		const newLine = ch ? { line, ch } : line;

		//const t = doc.cm.charCoords(newLine, "local").top;
		//cm.scrollTo(0, t - SCROLL_MARGIN);
		cm.scrollIntoView(newLine, SCROLL_MARGIN);

		doc.setSelections([])
		const active = Array.from(document.querySelectorAll('.activeline'));
		active.forEach(l => l.classList.remove('activeline'));

		setTimeout(() => {
			cm.focus();
			doc.setCursor(newLine);
			doc.addLineClass(newLine, null, 'activeline')
		}, 1);
	};

	class PerfMonitor {
		constructor(key){
			this.key = key;
			this.t0 = performance.now();
			this.events = [
				[key,this.t0]
			];
			this.track = this.track.bind(this);
			this.log = this.log.bind(this);
		}
		track(event){
			this.events.push([event, performance.now()]);
		}
		log(){
			const fNum = (number) => number.toFixed().padStart(3);
			const colors = [
				'color:#CE9178;',
				'color:#9CDCFE;',
				'color:#DCDCAA;'
			];
			this.events.forEach(([event, time], i) => {
				const timeTook = i > 0
					? `(${fNum(time-this.events[i-1][1])} ms)`
					: '';
				console.log(
					`%c${fNum(time-this.t0)}:%c ${event} %c${timeTook}`,
					...colors
				);
			});
			console.log(
				`%c${fNum(performance.now()-this.t0)}: %ctotal %c\n`,
				...colors
			);
		}
	}

	let listenersAttached;
	const addListeners = (ref) => {
		if(listenersAttached) return;
		CodeMirror.on(ref, "change", persistDoc(ref));
		CodeMirror.on(ref, "cursorActivity", persistDoc(ref));
		CodeMirror.on(ref, "scroll", persistDoc(ref));
		CodeMirror.on(ref, "fold", persistDoc(ref));
		CodeMirror.on(ref, "unfold", persistDoc(ref));
		listenersAttached = true;
		return true;
	};

	CodeMirror.defineExtension('loadDoc', function ({
		callback, name, path, text, mode, scrollTop, scrollLeft, line, ch, forceUpdate
	}){
		/*
		TODO: loading async and using a callback seems not to help
		should try somthing different
		https://javascript.info/fetch-progress
		https://stackoverflow.com/questions/35711724/upload-progress-indicators-for-fetch
		https://josephkhan.me/how-to-cancel-a-fetch-request/
		*/

		const loadAsync = async () => {
			if(!name) return;
			if(forceUpdate) await sleep(500);
			if(!forceUpdate && currentDoc && path === currentDoc.path){
				if(line) selectLine(this, currentDoc.editor, line, ch);
				return;
			}
			currentDoc = { path };

			const perf = new PerfMonitor(path);

			let storedDoc;
			await docsLoad;
			if(docsInStore.find(x => x === path)){
				storedDoc = await this.options.docStore.getItem(path);
				perf.track('editor store get');
			}
			if(!storedDoc){
				//TODO: try getting this directly from doc store instead
				text = await fetch(path).then(x => x.text());
				perf.track('file store get');
			}

			if(currentDoc.path !== path) return callback('cancel loading');

			this.setValue(storedDoc ? storedDoc.text : text);
			this.doc.clearHistory();

			const historyOkay = storedDoc &&
				storedDoc.history &&
				storedDoc.history.done &&
				storedDoc.history.undone &&
				storedDoc.history.done.length &&
				storedDoc.history.undone.length;
			if(historyOkay){
				this.doc.setHistory(storedDoc.history);
				perf.track('set history');
			}
			const cursorOkay = storedDoc &&
				storedDoc.cursor &&
				storedDoc.cursor.line;
			if(cursorOkay){
				this.doc.setCursor(storedDoc.cursor);
				perf.track('set cursor');
			}
			const selOkay = storedDoc &&
				storedDoc.sel &&
				storedDoc.sel.ranges
					.filter(x => 
						x.anchor.line !== x.head.line ||
						x.anchor.ch !== x.head.ch
					)
					.length > 0;
			if(selOkay){
				this.doc.setSelections(storedDoc.sel.ranges);
				perf.track('selections');
			}
			if(line){
				selectLine(this, this.doc, line, ch);
				perf.track('select line');
			}
			const scrollOkay = storedDoc &&
				!(scrollTop) &&
				(storedDoc.scrollLeft || storedDoc.scrollTop);
			if(scrollOkay){
				this.scrollTo(storedDoc.scrollLeft, storedDoc.scrollTop);
				perf.track('set scroll (from stored)');
			}
			if(scrollTop){
				this.scrollTo(0, scrollTop);
				perf.track('set scroll');
			}
			const foldsOkay = storedDoc &&
				storedDoc.folded &&
				storedDoc.folded.length &&
				this.foldCode;
			if(foldsOkay){
				const foldDocLine = (line) => foldLine(this, line);
				storedDoc.folded.forEach(foldDocLine);
				perf.track('set folds');
			}

			const modeString = (mode) => JSON.stringify(mode);
			const newMode = mode || storedDoc.mode;
			if(modeString(currentMode) !== modeString(newMode)){
				this.setOption('mode', newMode);
				currentMode = newMode;
				perf.track(`set mode ${modeString(currentMode)}`);
			}

			if(!storedDoc) {
				persistDoc();
				perf.track(`initial doc persist`)
			}

			if(addListeners(this)) perf.track(`add listeners`);

			setTimeout(() => this.refresh(), 1);
			// perf.track('refresh');

			perf.log();

			callback();
		};
		setTimeout(loadAsync, 1);
	});
});

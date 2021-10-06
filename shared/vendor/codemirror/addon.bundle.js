/*
Codemirror Addon Bundle
5/17/2021, 01:06:00 AM

ADDONS: doc-state, codemirror-scrollpastend, codemirror-search, codemirror-show-invisibles, foldcode, foldgutter, brace-fold, xml-fold, indent-fold, markdown-fold, comment-fold, panel, comment
*/




// -----  doc-state.js
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







// -----  codemirror-scrollpastend.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(o){"use strict";var t;function i(e,n){n=o.changeEnd(n).line;n!==t&&(t=n,r(e))}function r(e){var n="";50<e.lineCount()&&(n=e.display.scroller.clientHeight-30-e.getLineHandle(e.lastLine()).height+"px"),e.state.scrollPastEndPadding!=n&&(e.state.scrollPastEndPadding=n,e.display.lineSpace.parentNode.style.paddingBottom=n,e.off("refresh",r),e.setSize(),e.on("refresh",r))}o.defineOption("scrollPastEnd",!1,function(e,n,t){t&&t!=o.Init&&(e.off("change",i),e.off("refresh",r),e.display.lineSpace.parentNode.style.paddingBottom="",e.state.scrollPastEndPadding=null),n&&(e.on("change",i),e.on("refresh",r),r(e))})});






// -----  codemirror-search.js
/*

this file is a bundle of many search addons
  - search cursor
  - search
  - annotatescrollbar
  - matchesonscrollbar
  - jump-to-line

*/

// TODO: dialog should be customized!!
// cm.openDialog(text, f, {value: deflt, selectValueOnOpen: true})

// dialog.js

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Open simple dialogs on top of an editor. Relies on dialog.css.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  function dialogDiv(cm, template, bottom) {
    var wrap = cm.getWrapperElement();
    var dialog;
    dialog = wrap.appendChild(document.createElement("div"));
    if (bottom)
      dialog.className = "CodeMirror-dialog CodeMirror-dialog-bottom";
    else
      dialog.className = "CodeMirror-dialog CodeMirror-dialog-top";

    if (typeof template == "string") {
      dialog.innerHTML = template;
    } else { // Assuming it's a detached DOM element.
      dialog.appendChild(template);
    }
    CodeMirror.addClass(wrap, 'dialog-opened');
    return dialog;
  }

  function closeNotification(cm, newVal) {
    if (cm.state.currentNotificationClose)
      cm.state.currentNotificationClose();
    cm.state.currentNotificationClose = newVal;
  }

  function searchDetails(cm) {
    try {
      const current = {
        from: cm.state.search.posFrom,
        to: cm.state.search.posTo
      };
      const matches = cm.state.search.annotate.matches
        .sort((a, b) => a.from.line - b.from.line)
        .map(x => `${x.from.line}-${x.from.ch}-${x.to.line}-${x.to.ch}`);
      let currentResult;
      const currentMatch = `${current.from.line}-${current.from.ch}-${current.to.line}-${current.to.ch}`;
      for (let i = 1, len = matches.length; i <= len; i++) {
        if (matches[i-1] === currentMatch) {
          currentResult = i;
        }
      }
      return {
        current: currentResult,
        total: matches.length,
        currentResult, matches };
    } catch(e) {
      return {};
    }
  }

  CodeMirror.defineExtension("openDialog", function(template, callback, options) {
    const cm = this;
    options.closeOnEnter = false;

    const close = (newVal) => {
      document.getElementById('file-search').style.visibility = "";
    };

    document.getElementById('file-search').style.visibility = "visible";
    const searchInput = document.querySelector('#file-search input');

    const searchClose = document.querySelector('.search-close');
    const searchCount =  document.querySelector('.search-count');
    const searchNoResults = document.querySelector('.search-no-results');
    const searchCurrent =  document.querySelector('.search-count-current');
    const searchTotal =  document.querySelector('.search-count-total');
    const searchUp = document.querySelector('.search-up');
    const searchDown = document.querySelector('.search-down');
    searchClose.onclick = (e) => {
      searchInput.blur();
      close();
      cm.focus();
    };
    searchUp.onclick = () => {
      CodeMirror.commands.findPersistentPrev(cm);
      const { current } = searchDetails(cm);
      searchCurrent.innerText = current;
    }
    searchDown.onclick = () => {
      CodeMirror.commands.findPersistentNext(cm);
      const { current } = searchDetails(cm);
      searchCurrent.innerText = current;
    }

    searchInput.focus();
    searchInput.select();

    let currentSearchTerm = '';
    if(searchInput.value){
      currentSearchTerm = searchInput.value;
      callback(searchInput.value);
      const { current, total } = searchDetails(cm);
      if(total && total > 0){
        searchCount.classList.remove('hidden');
        searchNoResults.classList.add('hidden');
      } else {
        searchCount.classList.add('hidden');
        searchNoResults.classList.remove('hidden');
      }
      searchTotal.innerText = total;
      searchCurrent.innerText = current;
    }

    CodeMirror.on(searchInput, "keydown", function(e) {
      if (options && options.onKeyDown && options.onKeyDown(e, searchInput.value, close)) {
        return;
      }
      if (e.keyCode == 27 || (options.closeOnEnter !== false && e.keyCode == 13)) {
        callback('', e);
        searchInput.blur();
        CodeMirror.e_stop(e);
        searchCount.classList.add('hidden');
        searchNoResults.classList.remove('hidden');
        CodeMirror.commands.clearSearch(cm);
        close();
        cm.focus();
      }
      if (e.keyCode == 13) {
        if(currentSearchTerm === searchInput.value){
          CodeMirror.commands.findPersistentNext(cm);
          var { current } = searchDetails(cm);
          searchCurrent.innerText = current;
        } else {
          CodeMirror.commands.clearSearch(cm);
          currentSearchTerm = searchInput.value;
          callback(searchInput.value, e);
          var { current, total } = searchDetails(cm);
          if(total && total > 0){
            searchCount.classList.remove('hidden');
            searchNoResults.classList.add('hidden');
          } else {
            searchCount.classList.add('hidden');
            searchNoResults.classList.remove('hidden');
          }
          searchTotal.innerText = total;
          searchCurrent.innerText = current;
        }
      }
    });

    return close;

    if (!options) options = {};

    closeNotification(this, null);

    var dialog = dialogDiv(this, template, options.bottom);
    var closed = false, me = this;
    // function close(newVal) {
    //   if (typeof newVal == 'string') {
    //     inp.value = newVal;
    //   } else {
    //     if (closed) return;
    //     closed = true;
    //     CodeMirror.rmClass(dialog.parentNode, 'dialog-opened');
    //     dialog.parentNode.removeChild(dialog);
    //     me.focus();

    //     if (options.onClose) options.onClose(dialog);
    //   }
    // }

    var inp = dialog.getElementsByTagName("input")[0], button;
    if (inp) {
      inp.focus();

      if (options.value) {
        inp.value = options.value;
        if (options.selectValueOnOpen !== false) {
          inp.select();
        }
      }

      if (options.onInput)
        CodeMirror.on(inp, "input", function(e) { options.onInput(e, inp.value, close);});
      if (options.onKeyUp)
        CodeMirror.on(inp, "keyup", function(e) {options.onKeyUp(e, inp.value, close);});

      CodeMirror.on(inp, "keydown", function(e) {
        if (options && options.onKeyDown && options.onKeyDown(e, inp.value, close)) { return; }
        if (e.keyCode == 27 || (options.closeOnEnter !== false && e.keyCode == 13)) {
          inp.blur();
          CodeMirror.e_stop(e);
          close();
        }
        if (e.keyCode == 13) callback(inp.value, e);
      });

      if (options.closeOnBlur !== false) CodeMirror.on(dialog, "focusout", function (evt) {
        if (evt.relatedTarget !== null) close();
      });
    } else if (button = dialog.getElementsByTagName("button")[0]) {
      CodeMirror.on(button, "click", function() {
        close();
        me.focus();
      });

      if (options.closeOnBlur !== false) CodeMirror.on(button, "blur", close);

      button.focus();
    }
    return close;
  });

  CodeMirror.defineExtension("openConfirm", function(template, callbacks, options) {
    closeNotification(this, null);
    var dialog = dialogDiv(this, template, options && options.bottom);
    var buttons = dialog.getElementsByTagName("button");
    var closed = false, me = this, blurring = 1;
    function close() {
      if (closed) return;
      closed = true;
      CodeMirror.rmClass(dialog.parentNode, 'dialog-opened');
      dialog.parentNode.removeChild(dialog);
      me.focus();
    }
    buttons[0].focus();
    for (var i = 0; i < buttons.length; ++i) {
      var b = buttons[i];
      (function(callback) {
        CodeMirror.on(b, "click", function(e) {
          CodeMirror.e_preventDefault(e);
          close();
          if (callback) callback(me);
        });
      })(callbacks[i]);
      CodeMirror.on(b, "blur", function() {
        --blurring;
        setTimeout(function() { if (blurring <= 0) close(); }, 200);
      });
      CodeMirror.on(b, "focus", function() { ++blurring; });
    }
  });

  /*
   * openNotification
   * Opens a notification, that can be closed with an optional timer
   * (default 5000ms timer) and always closes on click.
   *
   * If a notification is opened while another is opened, it will close the
   * currently opened one and open the new one immediately.
   */
  CodeMirror.defineExtension("openNotification", function(template, options) {
    closeNotification(this, close);
    var dialog = dialogDiv(this, template, options && options.bottom);
    var closed = false, doneTimer;
    var duration = options && typeof options.duration !== "undefined" ? options.duration : 5000;

    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(doneTimer);
      CodeMirror.rmClass(dialog.parentNode, 'dialog-opened');
      dialog.parentNode.removeChild(dialog);
    }

    CodeMirror.on(dialog, 'click', function(e) {
      CodeMirror.e_preventDefault(e);
      close();
    });

    if (duration)
      doneTimer = setTimeout(close, duration);

    return close;
  });
});



// searchcursor.js

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"))
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod)
  else // Plain browser env
    mod(CodeMirror)
})(function(CodeMirror) {
  "use strict"
  var Pos = CodeMirror.Pos

  function regexpFlags(regexp) {
    var flags = regexp.flags
    return flags != null ? flags : (regexp.ignoreCase ? "i" : "")
      + (regexp.global ? "g" : "")
      + (regexp.multiline ? "m" : "")
  }

  function ensureFlags(regexp, flags) {
    var current = regexpFlags(regexp), target = current
    for (var i = 0; i < flags.length; i++) if (target.indexOf(flags.charAt(i)) == -1)
      target += flags.charAt(i)
    return current == target ? regexp : new RegExp(regexp.source, target)
  }

  function maybeMultiline(regexp) {
    return /\\s|\\n|\n|\\W|\\D|\[\^/.test(regexp.source)
  }

  function searchRegexpForward(doc, regexp, start) {
    regexp = ensureFlags(regexp, "g")
    for (var line = start.line, ch = start.ch, last = doc.lastLine(); line <= last; line++, ch = 0) {
      regexp.lastIndex = ch
      var string = doc.getLine(line), match = regexp.exec(string)
      if (match)
        return {from: Pos(line, match.index),
                to: Pos(line, match.index + match[0].length),
                match: match}
    }
  }

  function searchRegexpForwardMultiline(doc, regexp, start) {
    if (!maybeMultiline(regexp)) return searchRegexpForward(doc, regexp, start)

    regexp = ensureFlags(regexp, "gm")
    var string, chunk = 1
    for (var line = start.line, last = doc.lastLine(); line <= last;) {
      // This grows the search buffer in exponentially-sized chunks
      // between matches, so that nearby matches are fast and don't
      // require concatenating the whole document (in case we're
      // searching for something that has tons of matches), but at the
      // same time, the amount of retries is limited.
      for (var i = 0; i < chunk; i++) {
        if (line > last) break
        var curLine = doc.getLine(line++)
        string = string == null ? curLine : string + "\n" + curLine
      }
      chunk = chunk * 2
      regexp.lastIndex = start.ch
      var match = regexp.exec(string)
      if (match) {
        var before = string.slice(0, match.index).split("\n"), inside = match[0].split("\n")
        var startLine = start.line + before.length - 1, startCh = before[before.length - 1].length
        return {from: Pos(startLine, startCh),
                to: Pos(startLine + inside.length - 1,
                        inside.length == 1 ? startCh + inside[0].length : inside[inside.length - 1].length),
                match: match}
      }
    }
  }

  function lastMatchIn(string, regexp, endMargin) {
    var match, from = 0
    while (from <= string.length) {
      regexp.lastIndex = from
      var newMatch = regexp.exec(string)
      if (!newMatch) break
      var end = newMatch.index + newMatch[0].length
      if (end > string.length - endMargin) break
      if (!match || end > match.index + match[0].length)
        match = newMatch
      from = newMatch.index + 1
    }
    return match
  }

  function searchRegexpBackward(doc, regexp, start) {
    regexp = ensureFlags(regexp, "g")
    for (var line = start.line, ch = start.ch, first = doc.firstLine(); line >= first; line--, ch = -1) {
      var string = doc.getLine(line)
      var match = lastMatchIn(string, regexp, ch < 0 ? 0 : string.length - ch)
      if (match)
        return {from: Pos(line, match.index),
                to: Pos(line, match.index + match[0].length),
                match: match}
    }
  }

  function searchRegexpBackwardMultiline(doc, regexp, start) {
    if (!maybeMultiline(regexp)) return searchRegexpBackward(doc, regexp, start)
    regexp = ensureFlags(regexp, "gm")
    var string, chunkSize = 1, endMargin = doc.getLine(start.line).length - start.ch
    for (var line = start.line, first = doc.firstLine(); line >= first;) {
      for (var i = 0; i < chunkSize && line >= first; i++) {
        var curLine = doc.getLine(line--)
        string = string == null ? curLine : curLine + "\n" + string
      }
      chunkSize *= 2

      var match = lastMatchIn(string, regexp, endMargin)
      if (match) {
        var before = string.slice(0, match.index).split("\n"), inside = match[0].split("\n")
        var startLine = line + before.length, startCh = before[before.length - 1].length
        return {from: Pos(startLine, startCh),
                to: Pos(startLine + inside.length - 1,
                        inside.length == 1 ? startCh + inside[0].length : inside[inside.length - 1].length),
                match: match}
      }
    }
  }

  var doFold, noFold
  if (String.prototype.normalize) {
    doFold = function(str) { return str.normalize("NFD").toLowerCase() }
    noFold = function(str) { return str.normalize("NFD") }
  } else {
    doFold = function(str) { return str.toLowerCase() }
    noFold = function(str) { return str }
  }

  // Maps a position in a case-folded line back to a position in the original line
  // (compensating for codepoints increasing in number during folding)
  function adjustPos(orig, folded, pos, foldFunc) {
    if (orig.length == folded.length) return pos
    for (var min = 0, max = pos + Math.max(0, orig.length - folded.length);;) {
      if (min == max) return min
      var mid = (min + max) >> 1
      var len = foldFunc(orig.slice(0, mid)).length
      if (len == pos) return mid
      else if (len > pos) max = mid
      else min = mid + 1
    }
  }

  function searchStringForward(doc, query, start, caseFold) {
    // Empty string would match anything and never progress, so we
    // define it to match nothing instead.
    if (!query.length) return null
    var fold = caseFold ? doFold : noFold
    var lines = fold(query).split(/\r|\n\r?/)

    search: for (var line = start.line, ch = start.ch, last = doc.lastLine() + 1 - lines.length; line <= last; line++, ch = 0) {
      var orig = doc.getLine(line).slice(ch), string = fold(orig)
      if (lines.length == 1) {
        var found = string.indexOf(lines[0])
        if (found == -1) continue search
        var start = adjustPos(orig, string, found, fold) + ch
        return {from: Pos(line, adjustPos(orig, string, found, fold) + ch),
                to: Pos(line, adjustPos(orig, string, found + lines[0].length, fold) + ch)}
      } else {
        var cutFrom = string.length - lines[0].length
        if (string.slice(cutFrom) != lines[0]) continue search
        for (var i = 1; i < lines.length - 1; i++)
          if (fold(doc.getLine(line + i)) != lines[i]) continue search
        var end = doc.getLine(line + lines.length - 1), endString = fold(end), lastLine = lines[lines.length - 1]
        if (endString.slice(0, lastLine.length) != lastLine) continue search
        return {from: Pos(line, adjustPos(orig, string, cutFrom, fold) + ch),
                to: Pos(line + lines.length - 1, adjustPos(end, endString, lastLine.length, fold))}
      }
    }
  }

  function searchStringBackward(doc, query, start, caseFold) {
    if (!query.length) return null
    var fold = caseFold ? doFold : noFold
    var lines = fold(query).split(/\r|\n\r?/)

    search: for (var line = start.line, ch = start.ch, first = doc.firstLine() - 1 + lines.length; line >= first; line--, ch = -1) {
      var orig = doc.getLine(line)
      if (ch > -1) orig = orig.slice(0, ch)
      var string = fold(orig)
      if (lines.length == 1) {
        var found = string.lastIndexOf(lines[0])
        if (found == -1) continue search
        return {from: Pos(line, adjustPos(orig, string, found, fold)),
                to: Pos(line, adjustPos(orig, string, found + lines[0].length, fold))}
      } else {
        var lastLine = lines[lines.length - 1]
        if (string.slice(0, lastLine.length) != lastLine) continue search
        for (var i = 1, start = line - lines.length + 1; i < lines.length - 1; i++)
          if (fold(doc.getLine(start + i)) != lines[i]) continue search
        var top = doc.getLine(line + 1 - lines.length), topString = fold(top)
        if (topString.slice(topString.length - lines[0].length) != lines[0]) continue search
        return {from: Pos(line + 1 - lines.length, adjustPos(top, topString, top.length - lines[0].length, fold)),
                to: Pos(line, adjustPos(orig, string, lastLine.length, fold))}
      }
    }
  }

  function SearchCursor(doc, query, pos, options) {
    this.atOccurrence = false
    this.doc = doc
    pos = pos ? doc.clipPos(pos) : Pos(0, 0)
    this.pos = {from: pos, to: pos}

    var caseFold
    if (typeof options == "object") {
      caseFold = options.caseFold
    } else { // Backwards compat for when caseFold was the 4th argument
      caseFold = options
      options = null
    }

    if (typeof query == "string") {
      if (caseFold == null) caseFold = false
      this.matches = function(reverse, pos) {
        return (reverse ? searchStringBackward : searchStringForward)(doc, query, pos, caseFold)
      }
    } else {
      query = ensureFlags(query, "gm")
      if (!options || options.multiline !== false)
        this.matches = function(reverse, pos) {
          return (reverse ? searchRegexpBackwardMultiline : searchRegexpForwardMultiline)(doc, query, pos)
        }
      else
        this.matches = function(reverse, pos) {
          return (reverse ? searchRegexpBackward : searchRegexpForward)(doc, query, pos)
        }
    }
  }

  SearchCursor.prototype = {
    findNext: function() {return this.find(false)},
    findPrevious: function() {return this.find(true)},

    find: function(reverse) {
      var result = this.matches(reverse, this.doc.clipPos(reverse ? this.pos.from : this.pos.to))

      // Implements weird auto-growing behavior on null-matches for
      // backwards-compatiblity with the vim code (unfortunately)
      while (result && CodeMirror.cmpPos(result.from, result.to) == 0) {
        if (reverse) {
          if (result.from.ch) result.from = Pos(result.from.line, result.from.ch - 1)
          else if (result.from.line == this.doc.firstLine()) result = null
          else result = this.matches(reverse, this.doc.clipPos(Pos(result.from.line - 1)))
        } else {
          if (result.to.ch < this.doc.getLine(result.to.line).length) result.to = Pos(result.to.line, result.to.ch + 1)
          else if (result.to.line == this.doc.lastLine()) result = null
          else result = this.matches(reverse, Pos(result.to.line + 1, 0))
        }
      }

      if (result) {
        this.pos = result
        this.atOccurrence = true
        return this.pos.match || true
      } else {
        var end = Pos(reverse ? this.doc.firstLine() : this.doc.lastLine() + 1, 0)
        this.pos = {from: end, to: end}
        return this.atOccurrence = false
      }
    },

    from: function() {if (this.atOccurrence) return this.pos.from},
    to: function() {if (this.atOccurrence) return this.pos.to},

    replace: function(newText, origin) {
      if (!this.atOccurrence) return
      var lines = CodeMirror.splitLines(newText)
      this.doc.replaceRange(lines, this.pos.from, this.pos.to, origin)
      this.pos.to = Pos(this.pos.from.line + lines.length - 1,
                        lines[lines.length - 1].length + (lines.length == 1 ? this.pos.from.ch : 0))
    }
  }

  CodeMirror.defineExtension("getSearchCursor", function(query, pos, caseFold) {
    return new SearchCursor(this.doc, query, pos, caseFold)
  })
  CodeMirror.defineDocExtension("getSearchCursor", function(query, pos, caseFold) {
    return new SearchCursor(this, query, pos, caseFold)
  })

  CodeMirror.defineExtension("selectMatches", function(query, caseFold) {
    var ranges = []
    var cur = this.getSearchCursor(query, this.getCursor("from"), caseFold)
    while (cur.findNext()) {
      if (CodeMirror.cmpPos(cur.to(), this.getCursor("to")) > 0) break
      ranges.push({anchor: cur.from(), head: cur.to()})
    }
    if (ranges.length)
      this.setSelections(ranges, 0)
  })
});



// search.js

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Define search commands. Depends on dialog.js or another
// implementation of the openDialog method.

// Replace works a little oddly -- it will do the replace on the next
// Ctrl-G (or whatever is bound to findNext) press. You prevent a
// replace by making sure the match is no longer selected when hitting
// Ctrl-G.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("./searchcursor"), require("../dialog/dialog"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "./searchcursor", "../dialog/dialog"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function searchOverlay(query, caseInsensitive) {
    if (typeof query == "string")
      query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), caseInsensitive ? "gi" : "g");
    else if (!query.global)
      query = new RegExp(query.source, query.ignoreCase ? "gi" : "g");

    return {token: function(stream) {
      query.lastIndex = stream.pos;
      var match = query.exec(stream.string);
      if (match && match.index == stream.pos) {
        stream.pos += match[0].length || 1;
        return "searching";
      } else if (match) {
        stream.pos = match.index;
      } else {
        stream.skipToEnd();
      }
    }};
  }

  function SearchState() {
    this.posFrom = this.posTo = this.lastQuery = this.query = null;
    this.overlay = null;
  }

  function getSearchState(cm) {
    return cm.state.search || (cm.state.search = new SearchState());
  }

  function queryCaseInsensitive(query) {
    return typeof query == "string" && query == query.toLowerCase();
  }

  function getSearchCursor(cm, query, pos) {
    // Heuristic: if the query string is all lowercase, do a case insensitive search.
    return cm.getSearchCursor(query, pos, {caseFold: queryCaseInsensitive(query), multiline: true});
  }

  function persistentDialog(cm, text, deflt, onEnter, onKeyDown) {
    cm.openDialog(text, onEnter, {
      value: deflt,
      selectValueOnOpen: true,
      closeOnEnter: false,
      onClose: function() { clearSearch(cm); },
      onKeyDown: onKeyDown
    });
  }

  function dialog(cm, text, shortText, deflt, f) {
    if (cm.openDialog) cm.openDialog(text, f, {value: deflt, selectValueOnOpen: true});
    else f(prompt(shortText, deflt));
  }

  function confirmDialog(cm, text, shortText, fs) {
    if (cm.openConfirm) cm.openConfirm(text, fs);
    else if (confirm(shortText)) fs[0]();
  }

  function parseString(string) {
    return string.replace(/\\([nrt\\])/g, function(match, ch) {
      if (ch == "n") return "\n"
      if (ch == "r") return "\r"
      if (ch == "t") return "\t"
      if (ch == "\\") return "\\"
      return match
    })
  }

  function parseQuery(query) {
    var isRE = query.match(/^\/(.*)\/([a-z]*)$/);
    if (isRE) {
      try { query = new RegExp(isRE[1], isRE[2].indexOf("i") == -1 ? "" : "i"); }
      catch(e) {} // Not a regular expression after all, do a string search
    } else {
      query = parseString(query)
    }
    if (typeof query == "string" ? query == "" : query.test(""))
      query = /x^/;
    return query;
  }

  function startSearch(cm, state, query) {
    state.queryText = query;
    state.query = parseQuery(query);
    cm.removeOverlay(state.overlay, queryCaseInsensitive(state.query));
    state.overlay = searchOverlay(state.query, queryCaseInsensitive(state.query));
    cm.addOverlay(state.overlay);
    if (cm.showMatchesOnScrollbar) {
      if (state.annotate) { state.annotate.clear(); state.annotate = null; }
      state.annotate = cm.showMatchesOnScrollbar(state.query, queryCaseInsensitive(state.query));
    }
  }

  function doSearch(cm, rev, persistent, immediate) {
    var state = getSearchState(cm);
    if (state.query) return findNext(cm, rev);
    var q = cm.getSelection() || state.lastQuery;
    if (q instanceof RegExp && q.source == "x^") q = null
    if (persistent && cm.openDialog) {
      var hiding = null
      var searchNext = function(query, event) {
        CodeMirror.e_stop(event);
        if (!query) return;
        if (query != state.queryText) {
          startSearch(cm, state, query);
          state.posFrom = state.posTo = cm.getCursor();
        }
        if (hiding) hiding.style.opacity = 1
        findNext(cm, event.shiftKey, function(_, to) {
          var dialog
          if (to.line < 3 && document.querySelector &&
              (dialog = cm.display.wrapper.querySelector(".CodeMirror-dialog")) &&
              dialog.getBoundingClientRect().bottom - 4 > cm.cursorCoords(to, "window").top)
            (hiding = dialog).style.opacity = .4
        })
      };
      persistentDialog(cm, getQueryDialog(cm), q, searchNext, function(event, query) {
        var keyName = CodeMirror.keyName(event)
        var extra = cm.getOption('extraKeys'), cmd = (extra && extra[keyName]) || CodeMirror.keyMap[cm.getOption("keyMap")][keyName]
        if (cmd == "findNext" || cmd == "findPrev" ||
          cmd == "findPersistentNext" || cmd == "findPersistentPrev") {
          CodeMirror.e_stop(event);
          startSearch(cm, getSearchState(cm), query);
          cm.execCommand(cmd);
        } else if (cmd == "find" || cmd == "findPersistent") {
          CodeMirror.e_stop(event);
          searchNext(query, event);
        }
      });
      if (immediate && q) {
        startSearch(cm, state, q);
        findNext(cm, rev);
      }
    } else {
      dialog(cm, getQueryDialog(cm), "Search for:", q, function(query) {
        if (query && !state.query) cm.operation(function() {
          startSearch(cm, state, query);
          state.posFrom = state.posTo = cm.getCursor();
          findNext(cm, rev);
        });
      });
    }
  }

  function findNext(cm, rev, callback) {cm.operation(function() {
    var state = getSearchState(cm);
    var cursor = getSearchCursor(cm, state.query, rev ? state.posFrom : state.posTo);
    if (!cursor.find(rev)) {
      cursor = getSearchCursor(cm, state.query, rev ? CodeMirror.Pos(cm.lastLine()) : CodeMirror.Pos(cm.firstLine(), 0));
      if (!cursor.find(rev)) return;
    }
    cm.setSelection(cursor.from(), cursor.to());
    const { clientHeight } = cm.getScrollInfo()
    cm.scrollIntoView({from: cursor.from(), to: cursor.to()}, clientHeight/2 - 50);
    state.posFrom = cursor.from(); state.posTo = cursor.to();
    if (callback) callback(cursor.from(), cursor.to())
  });}

  function clearSearch(cm) {cm.operation(function() {
    var state = getSearchState(cm);
    state.lastQuery = state.query;
    if (!state.query) return;
    state.query = state.queryText = null;
    cm.removeOverlay(state.overlay);
    if (state.annotate) { state.annotate.clear(); state.annotate = null; }
  });}


  function getQueryDialog(cm)  {
    return '<span class="CodeMirror-search-label">' + cm.phrase("Search:") + '</span> <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">' + cm.phrase("(Use /re/ syntax for regexp search)") + '</span>';
  }
  function getReplaceQueryDialog(cm) {
    return ' <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">' + cm.phrase("(Use /re/ syntax for regexp search)") + '</span>';
  }
  function getReplacementQueryDialog(cm) {
    return '<span class="CodeMirror-search-label">' + cm.phrase("With:") + '</span> <input type="text" style="width: 10em" class="CodeMirror-search-field"/>';
  }
  function getDoReplaceConfirm(cm) {
    return '<span class="CodeMirror-search-label">' + cm.phrase("Replace?") + '</span> <button>' + cm.phrase("Yes") + '</button> <button>' + cm.phrase("No") + '</button> <button>' + cm.phrase("All") + '</button> <button>' + cm.phrase("Stop") + '</button> ';
  }

  function replaceAll(cm, query, text) {
    cm.operation(function() {
      for (var cursor = getSearchCursor(cm, query); cursor.findNext();) {
        if (typeof query != "string") {
          var match = cm.getRange(cursor.from(), cursor.to()).match(query);
          cursor.replace(text.replace(/\$(\d)/g, function(_, i) {return match[i];}));
        } else cursor.replace(text);
      }
    });
  }

  function replace(cm, all) {
    if (cm.getOption("readOnly")) return;
    var query = cm.getSelection() || getSearchState(cm).lastQuery;
    var dialogText = '<span class="CodeMirror-search-label">' + (all ? cm.phrase("Replace all:") : cm.phrase("Replace:")) + '</span>';
    dialog(cm, dialogText + getReplaceQueryDialog(cm), dialogText, query, function(query) {
      if (!query) return;
      query = parseQuery(query);
      dialog(cm, getReplacementQueryDialog(cm), cm.phrase("Replace with:"), "", function(text) {
        text = parseString(text)
        if (all) {
          replaceAll(cm, query, text)
        } else {
          clearSearch(cm);
          var cursor = getSearchCursor(cm, query, cm.getCursor("from"));
          var advance = function() {
            var start = cursor.from(), match;
            if (!(match = cursor.findNext())) {
              cursor = getSearchCursor(cm, query);
              if (!(match = cursor.findNext()) ||
                  (start && cursor.from().line == start.line && cursor.from().ch == start.ch)) return;
            }
            cm.setSelection(cursor.from(), cursor.to());
            cm.scrollIntoView({from: cursor.from(), to: cursor.to()});
            confirmDialog(cm, getDoReplaceConfirm(cm), cm.phrase("Replace?"),
                          [function() {doReplace(match);}, advance,
                           function() {replaceAll(cm, query, text)}]);
          };
          var doReplace = function(match) {
            cursor.replace(typeof query == "string" ? text :
                           text.replace(/\$(\d)/g, function(_, i) {return match[i];}));
            advance();
          };
          advance();
        }
      });
    });
  }

  CodeMirror.commands.find = function(cm) {clearSearch(cm); doSearch(cm);};
  CodeMirror.commands.findPersistent = function(cm) {clearSearch(cm); doSearch(cm, false, true);};
  CodeMirror.commands.findPersistentNext = function(cm) {doSearch(cm, false, true, true);};
  CodeMirror.commands.findPersistentPrev = function(cm) {doSearch(cm, true, true, true);};
  CodeMirror.commands.findNext = doSearch;
  CodeMirror.commands.findPrev = function(cm) {doSearch(cm, true);};
  CodeMirror.commands.clearSearch = clearSearch;
  CodeMirror.commands.replace = replace;
  CodeMirror.commands.replaceAll = function(cm) {replace(cm, true);};
});



// annotatescrollbar.js

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineExtension("annotateScrollbar", function(options) {
    if (typeof options == "string") options = {className: options};
    return new Annotation(this, options);
  });

  CodeMirror.defineOption("scrollButtonHeight", 0);

  function Annotation(cm, options) {
    this.cm = cm;
    this.options = options;
    this.buttonHeight = options.scrollButtonHeight || cm.getOption("scrollButtonHeight");
    this.annotations = [];
    this.doRedraw = this.doUpdate = null;
    this.div = cm.getWrapperElement().appendChild(document.createElement("div"));
    this.div.style.cssText = "position: absolute; right: 0; top: 0; z-index: 7; pointer-events: none";
    this.computeScale();

    function scheduleRedraw(delay) {
      clearTimeout(self.doRedraw);
      self.doRedraw = setTimeout(function() { self.redraw(); }, delay);
    }

    var self = this;
    cm.on("refresh", this.resizeHandler = function() {
      clearTimeout(self.doUpdate);
      self.doUpdate = setTimeout(function() {
        if (self.computeScale()) scheduleRedraw(20);
      }, 100);
    });
    cm.on("markerAdded", this.resizeHandler);
    cm.on("markerCleared", this.resizeHandler);
    if (options.listenForChanges !== false)
      cm.on("changes", this.changeHandler = function() {
        scheduleRedraw(250);
      });
  }

  Annotation.prototype.computeScale = function() {
    var cm = this.cm;
    var hScale = (cm.getWrapperElement().clientHeight - cm.display.barHeight - this.buttonHeight * 2) /
      cm.getScrollerElement().scrollHeight
    if (hScale != this.hScale) {
      this.hScale = hScale;
      return true;
    }
  };

  Annotation.prototype.update = function(annotations) {
    this.annotations = annotations;
    this.redraw();
  };

  Annotation.prototype.redraw = function(compute) {
    if (compute !== false) this.computeScale();
    var cm = this.cm, hScale = this.hScale;

    var frag = document.createDocumentFragment(), anns = this.annotations;

    var wrapping = cm.getOption("lineWrapping");
    var singleLineH = wrapping && cm.defaultTextHeight() * 1.5;
    var curLine = null, curLineObj = null;
    function getY(pos, top) {
      if (curLine != pos.line) {
        curLine = pos.line;
        curLineObj = cm.getLineHandle(curLine);
      }
      if ((curLineObj.widgets && curLineObj.widgets.length) ||
          (wrapping && curLineObj.height > singleLineH))
        return cm.charCoords(pos, "local")[top ? "top" : "bottom"];
      var topY = cm.heightAtLine(curLineObj, "local");
      return topY + (top ? 0 : curLineObj.height);
    }

    var lastLine = cm.lastLine()
    if (cm.display.barWidth) for (var i = 0, nextTop; i < anns.length; i++) {
      var ann = anns[i];
      if (ann.to.line > lastLine) continue;
      var top = nextTop || getY(ann.from, true) * hScale;
      var bottom = getY(ann.to, false) * hScale;
      while (i < anns.length - 1) {
        if (anns[i + 1].to.line > lastLine) break;
        nextTop = getY(anns[i + 1].from, true) * hScale;
        if (nextTop > bottom + .9) break;
        ann = anns[++i];
        bottom = getY(ann.to, false) * hScale;
      }
      if (bottom == top) continue;
      var height = Math.max(bottom - top, 3);

      var elt = frag.appendChild(document.createElement("div"));
      elt.style.cssText = "position: absolute; right: 0px; width: " + Math.max(cm.display.barWidth - 1, 2) + "px; top: "
        + (top + this.buttonHeight) + "px; height: " + height + "px";
      elt.className = this.options.className;
      if (ann.id) {
        elt.setAttribute("annotation-id", ann.id);
      }
    }
    this.div.textContent = "";
    this.div.appendChild(frag);
  };

  Annotation.prototype.clear = function() {
    this.cm.off("refresh", this.resizeHandler);
    this.cm.off("markerAdded", this.resizeHandler);
    this.cm.off("markerCleared", this.resizeHandler);
    if (this.changeHandler) this.cm.off("changes", this.changeHandler);
    this.div.parentNode.removeChild(this.div);
  };
});



// matchesonscrollbar.js

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("./searchcursor"), require("../scroll/annotatescrollbar"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "./searchcursor", "../scroll/annotatescrollbar"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineExtension("showMatchesOnScrollbar", function(query, caseFold, options) {
    if (typeof options == "string") options = {className: options};
    if (!options) options = {};
    return new SearchAnnotation(this, query, caseFold, options);
  });

  function SearchAnnotation(cm, query, caseFold, options) {
    this.cm = cm;
    this.options = options;
    var annotateOptions = {listenForChanges: false};
    for (var prop in options) annotateOptions[prop] = options[prop];
    if (!annotateOptions.className) annotateOptions.className = "CodeMirror-search-match";
    this.annotation = cm.annotateScrollbar(annotateOptions);
    this.query = query;
    this.caseFold = caseFold;
    this.gap = {from: cm.firstLine(), to: cm.lastLine() + 1};
    this.matches = [];
    this.update = null;

    this.findMatches();
    this.annotation.update(this.matches);

    var self = this;
    cm.on("change", this.changeHandler = function(_cm, change) { self.onChange(change); });
  }

  var MAX_MATCHES = 1000;

  SearchAnnotation.prototype.findMatches = function() {
    if (!this.gap) return;
    for (var i = 0; i < this.matches.length; i++) {
      var match = this.matches[i];
      if (match.from.line >= this.gap.to) break;
      if (match.to.line >= this.gap.from) this.matches.splice(i--, 1);
    }
    var cursor = this.cm.getSearchCursor(this.query, CodeMirror.Pos(this.gap.from, 0), {caseFold: this.caseFold, multiline: this.options.multiline});
    var maxMatches = this.options && this.options.maxMatches || MAX_MATCHES;
    while (cursor.findNext()) {
      var match = {from: cursor.from(), to: cursor.to()};
      if (match.from.line >= this.gap.to) break;
      this.matches.splice(i++, 0, match);
      if (this.matches.length > maxMatches) break;
    }
    this.gap = null;
  };

  function offsetLine(line, changeStart, sizeChange) {
    if (line <= changeStart) return line;
    return Math.max(changeStart, line + sizeChange);
  }

  SearchAnnotation.prototype.onChange = function(change) {
    var startLine = change.from.line;
    var endLine = CodeMirror.changeEnd(change).line;
    var sizeChange = endLine - change.to.line;
    if (this.gap) {
      this.gap.from = Math.min(offsetLine(this.gap.from, startLine, sizeChange), change.from.line);
      this.gap.to = Math.max(offsetLine(this.gap.to, startLine, sizeChange), change.from.line);
    } else {
      this.gap = {from: change.from.line, to: endLine + 1};
    }

    if (sizeChange) for (var i = 0; i < this.matches.length; i++) {
      var match = this.matches[i];
      var newFrom = offsetLine(match.from.line, startLine, sizeChange);
      if (newFrom != match.from.line) match.from = CodeMirror.Pos(newFrom, match.from.ch);
      var newTo = offsetLine(match.to.line, startLine, sizeChange);
      if (newTo != match.to.line) match.to = CodeMirror.Pos(newTo, match.to.ch);
    }
    clearTimeout(this.update);
    var self = this;
    this.update = setTimeout(function() { self.updateAfterChange(); }, 250);
  };

  SearchAnnotation.prototype.updateAfterChange = function() {
    this.findMatches();
    this.annotation.update(this.matches);
  };

  SearchAnnotation.prototype.clear = function() {
    this.cm.off("change", this.changeHandler);
    this.annotation.clear();
  };
});



// jump-to-line.js

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Defines jumpToLine command. Uses dialog.js if present.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../dialog/dialog"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../dialog/dialog"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function dialog(cm, text, shortText, deflt, f) {
    if (cm.openDialog) cm.openDialog(text, f, {value: deflt, selectValueOnOpen: true});
    else f(prompt(shortText, deflt));
  }

  function getJumpDialog(cm) {
    return cm.phrase("Jump to line:") + ' <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">' + cm.phrase("(Use line:column or scroll% syntax)") + '</span>';
  }

  function interpretLine(cm, string) {
    var num = Number(string)
    if (/^[-+]/.test(string)) return cm.getCursor().line + num
    else return num - 1
  }

  CodeMirror.commands.jumpToLine = function(cm) {
    var cur = cm.getCursor();
    dialog(cm, getJumpDialog(cm), cm.phrase("Jump to line:"), (cur.line + 1) + ":" + cur.ch, function(posStr) {
      if (!posStr) return;

      var match;
      if (match = /^\s*([\+\-]?\d+)\s*\:\s*(\d+)\s*$/.exec(posStr)) {
        cm.setCursor(interpretLine(cm, match[1]), Number(match[2]))
      } else if (match = /^\s*([\+\-]?\d+(\.\d+)?)\%\s*/.exec(posStr)) {
        var line = Math.round(cm.lineCount() * Number(match[1]) / 100);
        if (/^[-+]/.test(match[1])) line = cur.line + line + 1;
        cm.setCursor(line - 1, cur.ch);
      } else if (match = /^\s*\:?\s*([\+\-]?\d+)\s*/.exec(posStr)) {
        cm.setCursor(interpretLine(cm, match[1]), cur.ch);
      }
    });
  };

  CodeMirror.keyMap["default"]["Alt-G"] = "jumpToLine";
});









// -----  codemirror-show-invisibles.js
'use strict';

/* global CodeMirror */
/* global define */

((mod) => {
    if (typeof exports === 'object' && typeof module === 'object') // CommonJS
        return mod(require('codemirror/lib/codemirror'));

    if (typeof define === 'function' && define.amd) // AMD
        return define(['codemirror/lib/codemirror'], mod);

    mod(CodeMirror);
})((CodeMirror) => {
    CodeMirror.defineOption('showInvisibles', false, (cm, val, prev) => {
        let Count = 0;
        const Maximum = cm.getOption('maxInvisibles') || 16;

        if (prev === CodeMirror.Init)
            prev = false;

        if (prev && !val) {
            cm.removeOverlay('invisibles');
            return rm();
        }

        if (!prev && val) {
            add(Maximum);

            cm.addOverlay({
                name: 'invisibles',
                token: function nextToken(stream) {
                    let spaces = 0;
                    let peek = stream.peek() === ' ';

                    if (peek) {
                        while (peek && spaces < Maximum) {
                            ++spaces;

                            stream.next();
                            peek = stream.peek() === ' ';
                        }

                        let ret = 'whitespace whitespace-' + spaces;

                        /*
                         * styles should be different
                         * could not be two same styles
                         * beside because of this check in runmode
                         * function in `codemirror.js`:
                         *
                         * 6624: if (!flattenSpans || curStyle != style) {}
                         */
                        if (spaces === Maximum)
                            ret += ' whitespace-rand-' + Count++;

                        return ret;
                    }

                    while (!stream.eol() && !peek) {
                        stream.next();

                        peek = stream.peek() === ' ';
                    }

                    return 'cm-eol';
                },
            });
        }
    });

    function add(max) {
        const classBase = '.CodeMirror .cm-whitespace-';
        const spaceChar = '·';
        const style = document.createElement('style');

        style.setAttribute('data-name', 'js-show-invisibles');

        let rules = '';
        let spaceChars = '';

        for (let i = 1; i <= max; ++i) {
            spaceChars += spaceChar;
            rules += classBase + i + `:not([class*="cm-trailing-space-"])::before { content: "${spaceChars}";}\n`;
        }

        const gfmRules = '[class*=cm-trailing-space]::before{content: "·";}';

        style.textContent = [
            getStyle(),
            getEOL(),
            rules,
            gfmRules,
        ].join('\n');

        document.head.appendChild(style);
    }

    function rm() {
        const style = document.querySelector('[data-name="js-show-invisibles"]');
        document.head.removeChild(style);
    }

    function getStyle() {
        /*
        const style = [
            '.cm-whitespace::before {',
                'position: absolute;',
                'pointer-events: none;',
                //'color: #404F7D;',
                'color: rgba(var( --main-theme-highlight-color),0.4);',
                'filter: brightness(5);',
            '}',
        ].join('');
        */

        const style = `.cm-whitespace::before {
            position: absolute;
            pointer-events: none;
            filter: saturate(0);
            opacity: .35;
        }`.split('\n').join('');

        return style;
    }

    function getEOL() {
        const style = [
            // NOTE: I don't really like seeing EOL characters...
            // TODO: should append style for tabs, though (right now it's in CSS)
            // '.CodeMirror-code > div > pre > span::after, .CodeMirror-line > span::after {',
            // 'pointer-events: none;',
            // 'color: #404F7D;',
            // 'content: "¬"',
            // '}',
        ].join('');

        return style;
    }
});








// -----  foldcode.js
!function(n){"object"==typeof exports&&"object"==typeof module?n(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],n):n(CodeMirror)}(function(c){"use strict";function t(t,i,n,l){var f;n&&n.call?(f=n,n=null):f=a(t,n,"rangeFinder"),"number"==typeof i&&(i=c.Pos(i,0));var d=a(t,n,"minFoldSize");function o(n){var o=f(t,i);if(!o||o.to.line-o.from.line<d)return null;for(var e=t.findMarksAt(o.from),r=0;r<e.length;++r)if(e[r].__isFold&&"fold"!==l){if(!n)return null;o.cleared=!0,e[r].clear()}return o}var e,r,u=o(!0);if(a(t,n,"scanUp"))for(;!u&&i.line>t.firstLine();)i=c.Pos(i.line-1,0),u=o(!1);u&&!u.cleared&&"unfold"!==l&&(e=function(n,o,e){o=a(n,o,"widget");"function"==typeof o&&(o=o(e.from,e.to));"string"==typeof o?(e=document.createTextNode(o),(o=document.createElement("span")).appendChild(e),o.className="CodeMirror-foldmarker"):o=o&&o.cloneNode(!0);return o}(t,n,u),c.on(e,"mousedown",function(n){r.clear(),c.e_preventDefault(n)}),(r=t.markText(u.from,u.to,{replacedWith:e,clearOnEnter:a(t,n,"clearOnEnter"),__isFold:!0})).on("clear",function(n,o){c.signal(t,"unfold",t,n,o)}),c.signal(t,"fold",t,u.from,u.to))}c.newFoldFunction=function(e,r){return function(n,o){t(n,o,{rangeFinder:e,widget:r})}},c.defineExtension("foldCode",function(n,o,e){t(this,n,o,e)}),c.defineExtension("isFolded",function(n){for(var o=this.findMarksAt(n),e=0;e<o.length;++e)if(o[e].__isFold)return!0}),c.commands.toggleFold=function(n){n.foldCode(n.getCursor())},c.commands.fold=function(n){n.foldCode(n.getCursor(),null,"fold")},c.commands.unfold=function(n){n.foldCode(n.getCursor(),null,"unfold")},c.commands.foldAll=function(e){e.operation(function(){for(var n=e.firstLine(),o=e.lastLine();n<=o;n++)e.foldCode(c.Pos(n,0),null,"fold")})},c.commands.unfoldAll=function(e){e.operation(function(){for(var n=e.firstLine(),o=e.lastLine();n<=o;n++)e.foldCode(c.Pos(n,0),null,"unfold")})},c.registerHelper("fold","combine",function(){var t=Array.prototype.slice.call(arguments,0);return function(n,o){for(var e=0;e<t.length;++e){var r=t[e](n,o);if(r)return r}}}),c.registerHelper("fold","auto",function(n,o){for(var e=n.getHelpers(o,"fold"),r=0;r<e.length;r++){var t=e[r](n,o);if(t)return t}});var r={rangeFinder:c.fold.auto,widget:"↔",minFoldSize:0,scanUp:!1,clearOnEnter:!0};function a(n,o,e){if(o&&void 0!==o[e])return o[e];n=n.options.foldOptions;return(n&&void 0!==n[e]?n:r)[e]}c.defineOption("foldOptions",null),c.defineExtension("foldOption",function(n,o){return a(this,n,o)})});






// -----  foldgutter.js
!function(t){"object"==typeof exports&&"object"==typeof module?t(require("../../lib/codemirror"),require("./foldcode")):"function"==typeof define&&define.amd?define(["../../lib/codemirror","./foldcode"],t):t(CodeMirror)}(function(r){"use strict";r.defineOption("foldGutter",!1,function(t,o,e){e&&e!=r.Init&&(t.clearGutter(t.state.foldGutter.options.gutter),t.state.foldGutter=null,t.off("gutterClick",d),t.off("changes",a),t.off("viewportChange",u),t.off("fold",l),t.off("unfold",l),t.off("swapDoc",a)),o&&(t.state.foldGutter=new n(function(t){!0===t&&(t={});null==t.gutter&&(t.gutter="CodeMirror-foldgutter");null==t.indicatorOpen&&(t.indicatorOpen="CodeMirror-foldgutter-open");null==t.indicatorFolded&&(t.indicatorFolded="CodeMirror-foldgutter-folded");return t}(o)),f(t),t.on("gutterClick",d),t.on("changes",a),t.on("viewportChange",u),t.on("fold",l),t.on("unfold",l),t.on("swapDoc",a))});var c=r.Pos;function n(t){this.options=t,this.from=this.to=0}function s(t,o){for(var e=t.findMarks(c(o,0),c(o+1,0)),r=0;r<e.length;++r)if(e[r].__isFold){var n=e[r].find(-1);if(n&&n.line===o)return e[r]}}function p(t){if("string"!=typeof t)return t.cloneNode(!0);var o=document.createElement("div");return o.className=t+" CodeMirror-guttermarker-subtle",o}function i(n,t,o){var i=n.state.foldGutter.options,f=t-1,d=n.foldOption(i,"minFoldSize"),a=n.foldOption(i,"rangeFinder"),u="string"==typeof i.indicatorFolded&&e(i.indicatorFolded),l="string"==typeof i.indicatorOpen&&e(i.indicatorOpen);n.eachLine(t,o,function(t){++f;var o=null,e=(e=t.gutterMarkers)&&e[i.gutter];if(s(n,f)){if(u&&e&&u.test(e.className))return;o=p(i.indicatorFolded)}else{var r=c(f,0),r=a&&a(n,r);if(r&&r.to.line-r.from.line>=d){if(l&&e&&l.test(e.className))return;o=p(i.indicatorOpen)}}(o||e)&&n.setGutterMarker(t,i.gutter,o)})}function e(t){return new RegExp("(^|\\s)"+t+"(?:$|\\s)\\s*")}function f(t){var o=t.getViewport(),e=t.state.foldGutter;e&&(t.operation(function(){i(t,o.from,o.to)}),e.from=o.from,e.to=o.to)}function d(t,o,e){var r=t.state.foldGutter;!r||e==(e=r.options).gutter&&((r=s(t,o))?r.clear():t.foldCode(c(o,0),e))}function a(t){var o,e=t.state.foldGutter;e&&(o=e.options,e.from=e.to=0,clearTimeout(e.changeUpdate),e.changeUpdate=setTimeout(function(){f(t)},o.foldOnChangeTimeSpan||600))}function u(o){var t,e=o.state.foldGutter;e&&(t=e.options,clearTimeout(e.changeUpdate),e.changeUpdate=setTimeout(function(){var t=o.getViewport();e.from==e.to||20<t.from-e.to||20<e.from-t.to?f(o):o.operation(function(){t.from<e.from&&(i(o,t.from,e.from),e.from=t.from),t.to>e.to&&(i(o,e.to,t.to),e.to=t.to)})},t.updateViewportTimeSpan||400))}function l(t,o){var e=t.state.foldGutter;!e||(o=o.line)>=e.from&&o<e.to&&i(t,o,o+1)}});






// -----  brace-fold.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(k){"use strict";k.registerHelper("fold","brace",function(i,o){var l,f=o.line,s=i.getLine(f);function e(e){for(var r=o.ch,n=0;;){var t=r<=0?-1:s.lastIndexOf(e,r-1);if(-1!=t){if(1==n&&t<o.ch)break;if(l=i.getTokenTypeAt(k.Pos(f,t+1)),!/^(comment|string)/.test(l))return t+1;r=t-1}else{if(1==n)break;n=1,r=s.length}}}var r="{",n="}",t=e("{");if(null==t&&(n="]",t=e(r="[")),null!=t){var u,a,d=1,c=i.lastLine();e:for(var g=f;g<=c;++g)for(var v=i.getLine(g),p=g==f?t:0;;){var m=v.indexOf(r,p),P=v.indexOf(n,p);if(m<0&&(m=v.length),P<0&&(P=v.length),(p=Math.min(m,P))==v.length)break;if(i.getTokenTypeAt(k.Pos(g,p+1))==l)if(p==m)++d;else if(!--d){u=g,a=p;break e}++p}if(null!=u&&f!=u)return{from:k.Pos(f,t),to:k.Pos(u,a)}}}),k.registerHelper("fold","import",function(o,e){function r(e){if(e<o.firstLine()||e>o.lastLine())return null;var r=o.getTokenAt(k.Pos(e,1));if(/\S/.test(r.string)||(r=o.getTokenAt(k.Pos(e,r.end+1))),"keyword"!=r.type||"import"!=r.string)return null;for(var n=e,t=Math.min(o.lastLine(),e+10);n<=t;++n){var i=o.getLine(n).indexOf(";");if(-1!=i)return{startCh:r.end,end:k.Pos(n,i)}}}var n=e.line,t=r(n);if(!t||r(n-1)||(e=r(n-2))&&e.end.line==n-1)return null;for(var i=t.end;;){var l=r(i.line+1);if(null==l)break;i=l.end}return{from:o.clipPos(k.Pos(n,t.startCh+1)),to:i}}),k.registerHelper("fold","include",function(n,e){function r(e){if(e<n.firstLine()||e>n.lastLine())return null;var r=n.getTokenAt(k.Pos(e,1));return/\S/.test(r.string)||(r=n.getTokenAt(k.Pos(e,r.end+1))),"meta"==r.type&&"#include"==r.string.slice(0,8)?r.start+8:void 0}var t=e.line,e=r(t);if(null==e||null!=r(t-1))return null;for(var i=t;;){if(null==r(i+1))break;++i}return{from:k.Pos(t,e+1),to:n.clipPos(k.Pos(i))}})});






// -----  xml-fold.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(e){"use strict";var l=e.Pos;function o(e,n){return e.line-n.line||e.ch-n.ch}var n="A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD",i=new RegExp("<(/?)(["+n+"][A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD-:.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*)","g");function c(e,n,t,i){this.line=n,this.ch=t,this.cm=e,this.text=e.getLine(n),this.min=i?Math.max(i.from,e.firstLine()):e.firstLine(),this.max=i?Math.min(i.to-1,e.lastLine()):e.lastLine()}function a(e,n){n=e.cm.getTokenTypeAt(l(e.line,n));return n&&/\btag\b/.test(n)}function r(e){return!(e.line>=e.max)&&(e.ch=0,e.text=e.cm.getLine(++e.line),1)}function s(e){return!(e.line<=e.min)&&(e.text=e.cm.getLine(--e.line),e.ch=e.text.length,1)}function h(e){for(;;){var n=e.text.indexOf(">",e.ch);if(-1==n){if(r(e))continue;return}if(a(e,n+1)){var t=e.text.lastIndexOf("/",n),t=-1<t&&!/\S/.test(e.text.slice(t+1,n));return e.ch=n+1,t?"selfClose":"regular"}e.ch=n+1}}function F(e){for(;;){var n=e.ch?e.text.lastIndexOf("<",e.ch-1):-1;if(-1==n){if(s(e))continue;return}if(a(e,n+1)){i.lastIndex=n,e.ch=n;var t=i.exec(e.text);if(t&&t.index==n)return t}else e.ch=n}}function x(e){for(;;){i.lastIndex=e.ch;var n=i.exec(e.text);if(!n){if(r(e))continue;return}if(a(e,n.index+1))return e.ch=n.index+n[0].length,n;e.ch=n.index+1}}function g(e,n){for(var t=[];;){var i,r=x(e),u=e.line,f=e.ch-(r?r[0].length:0);if(!r||!(i=h(e)))return;if("selfClose"!=i)if(r[1]){for(var o=t.length-1;0<=o;--o)if(t[o]==r[2]){t.length=o;break}if(o<0&&(!n||n==r[2]))return{tag:r[2],from:l(u,f),to:l(e.line,e.ch)}}else t.push(r[2])}}function d(e,n){for(var t=[];;){var i=function(e){for(;;){var n=e.ch?e.text.lastIndexOf(">",e.ch-1):-1;if(-1==n){if(s(e))continue;return}if(a(e,n+1)){var t=e.text.lastIndexOf("/",n),t=-1<t&&!/\S/.test(e.text.slice(t+1,n));return e.ch=n+1,t?"selfClose":"regular"}e.ch=n}}(e);if(!i)return;if("selfClose"!=i){var r=e.line,i=e.ch,u=F(e);if(!u)return;if(u[1])t.push(u[2]);else{for(var f=t.length-1;0<=f;--f)if(t[f]==u[2]){t.length=f;break}if(f<0&&(!n||n==u[2]))return{tag:u[2],from:l(e.line,e.ch),to:l(r,i)}}}else F(e)}}e.registerHelper("fold","xml",function(e,n){for(var t=new c(e,n.line,0);;){var i=x(t);if(!i||t.line!=n.line)return;var r=h(t);if(!r)return;if(!i[1]&&"selfClose"!=r){r=l(t.line,t.ch),i=g(t,i[2]);return i&&0<o(i.from,r)?{from:r,to:i.from}:null}}}),e.findMatchingTag=function(e,n,t){var i=new c(e,n.line,n.ch,t);if(-1!=i.text.indexOf(">")||-1!=i.text.indexOf("<")){var r=h(i),u=r&&l(i.line,i.ch),f=r&&F(i);if(r&&f&&!(0<o(i,n))){n={from:l(i.line,i.ch),to:u,tag:f[2]};return"selfClose"==r?{open:n,close:null,at:"open"}:f[1]?{open:d(i,f[2]),close:n,at:"close"}:{open:n,close:g(i=new c(e,u.line,u.ch,t),f[2]),at:"open"}}}},e.findEnclosingTag=function(e,n,t,i){for(var r=new c(e,n.line,n.ch,t);;){var u=d(r,i);if(!u)break;var f=g(new c(e,n.line,n.ch,t),u.tag);if(f)return{open:u,close:f}}},e.scanForClosingTag=function(e,n,t,i){return g(new c(e,n.line,n.ch,i?{from:0,to:i}:null),t)}});






// -----  indent-fold.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(l){"use strict";function u(e,n){var t=e.getLine(n),i=t.search(/\S/);return-1==i||/\bcomment\b/.test(e.getTokenTypeAt(l.Pos(n,i+1)))?-1:l.countColumn(t,null,e.getOption("tabSize"))}l.registerHelper("fold","indent",function(e,n){var t=u(e,n.line);if(!(t<0)){for(var i=null,o=n.line+1,r=e.lastLine();o<=r;++o){var f=u(e,o);if(-1!=f){if(!(t<f))break;i=o}}return i?{from:l.Pos(n.line,e.getLine(n.line).length),to:l.Pos(i,e.getLine(i).length)}:void 0}})});






// -----  markdown-fold.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(d){"use strict";d.registerHelper("fold","markdown",function(n,e){function i(e){e=n.getTokenTypeAt(d.Pos(e,0));return e&&/\bheader\b/.test(e)}function t(e,n,t){n=n&&n.match(/^#+/);return n&&i(e)?n[0].length:(n=t&&t.match(/^[=\-]+\s*$/))&&i(e+1)?"="==t[0]?1:2:100}var o=n.getLine(e.line),r=n.getLine(e.line+1),f=t(e.line,o,r);if(100!==f){for(var l=n.lastLine(),c=e.line,u=n.getLine(c+2);c<l&&!(t(c+1,r,u)<=f);)++c,r=u,u=n.getLine(c+2);return{from:d.Pos(e.line,o.length),to:d.Pos(c,n.getLine(c).length)}}})});






// -----  comment-fold.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(y){"use strict";y.registerGlobalHelper("fold","comment",function(e){return e.blockCommentStart&&e.blockCommentEnd},function(e,t){var n=e.getModeAt(t),o=n.blockCommentStart,r=n.blockCommentEnd;if(o&&r){for(var i,f=t.line,l=e.getLine(f),c=t.ch,m=0;;){var a=c<=0?-1:l.lastIndexOf(o,c-1);if(-1!=a){if(1==m&&a<t.ch)return;if(/comment/.test(e.getTokenTypeAt(y.Pos(f,a+1)))&&(0==a||l.slice(a-r.length,a)==r||!/comment/.test(e.getTokenTypeAt(y.Pos(f,a))))){i=a+o.length;break}c=a-1}else{if(1==m)return;m=1,c=l.length}}var d,s,u=1,b=e.lastLine();e:for(var g=f;g<=b;++g)for(var h=e.getLine(g),k=g==f?i:0;;){var p=h.indexOf(o,k),v=h.indexOf(r,k);if(p<0&&(p=h.length),v<0&&(v=h.length),(k=Math.min(p,v))==h.length)break;if(k==p)++u;else if(!--u){d=g,s=k;break e}++k}if(null!=d&&(f!=d||s!=i))return{from:y.Pos(f,i),to:y.Pos(d,s)}}})});






// -----  panel.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(e){function s(e,t,i,n){this.cm=e,this.node=t,this.options=i,this.height=n,this.cleared=!1}function p(e,t){for(var i=t.nextSibling;i;i=i.nextSibling)if(i==e.getWrapperElement())return 1}e.defineExtension("addPanel",function(e,t){t=t||{},this.state.panels||function(n){var e=n.getWrapperElement(),t=window.getComputedStyle?window.getComputedStyle(e):e.currentStyle,r=parseInt(t.height),o=n.state.panels={setHeight:e.style.height,panels:[],wrapper:document.createElement("div")};e.parentNode.insertBefore(o.wrapper,e);t=n.hasFocus();o.wrapper.appendChild(e),t&&n.focus();n._setSize=n.setSize,null!=r&&(n.setSize=function(e,t){t=t||o.wrapper.offsetHeight,"number"!=typeof(o.setHeight=t)&&(t=(i=/^(\d+\.?\d*)px$/.exec(t))?Number(i[1]):(o.wrapper.style.height=t,o.wrapper.offsetHeight));var i=t-o.panels.map(function(e){return e.node.getBoundingClientRect().height}).reduce(function(e,t){return e+t},0);n._setSize(e,i),r=t})}(this);var i=this.state.panels,n=i.wrapper,r=this.getWrapperElement(),o=t.replace instanceof s&&!t.replace.cleared;t.after instanceof s&&!t.after.cleared?n.insertBefore(e,t.before.node.nextSibling):t.before instanceof s&&!t.before.cleared?n.insertBefore(e,t.before.node):o?(n.insertBefore(e,t.replace.node),t.replace.clear(!0)):"bottom"==t.position?n.appendChild(e):"before-bottom"==t.position?n.insertBefore(e,r.nextSibling):"after-top"==t.position?n.insertBefore(e,r):n.insertBefore(e,n.firstChild);r=t&&t.height||e.offsetHeight,n=new s(this,e,t,r);return i.panels.push(n),this.setSize(),t.stable&&p(this,e)&&this.scrollTo(null,this.getScrollInfo().top+r),n}),s.prototype.clear=function(e){var t;this.cleared||(this.cleared=!0,(t=this.cm.state.panels).panels.splice(t.panels.indexOf(this),1),this.cm.setSize(),this.options.stable&&p(this.cm,this.node)&&this.cm.scrollTo(null,this.cm.getScrollInfo().top-this.height),t.wrapper.removeChild(this.node),0!=t.panels.length||e||function(e){var t=e.state.panels;e.state.panels=null;var i=e.getWrapperElement();t.wrapper.parentNode.replaceChild(i,t.wrapper),i.style.height=t.setHeight,e.setSize=e._setSize,e.setSize()}(this.cm))},s.prototype.changed=function(){this.height=this.node.getBoundingClientRect().height,this.cm.setSize()}});






// -----  comment.js
!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(e){"use strict";var L={},x=/[^\s\u00a0]/,R=e.Pos,u=e.cmpPos;function f(e){e=e.search(x);return-1==e?0:e}function O(e,n){var t=e.getMode();return!1!==t.useInnerComments&&t.innerMode?e.getModeAt(n):t}e.commands.toggleComment=function(e){e.toggleComment()},e.defineExtension("toggleComment",function(e){e=e||L;for(var n=this,t=1/0,i=this.listSelections(),l=null,o=i.length-1;0<=o;o--){var r=i[o].from(),m=i[o].to();r.line>=t||(m.line>=t&&(m=R(t,0)),t=r.line,null==l?l=n.uncomment(r,m,e)?"un":(n.lineComment(r,m,e),"line"):"un"==l?n.uncomment(r,m,e):n.lineComment(r,m,e))}}),e.defineExtension("lineComment",function(o,e,r){r=r||L;var n,m,a,c,g,s=this,t=O(s,o),i=s.getLine(o.line);null!=i&&(n=o,i=i,!/\bstring\b/.test(s.getTokenTypeAt(R(n.line,0)))||/^[\'\"\`]/.test(i))&&((m=r.lineComment||t.lineComment)?(a=Math.min(0!=e.ch||e.line==o.line?e.line+1:e.line,s.lastLine()+1),c=null==r.padding?" ":r.padding,g=r.commentBlankLines||o.line==e.line,s.operation(function(){if(r.indent){for(var e=null,n=o.line;n<a;++n){var t=(i=s.getLine(n)).slice(0,f(i));(null==e||e.length>t.length)&&(e=t)}for(n=o.line;n<a;++n){var i=s.getLine(n),l=e.length;(g||x.test(i))&&(i.slice(0,l)!=e&&(l=f(i)),s.replaceRange(e+m+c,R(n,0),R(n,l)))}}else for(n=o.line;n<a;++n)(g||x.test(s.getLine(n)))&&s.replaceRange(m+c,R(n,0))})):(r.blockCommentStart||t.blockCommentStart)&&(r.fullLines=!0,s.blockComment(o,e,r)))}),e.defineExtension("blockComment",function(o,r,m){m=m||L;var a,c,g=this,s=O(g,o),f=m.blockCommentStart||s.blockCommentStart,d=m.blockCommentEnd||s.blockCommentEnd;f&&d?/\bcomment\b/.test(g.getTokenTypeAt(R(o.line,0)))||((a=Math.min(r.line,g.lastLine()))!=o.line&&0==r.ch&&x.test(g.getLine(a))&&--a,c=null==m.padding?" ":m.padding,o.line>a||g.operation(function(){if(0!=m.fullLines){var e=x.test(g.getLine(a));g.replaceRange(c+d,R(a)),g.replaceRange(f+c,R(o.line,0));var n=m.blockCommentLead||s.blockCommentLead;if(null!=n)for(var t=o.line+1;t<=a;++t)t==a&&!e||g.replaceRange(n+c,R(t,0))}else{var i=0==u(g.getCursor("to"),r),l=!g.somethingSelected();g.replaceRange(d,r),i&&g.setSelection(l?r:g.getCursor("from"),r),g.replaceRange(f,o)}})):(m.lineComment||s.lineComment)&&0!=m.fullLines&&g.lineComment(o,r,m)}),e.defineExtension("uncomment",function(e,n,t){t=t||L;var l,o=this,i=O(o,e),r=Math.min(0!=n.ch||n.line==e.line?n.line:n.line-1,o.lastLine()),m=Math.min(e.line,r),a=t.lineComment||i.lineComment,c=[],g=null==t.padding?" ":t.padding;e:if(a){for(var s=m;s<=r;++s){var f=o.getLine(s),d=f.indexOf(a);if(-1<d&&!/comment/.test(o.getTokenTypeAt(R(s,d+1)))&&(d=-1),-1==d&&x.test(f))break e;if(-1<d&&x.test(f.slice(0,d)))break e;c.push(f)}if(o.operation(function(){for(var e=m;e<=r;++e){var n=c[e-m],t=n.indexOf(a),i=t+a.length;t<0||(n.slice(i,i+g.length)==g&&(i+=g.length),l=!0,o.replaceRange("",R(e,t),R(e,i)))}}),l)return!0}var u=t.blockCommentStart||i.blockCommentStart,h=t.blockCommentEnd||i.blockCommentEnd;if(!u||!h)return!1;var C=t.blockCommentLead||i.blockCommentLead,p=o.getLine(m),b=p.indexOf(u);if(-1==b)return!1;var k=r==m?p:o.getLine(r),v=k.indexOf(h,r==m?b+u.length:0),t=R(m,b+1),i=R(r,v+1);if(-1==v||!/comment/.test(o.getTokenTypeAt(t))||!/comment/.test(o.getTokenTypeAt(i))||-1<o.getRange(t,i,"\n").indexOf(h))return!1;i=-1==(t=p.lastIndexOf(u,e.ch))?-1:p.slice(0,e.ch).indexOf(h,t+u.length);if(-1!=t&&-1!=i&&i+h.length!=e.ch)return!1;i=k.indexOf(h,n.ch);e=k.slice(n.ch).lastIndexOf(u,i-n.ch),t=-1==i||-1==e?-1:n.ch+e;return(-1==i||-1==t||t==n.ch)&&(o.operation(function(){o.replaceRange("",R(r,v-(g&&k.slice(v-g.length,v)==g?g.length:0)),R(r,v+h.length));var e=b+u.length;if(g&&p.slice(e,e+g.length)==g&&(e+=g.length),o.replaceRange("",R(m,b),R(m,e)),C)for(var n=m+1;n<=r;++n){var t,i=o.getLine(n),l=i.indexOf(C);-1==l||x.test(i.slice(0,l))||(t=l+C.length,g&&i.slice(t,t+g.length)==g&&(t+=g.length),o.replaceRange("",R(n,l),R(n,t)))}}),!0)})});






// -----  minimap.js
(function(mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define(["../../lib/codemirror"], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function(CodeMirror) {
	"use strict";

	let SidebarInstance;
	const ALMOST_ZERO_TRUTHY = 1e-20;
	const syntaxColorsTokens = {
		'#text': 'rgba(255,255,255,1)',
		'#space': 'transparent',
	};
	let colors;
	const fontSize = 1.85;
	const fontWidth = fontSize * .55;
	const leftMargin = 5;

	const tokenlist = [
		"#text", "#space", "comment", "string", "string-2", "number", "variable", "variable-2",
		"def", "operator", "keyword", "atom", "meta", "tag", "tag bracket", "attribute", "qualifier",
		"property", "builtin", "variable-3", "type", "string property", "tab"
	];

	const htmlToElement = function htmlToElement(html) {
		const template = document.createElement('template');
		template.innerHTML = (html||'').trim();
		return template.content.firstChild;
	};

	document.body.append(htmlToElement(`
	<style>
		.cm-sidebar {
			position: absolute;
			right: 7px;
			top: 0;
			bottom: 0;
			width: 100px;
		}
		.cm-sidebar .side {
			width: 100%;
			background: #1e1e1e;
			position: relative;
			height: 100%;
			border-right: 1px solid #333;
			z-index: 9;
		}
		.cm-sidebar .overflow {
			box-shadow: -2px 0px 3px 0px #0000004d;
		}
		.cm-sidebar .side {
			overflow-y: hidden;
			position: relative;
		}
		.cm-sidebar .side canvas {
			position: absolute;
		}
		.cm-sidebar .side .scroll-handle {
			position: absolute;
			top: 0;
			width: 100%;
			background: #fff;
			opacity: 0;
			transition: opacity .2s;
		}
		.cm-sidebar .side:hover .scroll-handle,
		.cm-sidebar .scroll-handle.dragging {
			opacity: 0.07;
		}
	</style>
	`));

	const getLineTokens = (line, i, editor) => {
		const lineTokens = editor.getLineTokens(i, true);
		if(!lineTokens.length){
			return {
				offset: 0,
				token: '#text',
				text: line
			};
		}
		return lineTokens.map((x) => {
			const { start, type, string } = x;
			return {
				offset: start,
				token: type || '#text',
				text: string
			};
		})
	};

	const SyntaxColors = (parent) => {
		for (var i = 0, len = tokenlist.length; i < len; i++) {
				var key = tokenlist[i];
				if(['#text', '#space'].includes(key)) continue;
				const span = document.createElement("span");
				span.className = "cm-" + key.replace(" ", " cm-");
				span.innerText = span;
				parent.appendChild(span);
				syntaxColorsTokens[key] = getComputedStyle(span)["color"];
				span.remove();
		}
		{
			const div = document.createElement('div');
			div.className = 'CodeMirror-selected';
			parent.appendChild(div);
			syntaxColorsTokens.selection = getComputedStyle(div)["background-color"];
			div.remove();
		}
		return syntaxColorsTokens;
	};

	const getSidebar = (editor) => {
		if(SidebarInstance) return SidebarInstance;
		const codeMirrorDom = document.querySelector('.CodeMirror');
		const colors = SyntaxColors(codeMirrorDom);
		const container = codeMirrorDom;
		let dom = document.querySelector('.cm-sidebar');
		if(!dom){
			dom = htmlToElement(`
				<div class="cm-sidebar">
					<div class="side overflow">
						<canvas></canvas>
						<div class="scroll-handle"></div>
					</div>
				</div>
			`);
			container.append(dom);
		}
		const canvas = dom.querySelector('canvas');
		const ctx = canvas.getContext('2d');
		const side = dom.querySelector('.side')
		const scrollHandle = dom.querySelector('.scroll-handle');

		canvas.style.imageRendering ='pixelated';
		canvas.style.width ='100%';
		// canvas.style.height='100%';

		const textCanvas = new OffscreenCanvas(100,100);
		const selectCanvas = new OffscreenCanvas(100,100);

		let viewportHeight = dom.clientHeight*.1025;
		scrollHandle.style.height = viewportHeight + 'px';

		const scrollPercent = (percent, updateEditor=true) => {
			if(canvas.height > side.clientHeight){
				const maxScroll = side.clientHeight - viewportHeight;
				const mod = 0.01 * maxScroll;
				scrollHandle.style.top = Math.floor(percent*mod) + 'px';
			}
			if(canvas.height <= side.clientHeight){
				const maxScroll = canvas.height > viewportHeight
					? canvas.height - viewportHeight
					: 0;
				const mod = 0.01 * maxScroll;
				scrollHandle.style.top = Math.floor(percent*mod) + 'px';
			}
			if(canvas.height > side.clientHeight){
				const maxScroll = canvas.height-side.clientHeight;
				const mod = -.01 * maxScroll;
				canvas.style.top = Math.floor(percent*mod) + 'px';
			}
			if(updateEditor){
				const maxScroll = editor.doc.height;
				const mod = 0.01 * maxScroll;
				const top = percent*mod;
				editor.scrollTo(0,top>maxScroll ? maxScroll : top)
			}
		};
		let scrolled = ALMOST_ZERO_TRUTHY;
		editor.getScrollerElement().addEventListener('scroll', function(e) {
			const percent = 100*e.target.scrollTop/editor.doc.height;
			scrolled = percent;
			scrollPercent(percent, false);
		});
		scrollHandle.onmousedown = (() => {
			let previous;
			let startScroll;
			scrollHandle.ondragstart = () => false;
			const onMouseMove = (mouseMoveEvent) => {
				if(!previous || !startScroll) return;

				const { pageY } = mouseMoveEvent;
				const percentageMod = 115; //should be 100, but fudging a little for better usability
				const scrollChange = percentageMod*(pageY-previous)/Math.min(side.clientHeight, canvas.height);
				const newScroll = startScroll + scrollChange;
				if(newScroll >= 0 && newScroll <= 100) scrolled = newScroll;
				if(newScroll < 0) scrolled = ALMOST_ZERO_TRUTHY;
				if(newScroll > 100) scrolled = 100;

				scrollPercent(scrolled);
			};
			const onMouseUp = () => {
				scrollHandle.classList.remove('dragging');
				previous = startScroll = undefined;
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
			};
			return (mouseDownEvent) => {
				mouseDownEvent.preventDefault();
				scrollHandle.classList.add('dragging');
				startScroll = scrolled;
				previous = mouseDownEvent.pageY;
				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', onMouseUp);
			};
		})();
		side.onwheel = (e) => {
			const speedModifier = 1/-60
			const delta = e.wheelDelta * speedModifier;
			let change = scrolled+delta;
			if(change <= 0) change = ALMOST_ZERO_TRUTHY;
			if(change > 100) change = 100;
			scrolled = change;
			scrollPercent(scrolled);
		};
		scrollPercent(scrolled);
		canvas.onclick = (e) => {
			const rect = e.target.getBoundingClientRect();
			const y = e.clientY - rect.top;
			scrolled = 100*y/canvas.clientHeight;
			scrollPercent(scrolled);
			e.preventDefault();
		};

		const updateCanvas = () => {
			ctx.clearRect(0,0,canvas.width, canvas.height);
			ctx.drawImage(selectCanvas,0,0);
			ctx.drawImage(textCanvas,0,0);
		};

		const setCanvasDims = (width, height) => {
			if(canvas.height === height && canvas.width === width) return;
			canvas.width  = width;
			canvas.height = height;
			textCanvas.width  = width;
			textCanvas.height = height;
			selectCanvas.width  = width;
			selectCanvas.height = height;
			viewportHeight = dom.clientHeight*.1025;
			scrollHandle.style.height = viewportHeight + 'px';
		};

		let linesCache;
		const getLines = ({ cached }={}) => {
			if(cached && linesCache) return linesCache;

			const lines = editor.getValue().split('\n');
			const foldedLines = editor.getAllMarks()
				.filter(x => x.__isFold)
				.map(x => x.find());
				//.map(m => m.lines[0].lineNo()); (used elsewhere)
			let offset=0;
			let currentFoldIndex=0;
			let currentFold=foldedLines[currentFoldIndex];
			const logFold = () => console.log(currentFold?`Current Fold: ${currentFold.from.line} to ${currentFold.to.line}`:'NO MORE FOLDS');

			const lineTransform = ((text, lineNo) => {
				const lineY = lineNo-offset;
				if(!currentFold) return { text, lineNo, lineY, visible: true };

				const isFirstLine = lineNo === currentFold.from.line;
				const withinFold = !isFirstLine && lineNo > currentFold.from.line;
				const lineYWithinFold = currentFold.from.line-offset

				const isFoldEnd = !isFirstLine && lineNo > currentFold.to.line;
				if(isFoldEnd){
					const diff = currentFold.to.line - currentFold.from.line + 1;
					offset+=diff;
					currentFoldIndex++;
					let newFold = foldedLines[currentFoldIndex]
					while(newFold && newFold.from.line < currentFold.to.line){
						currentFoldIndex++;
						newFold=foldedLines[currentFoldIndex];
					}
					currentFold=newFold;
				}

				return {
					text, lineNo,
					lineY: withinFold ? lineYWithinFold : lineY,
					visible: !withinFold
				};
			});
			const transformedLines=[];
			for(var i=0, len=lines.length; i<len; i++ ){
				transformedLines.push(lineTransform(lines[i], i));
			}
			linesCache = transformedLines;
			return transformedLines;
		};

		SidebarInstance = {
			dom, canvas, colors, getLines, textCanvas, selectCanvas, updateCanvas, setCanvasDims
		}
		return SidebarInstance;
	};

	const updateSidebarDoc = ({text}, editor) => {
	
	};

	const updateSidebarText = (editor) => {
		const tabWidth = 5;
		const { scrollPastEndPadding } = editor.state;
		const scrollEndPad = Number(scrollPastEndPadding.replace('px', ''));
		const overScroll = Math.floor(scrollEndPad/19.5);
		const { colors, textCanvas, updateCanvas, setCanvasDims, getLines } = getSidebar(editor);
		const lines = getLines();

		// TODO: this should be used for horizontal overflow: https://www.geeksforgeeks.org/check-whether-html-element-has-scrollbars-using-javascript/

		setCanvasDims(
			100,
			Math.ceil((lines.filter(x=>x.visible).length+overScroll) * fontSize)
		);

		const textCtx = textCanvas.getContext('2d');
		textCtx.font = fontSize + 'px system-ui';
		textCtx.clearRect(0,0,textCanvas.width, textCanvas.height);
		const drawTokens = (line) => (toke) => {
			textCtx.fillStyle = colors[toke.token];
			const x = line.x+(toke.offset*fontWidth);
			const y = line.y;
			textCtx.fillText(toke.text,x,y);
		};
		const drawLine = (line) => {
			const { text, lineNo, lineY, visible } = line;
			if(!visible) return;
			if(!text.trim()) return;
			let tokenized = getLineTokens(text, lineNo, editor);
			if(!Array.isArray(tokenized)) tokenized = [tokenized];
			const tabsAtFront = (
				text.match(/^\t+/g) || []
			)[0]?.length || 0;
			const leadTabWidth = tabsAtFront * fontWidth * tabWidth
			const x = leadTabWidth+leftMargin;
			const y = 2+(fontSize*lineY);
			const drawTokensWithTabs = drawTokens({ x, y });
			tokenized.forEach(drawTokensWithTabs);
		};
		lines.forEach(drawLine);
		updateCanvas();
	}

	const Selections = (editor) => {
		const { colors, getLines, selectCanvas, updateCanvas } = getSidebar(editor);
		const lines = getLines({ cached: true });
		const xfrm = (lineNumber) => lines[lineNumber].lineY;
		const selectCtx = selectCanvas.getContext('2d');
		const selections = editor.listSelections();
		selectCtx.clearRect(0,0,selectCanvas.width, selectCanvas.height);
		selectCtx.globalAlpha = 0.5;
		selections
			.forEach((range) => {
				const { anchor: anchorLine, head: headLine } = range;
				let head = xfrm(headLine.line);
				const anchor = xfrm(anchorLine.line) || head;
				if(!head) head = anchor;

				//if(head === anchor) return;
				selectCtx.fillStyle = colors.selection;
				selectCtx.fillRect(
					0, head*fontSize,
					selectCanvas.width, (anchor-head+1)*fontSize
				);
			});
		updateCanvas();
	};

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

	const debouncedUpdateText = debounce(updateSidebarText, 500, true);

	const listenMap = {
		change: (cm) => updateSidebarText(cm),
		cursor: (cm) => Selections(cm),
		scroll: () => {},
		fold: (cm) => debouncedUpdateText(cm),
	};

	const listener = (which) => (...args) => {
		setTimeout(() => {
			// const thisListener = listenMap[which] || (() => console.log(`minimap: ${which}`));
			const thisListener = listenMap[which] || (() => {});
			thisListener(...args);
		}, 1);
	};

	listener('load')();

	const minimapExt = function(cm, val, old) {
		if (old && old != CodeMirror.Init) return;
		if (old == CodeMirror.Init) old = false;
		if (!old == !val) return;
		if(!val) return;

		listener('init')();

		cm.on("change", listener('change'));
		//batched
		//cm.on("changes", listener('change'));
		cm.on("swapDoc", listener('change'));
		cm.on("cursorActivity", listener('cursor'));

		cm.on("scroll", listener('scroll'));
		cm.on("fold", listener('fold'));
		cm.on("unfold", listener('fold'));
		window.onresize = listener('resize');
	};

	CodeMirror.defineOption("miniMapWidth", 64);
	CodeMirror.defineOption("miniMapSide", "left");
	CodeMirror.defineOption("miniMap", false, minimapExt);
});
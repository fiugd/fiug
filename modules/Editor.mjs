import Editor from "/shared/modules/editor.mjs";
import EditorTabs from "./EditorTabs.mjs";
import {
	attachListener,
	connectTrigger,
	ChangeHandler,
	CursorActivityHandler,
} from "./editorEvents.mjs";
import ext from "/shared/icons/seti/ext.json.mjs";
import {
	getState, getAllServices, getSettings,
	setCurrentFile, getCurrentFileFull
} from "./state.mjs";
import { codemirrorModeFromFileType } from "/shared/modules/utilities.mjs";
import "/shared/vendor/localforage.min.js";

let editorGutter;
let cmDom;
let prevDoc;

// call editor tabs once early so event handlers are attached
EditorTabs();

const { indentWithTabs, tabSize } = getSettings();

let getMime = () => {};
(async () => {
	const source = await (await fetch('/modules/service-worker.utils.js')).text();
	const SWUtils = eval(`
		(function(){
		const module = { exports: {} };
		${source}
		const { exports } = module;
		return exports;
		})()
	`);
	SWUtils.initMimeTypes();
	getMime = SWUtils.getMime;
})();

function htmlToElement(html) {
	var template = document.createElement("template");
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	//also would be cool to remove indentation from all lines
	return template.content.firstChild;
}

const getExtension = (fileName) =>
	((fileName.match(/\.[0-9a-z]+$/i) || [])[0] || "").replace(/^\./, "");

function getFileType(fileName = "") {
	const mime = getMime(fileName) || {};

	let type = "default";
	const extension = getExtension(fileName);
	if(mime?.contentType ){
		type = mime.contentType;
	}
	
	//TODO: most of this should be able to go away with addition of getExtension above...
	if (fileName.toLowerCase() === ".git/config") {
		type = "config";
	}
	if (fileName.toLowerCase() === "license") {
		type = "license";
	}
	if (ext[extension]) {
		type = ext[extension];
	}
	if (extension === "bat") {
		type = "bat";
	}
	if (extension === "scratch") {
		type = "markdown";
	}
	if (extension === "piskel") {
		type = "application/json";
	}
	if (extension === "bugs") {
		type = "markdown";
	}
	if (extension === "wat") {
		type = "text/webassembly";
	}
	if (extension === "htm" || extension === "html") {
		type = {
			name: "htmlmixed",
			mimeType: "application/x-ejs",
		};
	}
	if (extension === 'hbs'){
		type = {name: "handlebars", base: "text/html"}
	}
	if (fileName === '.profile'){
		type = "shell"
	}
	return type;
}

//This is used by inlineEditor
const Container = () => {
	const prevConatiner = document.querySelector("#full-page-container");
	if (prevConatiner) {
		prevConatiner.parentNode.removeChild(prevConatiner);
	}
	const containerDiv = document.createElement("div");
	containerDiv.innerHTML = `
		<div class="editor-space hide-on-med-and-down"></div>
		<div class="contain"></div>
	`;
	containerDiv.classList.add("section", "simulation", "editor");
	containerDiv.id = "full-page-container";
	containerDiv.classList.add("section", "simulation", "editor");

	document.querySelector("#editor").appendChild(containerDiv);
	return containerDiv;
};

const Search = () => {
	const searchDiv = document.createElement("div");
	searchDiv.id = "file-search";
	searchDiv.innerHTML = `
		<style>
			#file-search {
				visibility: hidden;
				position: absolute;
				background: var(--main-theme-color);
				height: 34px;
				box-shadow: inset 0px -2px 0px 0px var(--theme-subdued-color);
				/* border: 3px solid var(--main-theme-color); */
				display: flex;
				justify-content: space-between;
				align-items: center;
				cursor: default;
				border-bottom: 6px solid var(--main-theme-color);
				box-sizing: content-box;
				right: 8px;
				left: 0;
				width: auto;
				padding: 0.45em;
				z-index: 10;
			}
			.collapse-handle {
				width: 1.5em;
				text-align: center;
				font-stretch: expanded;
				font-family: system-ui, monospace;
				font-size: 1.2em;
			}
			.search-field {
				margin-left: 0;
				flex: 1;
				height: 75%;
			}
			.search-field input {
				height: 100% !important;
				background: var(--main-theme-background-color) !important;
				margin: 0 !important;
				border: 0 !important;
				color: var(--main-theme-text-color);
				padding-left: .5em !important;
				padding-right: .5em !important;
				font-size: 1.1em !important;
				box-sizing: border-box !important;
				transition: unset !important;
			}
			.search-field input:focus {
				border: 1px solid !important;
				box-shadow: none !important;
				border-color: rgb(var(--main-theme-highlight-color)) !important;
			}
			.search-count,
			.search-no-results {
				margin-left: 1.2em;
				margin-right: auto;
				min-width: 5em;
			}
			.search-controls {
				margin-right: 0.5em;
				margin-left: 1em;
				font-family: system-ui, monospace;
				font-size: 1.1em;
				user-select: none;
			}
			.search-controls span {
				min-width: 1.4em;
				display: inline-block;
				cursor: pointer;
				text-align: center;
			}
			#file-search ::placeholder {
				color: var(--main-theme-text-invert-color);
			}
		</style>
		<div class="collapse-handle">></div>
		<div class="search-field">
			<input
				type="text"
				autocomplete="off"
				autocorrect="off"
				autocapitalize="off"
				spellcheck="false"
				placeholder="Find"
			/>
		</div>
		<div class="search-count hidden">
			<span class="search-count-current">X</span>
			<span>of</span>
			<span class="search-count-total">Y</span>
		</div>
		<span class="search-no-results">No results</span>
		<div class="search-controls">
			<span class="search-up">↑</span>
			<span class="search-down">↓</span>
			<span class="search-close">X</span>
		</div>
	`;
	return searchDiv;
};

const miscSystemSettings = [
	{
		name: "exit-current-service",
		description: "Close the current project",
		button: "close",
		onclick: `localStorage.setItem('lastService', ''); document.location.reload()`,
	},
];

/*
var clickEvent = new MouseEvent('click', {
	view: window,
	bubbles: true,
	cancelable: true
});

*/

const SystemDocs = (section, errors) => {
	const style = `
	<style>
		#editor-system-doc {
			font-size: inherit;
			margin: 0;
			display: flex;
			flex-direction: column;
			justify-content: start;
			align-items: center;
			height: 100%;
			overflow: auto;
			width: 100%;
			padding-bottom: 100px;
			padding-right: 1em;
			padding-left: 1em;
			box-sizing: border-box;
		}
		#editor-system-doc::-webkit-scrollbar { width: 5px; height: 5px; }
		#editor-system-doc::-webkit-scrollbar-corner,
		#editor-system-doc::-webkit-scrollbar-track { background: transparent; }
		#editor-system-doc:hover::-webkit-scrollbar-thumb { background: #333; }
		#editor-system-doc::-webkit-scrollbar-thumb { background: transparent; }
		#editor-system-doc ::placeholder { opacity: 0.35; }

		#editor-system-doc h1 {
			font-size: 1.1em;
			font-variant: all-petite-caps;
			border-bottom: 1px solid;
			padding-bottom: .4em;
			opacity: .55;
			margin: 2.2em 0 0.5em 0;
		}
		.thisSystemDoc {
			max-width: 60em;
		}
		.settings-grid-2-col {
			display: grid;
			grid-template-columns: 1fr auto;
			grid-auto-rows: auto;
			align-items: center;
			margin: 1.5em 0;
			grid-gap: 1em;
			background: #8888881f;
			padding: 1.1em;
			border-radius: 2px;
		}
		#editor-system-doc button {
			background: #88888847;
			border: 0;
			padding: 0.5em;
			color: inherit;
			margin: .3em 0;
		}
		#editor-system-doc button:hover {
			background: rgba(var(--main-theme-highlight-color), 0.4);
		}
		#editor-system-doc ul {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
		}
		#editor-system-doc li {
			margin: 1em;
			width: 100%;
			text-align: center;
			background: #88888826;
		}
		#editor-system-doc form.provider-settings {
			padding: 1em;
			display: flex;
			flex-direction: column;
			margin-top: 1em;
		}
		#editor-system-doc input {
			color: inherit;
			margin-bottom: 1.5em;
			background: #88888829;
			margin-top: 0.3em;
			padding: 0 .5em;
			box-sizing: border-box;
		}
		.provider-settings button.error {
			outline: 1px solid red;
			background: red;
			color: red;
		}
		#settings-all-services-list li {
			display: flex;
			justify-content: space-between;
			padding: 1em;
			align-items: center;
		}
		#settings-all-services-list {
			/*min-height: 400px;*/
			justify-content: flex-start;
		}
	</style>
	`;
	if (!section) {
		const view = htmlToElement(
			`
			<div id="editor-system-doc">
				${style}
				<div class="thisSystemDoc"></div>
			</div>
		`.replace(/		/g, "")
		);
		return view;
	}

	const miscSettings = `
		<h1>Misc Settings</h1>

		${miscSystemSettings
			.map((x) => {
				return `
				<div class="settings-grid-2-col">
					<div>${x.description}</div>
					<div>
						<button id="${x.name}" onclick="${x.onclick}">${x.button}</button>
					</div>
				</div>
			`.replace(/				/g, "");
			})
			.join("\n")}
	`.replace(/		/g, "");

	const addServiceFolder = `
		<h1>Add Folder</h1>
		<p>
			TODO: this functionality will take back seat to service provider because it's a one-shot/one-way solution;
			it's useful, but not as useful.
		</p>
	`.replace(/		/g, "");

	const openPreviousService = `
		<h1>Open Previous Service</h1>
		<p>
			Show a list of services each with button that sets lastService and does document reload
		</p>
		<ul id="settings-all-services-list">
			<li></li>
		</ul>
	`.replace(/		/g, "");

	const connectServiceProvider = `
		<h1>Connect a Service Provider</h1>
		<p>
			TODO: show a list of providers and allow setup
			At first, only local file server (electron), aka basic server, will be available
			In the future, this could be a much long list of providers.
			TODO: get list of currently registered providers and show here (remove default value for basic server)
		</p>
		<ul>
			<li>
				<button
					onclick="event.target.parentNode.querySelector('.provider-settings').classList.toggle('hidden')"
				>Github</button>
				<form class="provider-settings" autocomplete="off" onsubmit="return false;">
					<input class="hidden" autocomplete="false" name="hidden" type="text">
					<input name="provider-type" class="hidden" type="text" value="github-provider">

					<label>Personal Access Token</label>
					<input name="provider-access-token" type="text" >

					<button class="provider-test">Test Provider</button>
					<button class="provider-save">Save Provider</button>

					<label style="margin-top: 30px;">Repository</label>
					<input type="text"
						name="provider-repository"
						value="crosshj/fiug-welcome"
						placeholder="{user}/{repository name}"
					>
					<input type="text"
						name="provider-repository-branch"
						value="main"
						placeholder="branch name"
					>
					<button class="provider-add-service">Add Repository</button>
				</form>
			</li>
			<li>
				<button
					onclick="event.target.parentNode.querySelector('.provider-settings').classList.toggle('hidden')"
				>Bartok Basic Server</button>
				<form class="provider-settings" autocomplete="off" onsubmit="return false;">
					<input class="hidden" autocomplete="false" name="hidden" type="text">
					<input name="provider-type" class="hidden" type="text" value="basic-bartok-provider">

					<label>Server URL</label>
					<input name="provider-url" type="text" value="http://localhost:3333/">

					<button class="provider-test">Test Provider</button>
					<button class="provider-save">Save Provider</button>
					<button class="provider-add-service">Add Folder</button>
				</form>
			</li>
			<li>
				<button
					onclick="event.target.parentNode.querySelector('.provider-settings').classList.toggle('hidden')"
				>Bartok Advanced Server</button>
				<form class="provider-settings hidden" autocomplete="off" onsubmit="return false;">
					<input class="hidden" autocomplete="false" name="hidden" type="text">
					<input name="provider-type" class="hidden" type="text" value="basic-advanced-provider">

					<label>Server URL</label>
					<input name="provider-url" type="text" >

					<button class="provider-test">Test Provider</button>
					<button class="provider-save">Save Provider</button>
					<button class="provider-add-service">Add Folder</button>
				</form>
			</li>
		</ul>
	`.replace(/		/g, "");

	const allSettings = `
		${connectServiceProvider}
		${addServiceFolder}
		${openPreviousService}
		${miscSettings}
	`.replace(/		/g, "");

	const sectionText = {
		"add-service-folder": addServiceFolder,
		"connect-service-provider": connectServiceProvider,
		"open-previous-service": openPreviousService,
		"open-settings-view": allSettings,
	}[section];
	return sectionText || "";
};

/*
	NOTE:

	name ==> service name (parent of this file)
	id ==> service id
	filename ==> name of this file
*/

//const BLANK_CODE_PAGE = `${(new Array(99)).fill().join('\n')}`;
const BLANK_CODE_PAGE = "";
const inlineEditor = (ChangeHandler) => ({
	code = BLANK_CODE_PAGE,
	line: loadLine,
	column: loadColumn,
	forceUpdate,
	name,
	id,
	filename,
	path,
	callback,
} = {}) => {
	const prevEditor = document.querySelector("#editor-container");
	let editorDiv = prevEditor;
	if (!editorDiv) {
		const containerDiv = Container({
			operations: ["create", "cancel", "delete", "persist", "update"],
		});
		editorDiv = document.createElement("div");
		editorDiv.id = "editor-container";
		editorDiv.innerHTML = `
			<div id="service-fields" class="row no-margin">
				<div class="input-field col s6">
					<input id="service_name" type="text" class="" value="${name}">
					<label for="service_name">Name</label>
				</div>
				<div class="input-field col s6">
					<input id="service_id" type="text" class="" value="${id}">
					<label for="service_id">ID</label>
				</div>
			</div>
		`;

		editorDiv.appendChild(
			EditorTabs(name ? [{ name, active: true }] : undefined)
		);

		editorDiv.appendChild(Search());

		const editorTextArea = document.createElement("textarea");
		editorTextArea.id = "service_code";
		editorTextArea.classList.add("functionInput");
		editorTextArea.classList.add("hidden");
		editorDiv.appendChild(editorTextArea);
		containerDiv.querySelector(".contain").appendChild(editorDiv);
	}

	window.M && M.updateTextFields();

	//const editorPane = document.querySelector('#editor');
	//editorPane.style.width = editorPane.clientWidth + 'px';
	const darkEnabled = window.localStorage.getItem("themeDark") === "true";
	const handlerBoundToDoc = ChangeHandler({ code, name, id, filename });

	var currentHandle = null,
		currentLine;
	function updateLineInfo(cm, line) {
		var handle = cm.getLineHandle(line - 1);
		if (handle == currentHandle && line == currentLine) return;
		if (currentHandle) {
			cm.removeLineClass(currentHandle, null, null);
			//cm.clearGutterMarker(currentHandle);
		}
		currentHandle = handle;
		currentLine = line;
		cm.addLineClass(currentHandle, null, "activeline");
		//cm.setGutterMarker(currentHandle, String(line + 1));
	}

	const onCursorActivity = (instance) => {
		const cursor = instance.getCursor();
		const line = cursor.line + 1;
		const column = cursor.ch + 1;
		updateLineInfo(instance, line);
		// STATUS_CURRENT_LINE.textContent = cursor.line + 1;
		CursorActivityHandler({ line, column });
	};

	const onScrollCursor = (instance, event) => {
		//TODO: use this to recall scroll positions?
		//event.preventDefault();
	};

	//TODO: code should come from changeHandler if it exists

	const fileType = getFileType(filename);
	const mode = codemirrorModeFromFileType(fileType);

	function isSelectedRange(ranges, from, to) {
		for (var i = 0; i < ranges.length; i++)
			if (
				CodeMirror.cmpPos(ranges[i].from(), from) == 0 &&
				CodeMirror.cmpPos(ranges[i].to(), to) == 0
			)
				return true;
		return false;
	}
	function selectNextOccurrence(cm) {
		var Pos = CodeMirror.Pos;

		var from = cm.getCursor("from"),
			to = cm.getCursor("to");
		var fullWord = cm.state.sublimeFindFullWord == cm.doc.sel;
		if (CodeMirror.cmpPos(from, to) == 0) {
			var word = wordAt(cm, from);
			if (!word.word) return;
			cm.setSelection(word.from, word.to);
			fullWord = true;
		} else {
			var text = cm.getRange(from, to);
			var query = fullWord ? new RegExp("\\b" + text + "\\b") : text;
			var cur = cm.getSearchCursor(query, to);
			var found = cur.findNext();
			if (!found) {
				cur = cm.getSearchCursor(query, Pos(cm.firstLine(), 0));
				found = cur.findNext();
			}
			if (!found || isSelectedRange(cm.listSelections(), cur.from(), cur.to()))
				return;
			cm.addSelection(cur.from(), cur.to());
		}
		if (fullWord) {
			cm.state.sublimeFindFullWord = cm.doc.sel;
		}
		return false;
	}
	function toggleComment(cm){
		//TODO: would love block comments first, then line
		cm.toggleComment({ indent: true });
	}
	function SwapLineUp(cm) {
		var Pos = CodeMirror.Pos;
		if (cm.isReadOnly()) return CodeMirror.Pass
		var ranges = cm.listSelections(), linesToMove = [], at = cm.firstLine() - 1, newSels = [];
		for (var i = 0; i < ranges.length; i++) {
			var range = ranges[i], from = range.from().line - 1, to = range.to().line;
			newSels.push({anchor: Pos(range.anchor.line - 1, range.anchor.ch),
										head: Pos(range.head.line - 1, range.head.ch)});
			if (range.to().ch == 0 && !range.empty()) --to;
			if (from > at) linesToMove.push(from, to);
			else if (linesToMove.length) linesToMove[linesToMove.length - 1] = to;
			at = to;
		}
		cm.operation(function() {
			for (var i = 0; i < linesToMove.length; i += 2) {
				var from = linesToMove[i], to = linesToMove[i + 1];
				var line = cm.getLine(from);
				cm.replaceRange("", Pos(from, 0), Pos(from + 1, 0), "+swapLine");
				if (to > cm.lastLine())
					cm.replaceRange("\n" + line, Pos(cm.lastLine()), null, "+swapLine");
				else
					cm.replaceRange(line + "\n", Pos(to, 0), null, "+swapLine");
			}
			cm.setSelections(newSels);
			cm.scrollIntoView();
		});
	};
	function SwapLineDown(cm) {
		var Pos = CodeMirror.Pos;
		if (cm.isReadOnly()) return CodeMirror.Pass
		var ranges = cm.listSelections(), linesToMove = [], at = cm.lastLine() + 1;
		for (var i = ranges.length - 1; i >= 0; i--) {
			var range = ranges[i], from = range.to().line + 1, to = range.from().line;
			if (range.to().ch == 0 && !range.empty()) from--;
			if (from < at) linesToMove.push(from, to);
			else if (linesToMove.length) linesToMove[linesToMove.length - 1] = to;
			at = to;
		}
		cm.operation(function() {
			for (var i = linesToMove.length - 2; i >= 0; i -= 2) {
				var from = linesToMove[i], to = linesToMove[i + 1];
				var line = cm.getLine(from);
				if (from == cm.lastLine())
					cm.replaceRange("", Pos(from - 1), Pos(from), "+swapLine");
				else
					cm.replaceRange("", Pos(from, 0), Pos(from + 1, 0), "+swapLine");
				cm.replaceRange(line + "\n", Pos(to, 0), null, "+swapLine");
			}
			cm.scrollIntoView();
		});
	};
	const extraKeys = {
		"Cmd-D": selectNextOccurrence,
		"Ctrl-D": selectNextOccurrence,
		"Ctrl-/": toggleComment,
		"Alt-Up": SwapLineUp,
		"Alt-Down": SwapLineDown,
	};

	const editorCallback = (error, editor) => {
		if (error) {
			console.error(error);
			callback && callback(error);
			return;
		}
		callback && callback();
		window.Editor = editor;

		editor.setOption("theme", darkEnabled ? "vscode-dark" : "default");
		editor.setOption("styleActiveLine", { nonEmpty: true });
		editor.setOption("extraKeys", extraKeys);

		let editorState = {
			unfolded: [],
			scroll: 0,
		};
		const stateStorageKey = `state::${name}::${filename}`;
		try {
			/*
			const storedState = JSON.parse(sessionStorage.getItem(stateStorageKey));
			if (storedState && storedState.unfolded) {
				editorState = storedState;
			}
			*/
		} catch (e) {}

		const foldHandler = (cm, from, to) => {
			cm.addLineClass(from.line, "wrap", "folded");
			/*
			editorState.unfolded = editorState.unfolded.filter(
				(x) => x !== from.line
			);
			sessionStorage.setItem(stateStorageKey, JSON.stringify(editorState));
			*/
		};
		const unfoldHandler = (cm, from, to) => {
			cm.removeLineClass(from.line, "wrap", "folded");
			/*
			if (editorState.unfolded.includes(from.line)) {
				return;
			}
			editorState.unfolded.push(from.line);
			sessionStorage.setItem(stateStorageKey, JSON.stringify(editorState));
			*/
		};

		editor.on("fold", foldHandler);
		editor.on("unfold", unfoldHandler);
		editor.on("change", handlerBoundToDoc);
		editor.on("cursorActivity", onCursorActivity);
		editor.on("scrollCursorIntoView", onScrollCursor);

		editor._cleanup = () => {
			editor.off("change", handlerBoundToDoc);
			editor.off("cursorActivity", onCursorActivity);
			editor.off("scrollCursorIntoView", onScrollCursor);
			editor.off("fold", foldHandler);
			editor.off("unfold", unfoldHandler);

			const sidebarCanvas = document.querySelector('.cm-sidebar canvas');
			sidebarCanvas && (sidebarCanvas.width = sidebarCanvas.width);
		};

		const MIN_DOC_FOLD_LENGTH = 150;
		let cursor = 0;
		false && editor.lastLine() > MIN_DOC_FOLD_LENGTH &&
			editor.eachLine(editor.firstLine(), editor.lastLine(), function (line) {
				// todo: store these exceptions in user config?
				const shouldNotFold = [
					"<html>",
					"<head>",
					"<svg",
					"<!--",
					"code_in",
					"# welcome!",
				].find((x) => line.text.includes(x));

				const isfirstLineOfJSON =
					(filename.includes(".piskel") ||
						filename.includes(".json") ||
						filename.includes(".gltf") ||
						filename.includes(".ipynb")) &&
					cursor === 0;

				if (shouldNotFold || isfirstLineOfJSON) {
					cursor++;
					return;
				}
				// children of the folded
				const alreadyFolded = editor.isFolded({ line: cursor, ch: 0 });
				if (alreadyFolded) {
					cursor++;
					return;
				}

				editor.foldCode({ line: cursor, ch: 0 }, null, "fold");
				cursor++;
			});

		editorState.unfolded.forEach((line) => {
			try {
				//editor.foldCode({ line, ch: 0 }, null, "unfold");
			} catch(e){}
		});
	};

	const editorOptions = {
		text: code || "",
		docStore: window.localforage,
		lineNumbers: true,
		mode,
		addModeClass: true,
		autocorrect: true,
		// scrollbarStyle: 'native',
		tabSize,
		indentWithTabs,
		smartIndent: false,
		showInvisibles: true,
		styleActiveLine: true,
		styleActiveSelected: true,
		matchBrackets: true,
		lineWrapping: false,
		scrollPastEnd: true,
		foldGutter: true,
		gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
		foldOptions: {
			widget: (from, to) => {
				return "...";
			},
			minFoldSize: 3,
		},
		//miniMap: localStorage.getItem('minimap'),
		miniMap: true,
		miniMapSide: "right",
		miniMapWidth: 64,
		cursorBlinkRate: 0
	};
	/*
		This (loadDoc) is good in the sense that it reduces some dependency on shared/editor, but it is confusing and error-prone
			- [ ] too many listeners get attached and not removed
			- [ ] state is spread out and difficult to manage
			- [ ] too many lines of code to comprehend; not straightforward
			- [ ] too much is done in "ui"
			- [ ] addon is too complicated

		CLEAN THIS UP
		0. [X] name should include full path of file
		1. [ ] all document attributes should save/restore to/from service request handler (unless default?)
			- X - document text
			- X - mode
			- X - selections
			- X - cursor position
			- X - history
			- X - scroll position
			- X - folded vs unfolded
			- indentation preference: tabs, spaces, size
			- line wrap preference
		2. [ ] addon should expose/attach/detach ONE event for all of these when they change (instead of three)
			- this should be an event unique to addon so it's not confused with CodeMirror events
		3. [ ] when file is restored from outside browser UI, service request handler should delete/overwrite some/all these?
		4. [ ] editorCallback sucks; can it be removed?
	*/

	const loadDocument = () => {
		console.log(
			`%c${filename}: %ceditor %cloadDoc start`,
			'color:#CE9178;',
			'color:#9CDCFE;',
			'color:#DCDCAA;'
		);
		const docHasChanged = prevDoc !== filename;

		cmDom = cmDom || document.querySelector('.CodeMirror');
		editorGutter = editorGutter || document.body.querySelector('.CodeMirror-gutters');

		if(docHasChanged) cmDom.style.opacity = 0;
		const { text } = editorOptions;
		window.Editor._cleanup && window.Editor._cleanup();

		const callback = (err) => {
			if(err) return;
			editorCallback(null, window.Editor);
			//if(docHasChanged) window.Editor.refresh();
			//if(docHasChanged) setTimeout(() => {
				cmDom.style.opacity = 1;
			//}, 1);
			prevDoc = filename;
		};
		if(!path || !filename){
			return callback();
		}
		window.Editor.loadDoc({
			name: filename,
			path,
			line: loadLine ? Number(loadLine) : 0,
			ch: loadColumn ? Number(loadColumn) : 0,
			forceUpdate,
			text,
			mode,
			callback
		});

	};

	if(window.Editor) return loadDocument();

	Editor({ ...editorOptions, text: '\n\n\n' }, (error, editor) => {
		if (error) {
			console.error(error);
			callback && callback(error);
			return;
		}
		window.Editor = editor;
		loadDocument();
	});

};

let nothingOpen;
const showNothingOpen = () => {
	try{
		document.getElementById('file-search').style.visibility = "";
	}catch(e){}

	if (!nothingOpen) {
		const editorContainer = document.getElementById("editor-container");
		nothingOpen = document.createElement("div");
		nothingOpen.id = "editor-empty";
		editorContainer.appendChild(nothingOpen);
	}
	const style = `
		<style>
			#editor-empty {
				position: absolute;
				left: 0;
				right: 0;
				top: 0;
				bottom: 0;
				background: #1e1e1e;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				overflow: hidden;
				min-width: 160px;
			}
			#editor-empty-logo {
				opacity: .7;
				color: rgb(var(--main-theme-highlight-color));
				fill: currentColor;
				width: 18em;
				margin-top: -14em;
				stroke: rgba(var(--main-theme-highlight-color),.4);
			}
			.editor-empty-blurb {
				/* visibility: hidden; */
				font-variant: small-caps;
				font-style: italic;
				color: var(--main-theme-text-color);
			}
		</style>
	`;
	// const logo = `
	// <svg viewBox="17 -4 164 164" id="editor-empty-logo">
	// 	<g display="inline">
	// 		<path d="m107.92716,36.94508l0.95003,75.70511q0.43081,20.89989 -8.2886,28.93939a17.79142,17.79142 0 0 1 -5.62624,3.50444a26.0076,26.0076 0 0 1 -9.05414,1.83369a25.65472,25.65472 0 0 1 -5.99571,-0.53686a17.93757,17.93757 0 0 1 -7.97647,-3.87325q-5.37316,-4.58798 -5.51145,-11.29708a8.56719,8.56719 0 0 1 0.46363,-3.06124a7.69904,7.69904 0 0 1 1.7347,-2.78065a8.1837,8.1837 0 0 1 2.21745,-1.6709a7.12818,7.12818 0 0 1 3.1023,-0.75751q3.04976,-0.06286 5.31721,1.90423a6.54734,6.54734 0 0 1 2.31551,4.69287a8.41542,8.41542 0 0 1 0.01667,0.38455a9.9962,9.9962 0 0 1 -0.17825,2.17434q-0.33206,1.6539 -1.27337,2.88173a6.44928,6.44928 0 0 1 -0.02982,0.03873a6.49737,6.49737 0 0 1 -1.61735,1.50169a5.69668,5.69668 0 0 1 -2.23968,0.83533a7.63846,7.63846 0 0 0 1.94997,2.72157a9.66705,9.66705 0 0 0 0.86605,0.69883a7.27496,7.27496 0 0 0 3.49986,1.31186a9.52902,9.52902 0 0 0 1.25767,0.05468q2.77495,-0.0572 4.58481,-1.07112q1.39415,-0.78104 2.3667,-2.67558a12.1472,12.1472 0 0 0 0.54265,-1.22836q1.81667,-4.68495 1.74149,-18.0017a214.86231,214.86231 0 0 0 -0.04299,-3.207l-0.95065,-75.70447q-0.2388,-11.58509 2.8317,-18.91706a19.04305,19.04305 0 0 1 11.19336,-11.14967a26.89948,26.89948 0 0 1 9.05539,-1.77311a24.95083,24.95083 0 0 1 6.1505,0.58928a18.02376,18.02376 0 0 1 7.73051,3.82333a16.27309,16.27309 0 0 1 3.72013,4.41961a14.41251,14.41251 0 0 1 1.8213,6.87685a8.56719,8.56719 0 0 1 -0.46363,3.06124a7.69904,7.69904 0 0 1 -1.7347,2.78065a8.1837,8.1837 0 0 1 -2.21745,1.6709a7.12818,7.12818 0 0 1 -3.1023,0.75751q-3.04914,0.06285 -5.31721,-1.90423a7.78648,7.78648 0 0 1 -1.33237,-1.46589a5.40563,5.40563 0 0 1 -0.98662,-3.00135a12.54318,12.54318 0 0 1 0.128,-2.15644q0.18065,-1.17841 0.60929,-2.11824a5.89841,5.89841 0 0 1 0.91456,-1.4341q1.65528,-1.90487 3.17664,-2.18304a2.98293,2.98293 0 0 1 0.13391,-0.02088q-1.98924,-4.71772 -6.65943,-4.90888a9.93998,9.93998 0 0 0 -0.61184,-0.00613q-5.15393,0.10624 -7.30488,5.27607q-2.07951,4.99841 -1.8924,17.5918a151.92781,151.92781 0 0 0 0.01553,0.87445z"
	// 		/>
	// 		<path d="m100.36909,153.77804q-20.74665,0 -38.19824,-10.25128q-17.45159,-10.25128 -27.82491,-27.82491q-10.37332,-17.57363 -10.37332,-38.32027q0,-20.50257 10.37332,-38.0762q10.37332,-17.57363 27.82491,-27.82491q17.45159,-10.25128 38.19824,-10.25128q20.50257,0 37.95416,10.37332q17.45159,10.37332 27.70287,27.82491q10.25128,17.45159 10.25128,37.95416q0,20.74665 -10.25128,38.32027q-10.25128,17.57363 -27.70287,27.82491q-17.45159,10.25128 -37.95416,10.25128zm0,-4.39341q19.28218,0 35.75745,-9.64109q16.47528,-9.64109 26.11637,-26.2384q9.64109,-16.59732 9.64109,-36.12357q0,-19.52625 -9.64109,-36.00153q-9.64109,-16.47528 -26.11637,-26.11637q-16.47528,-9.64109 -35.75745,-9.64109q-19.52625,0 -36.12357,9.64109q-16.59732,9.64109 -26.2384,26.11637q-9.64109,16.47528 -9.64109,36.00153q0,19.52625 9.64109,36.12357q9.64109,16.59732 26.2384,26.2384q16.59732,9.64109 36.12357,9.64109z"
	// 		/>
	// 	</g>
	// </svg>
	// `;
	const logo = `
	<svg viewBox="-4 -4 172 150" id="editor-empty-logo">
		<g>
			<title>Do or do not.  There is no try.</title>
			<path d="m0.66613,141.12654l40.94759,-22.96759l39.55286,22.95911l-80.50045,0.00848z" stroke="#000000" stroke-width="0" opacity=".3" style="fill: black;opacity: .15;"></path>
			<path d="m81.32664,141.18317l41.77172,-23.74405l40.66986,23.45933l-82.44158,0.28472z" stroke-width="0" opacity=".1" style="fill: black;opacity: .15;"></path>
			<path d="m-8.80672,124.5856l39.68109,-24.32103l39.94988,23.98956l-79.63097,0.33147z" stroke-width="0" transform="rotate(120.005 31.0088 112.425)" opacity=".15" style="fill: black;opacity: .5;"></path>
			<path d="m29.8517,54.08169l40.95021,-23.76637l41.15387,23.42957l-82.10408,0.3368z" stroke-width="0" transform="rotate(120.005 70.9037 42.1985)" opacity=".15" style="fill: black;opacity: .5;"></path>
			<path d="m50.84794,54.21713l41.14723,-23.71165l40.66986,23.126l-81.81709,0.58565z" stroke-width="0" transform="rotate(240.005 91.7565 42.3613)" opacity=".6" style="fill: black;opacity: .6;"></path>
			<path d="m92.34289,123.94524l40.84106,-24.40053l40.54568,23.11973l-81.38674,1.2808z" stroke-width="0" transform="rotate(240.005 133.036 111.745)" opacity=".35" style="fill: black;opacity: .67;"></path>

			<path id="border" d="m80.7229,0.44444l82.61043,140.55521l-163.22223,0.44479l80.6118,-141z" fill="none" stroke-width="1" style="fill: transparent;stroke: transparent;"></path>

			<path d="m80.63317,96.1755l0.39079,45.37696l41.8002,-23.91294l-0.6859,-46.06544l-41.50509,24.60142z" stroke-width="0" opacity=".25" style="fill: black;opacity: .41;"></path>
			<path d="m60.24695,60.10716l0.41626,47.48081l41.25377,-23.26463l-0.93192,-47.77411l-40.73811,23.55793z" stroke-width="0" transform="rotate(60 81.082 72.0686)" opacity=".67" style="fill: aliceblue;opacity: .01;"></path>
			<path d="m41.52036,94.93062l-0.5376,46.74648l39.55956,-24.26797l-0.06849,-45.66349l-38.95347,23.18498z" stroke-width="0" transform="rotate(120 60.7625 106.711)" style="fill: black;opacity: .25;"></path>
		</g>
	</svg>
	`;
	const coloredLogo = `
	<svg viewBox="-4 -4 172 150" id="editor-empty-logo">
		<g>
			<title>Do or do not.  There is no try.</title>
			<path d="m0.66613,141.12654l40.94759,-22.96759l39.55286,22.95911l-80.50045,0.00848z" stroke="#000000" stroke-width="0" opacity=".3"></path>
			<path d="m81.32664,141.18317l41.77172,-23.74405l40.66986,23.45933l-82.44158,0.28472z" stroke-width="0" opacity=".1"></path>
			<path d="m-8.80672,124.5856l39.68109,-24.32103l39.94988,23.98956l-79.63097,0.33147z" stroke-width="0" transform="rotate(120.005 31.0088 112.425)" opacity=".15"></path>
			<path d="m29.8517,54.08169l40.95021,-23.76637l41.15387,23.42957l-82.10408,0.3368z" stroke-width="0" transform="rotate(120.005 70.9037 42.1985)" opacity=".15"></path>
			<path d="m50.84794,54.21713l41.14723,-23.71165l40.66986,23.126l-81.81709,0.58565z" stroke-width="0" transform="rotate(240.005 91.7565 42.3613)" opacity=".5"></path>
			<path d="m92.34289,123.94524l40.84106,-24.40053l40.54568,23.11973l-81.38674,1.2808z" stroke-width="0" transform="rotate(240.005 133.036 111.745)" opacity=".35"></path>

			<path id="border" d="m80.7229,0.44444l82.61043,140.55521l-163.22223,0.44479l80.6118,-141z" fill="none" stroke-width="1"></path>

			<path d="m80.63317,96.1755l0.39079,45.37696l41.8002,-23.91294l-0.6859,-46.06544l-41.50509,24.60142z" stroke-width="0" opacity=".25"></path>
			<path d="m60.24695,60.10716l0.41626,47.48081l41.25377,-23.26463l-0.93192,-47.77411l-40.73811,23.55793z" stroke-width="0" transform="rotate(60 81.082 72.0686)" opacity=".67"></path>
			<path d="m41.52036,94.93062l-0.5376,46.74648l39.55956,-24.26797l-0.06849,-45.66349l-38.95347,23.18498z" stroke-width="0" transform="rotate(120 60.7625 106.711)" opacity=".55"></path>
		</g>
	</svg>
	`;
	nothingOpen.innerHTML =
		style +
		logo +
		'<div class="editor-empty-blurb"><p>All models are wrong.</p><p style="margin-top:-10px;">Some models are useful.</p></div>';
	return nothingOpen;
};

const showFileInEditor = (filename, contents) => {
	const fileType = getFileType(filename);
	return !["image", "font", "audio", "video", "zip"].includes(fileType) &&
		!(typeof fileType === "string" && fileType.includes('image/'));
};

let binaryPreview;
const showBinaryPreview = ({ filename, path = "." } = {}) => {
	try{
		document.getElementById('file-search').style.visibility = "";
	}catch(e){}

	if (!binaryPreview) {
		const editorContainer = document.getElementById("editor-container");
		binaryPreview = document.createElement("div");
		binaryPreview.id = "editor-preview";
		editorContainer.appendChild(binaryPreview);
	}

	const state = getState();
	let url;
	try {
		url = state.paths
			.find((x) => x.name === filename)
			.path.replace("/welcome/", "/.welcome/")
			.replace(/^\//, "./");
	} catch (e) {}

	const extension = getExtension(filename);
	const fileType = getFileType(filename);
	const style = `
		<style>
			#editor-preview {
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				padding-bottom: 30%;
				font-size: 2em;
				color: var(--main-theme-text-invert-color);
			}
			#editor-preview .preview-image {
				min-width: 50%;
				image-rendering: pixelated;
				object-fit: contain;
				margin-bottom: -20%;
				padding: 0.7em;
			}
			audio {
				filter: invert(0.7) contrast(1.5);
			}
			audio:focus {
				outline: 0;
				border: 1px solid #444;
				border-radius: 50px;
			}
			video {
				max-width: 95%;
			}
			.image-disclaim {
				position: absolute;
				top: 40px;
				padding: .1em 1em;
				font-size: 0.55em;
				display: flex;
				flex-direction: column;
				justify-content: start;
				align-items: start;
				width: 100%;
			}
			#editor-preview pre {
				font-size: 0.72em;
				opacity: 0.7;
				position: absolute;
				top: 0;
				bottom: 0;
				display: flex;
				justify-content: center;
				align-items: center;
				white-space: pre-line;
			}
		</style>
	`;
	if (fileType === "audio") {
		binaryPreview.innerHTML =
			style +
			`
			<figure>
			<audio
				controls
				loop
				autoplay
				controlsList="play timeline volume"
				src="${url}"
			>
				Your browser does not support the
				<code>audio</code> element.
			</audio>
			</figure>
		`;
	} else if (fileType === "video") {
		binaryPreview.innerHTML =
			style +
			`
			<video
				controls
				loop
				autoplay
				controlsList="play timeline volume"
				disablePictureInPicture
			>
				<source
					src="${url}"
					type="video/${extension}"
				>
				Sorry, your browser doesn't support embedded videos.
			</video>
		`;
	} else {
		binaryPreview.innerHTML =
			style +
			`
			<pre>No editable text for this file type.</pre>
		`;
	}
	return binaryPreview;
};

let systemDocsDOM;
const showSystemDocsView = ({ filename='', errors=[], op='' }) => {
	try{
		document.getElementById('file-search').style.visibility = "";
	}catch(e){}

	if (!systemDocsDOM) {
		const editorContainer = document.getElementById("editor-container");
		systemDocsDOM = SystemDocs();
		editorContainer.appendChild(systemDocsDOM);
	}
	if (filename) {
		systemDocsDOM.querySelector(".thisSystemDoc").innerHTML = SystemDocs(filename);
	}
	const allServicesList = document.getElementById("settings-all-services-list");

	const updateServicesListDom = async () => {
		if(!allServicesList) return;
		allServicesList.innerHTML = "<li>loading...</li>";
		const services = (await getAllServices()) || [];
		const ServiceRowOnClick = (s) => [
			`localStorage.setItem('lastService','${s.id}');`,
			`document.location.reload();`
		].join(' ');
		const ServiceRow = (s) => `
			<li>
				<span>[ ${s.id} ] ${s.name}</span>
				<button onclick="${ServiceRowOnClick(s)}">LOAD</button>
			</li>
		`.trim().replace(/^			/g, '');
		allServicesList.innerHTML = services.map(ServiceRow).join("\n");
	};
	updateServicesListDom();

	// TODO: this could be improved to match the button which error'ed
	if (errors.length) {
		errors.forEach((error) => {
			const domForError = systemDocsDOM.querySelector(
				"." + error.op.replace("-done", "")
			);
			if (domForError) {
				domForError.classList.add("error");
				return;
			}
			console.error(error);
		});
	}

	return systemDocsDOM;
};

function _Editor(callback) {
	const editor = inlineEditor(ChangeHandler);
	let editorPreview, editorDom, nothingOpenDom, systemDocsView;
	let systemDocsErrors = [];

	const messageEditor = ({ op, result }) => {
		if (result.error) {
			systemDocsErrors = systemDocsErrors.filter((x) => x.op === op);
			systemDocsErrors.push({ op, error: result.error });
			showSystemDocsView({ errors: systemDocsErrors });
			return;
		} else {
			showSystemDocsView({ op });
		}
	};

	/*

		event.preventDefault();
		event.stopPropagation();
		document.querySelector('#editor-system-doc')
			.handleMessage({
				fields: Array.from(this.querySelectorAll('input:not(.hidden)'))
					.map(({ name, value })=>({ name, value})),
				action: event.submitter.className
			});
	*/

	connectTrigger({
		eventName: "provider-test",
		data: (event) => {
			return Array.from(
				event.target.parentNode.querySelectorAll('input:not([name="hidden"])')
			).map(({ name, value }) => ({ name, value }));
		},
		filter: (e) =>
			document.querySelector("#editor").contains(e.target) &&
			e.target.classList.contains("provider-test"),
	});
	connectTrigger({
		eventName: "provider-save",
		data: (event) => {
			return Array.from(
				event.target.parentNode.querySelectorAll('input:not([name="hidden"])')
			).map(({ name, value }) => ({ name, value }));
		},
		filter: (e) =>
			document.querySelector("#editor").contains(e.target) &&
			e.target.classList.contains("provider-save"),
	});
	connectTrigger({
		eventName: "provider-add-service",
		data: (event) => {
			return Array.from(
				event.target.parentNode.querySelectorAll('input:not([name="hidden"])')
			).map(({ name, value }) => ({ name, value }));
		},
		filter: (e) =>
			document.querySelector("#editor").contains(e.target) &&
			e.target.classList.contains("provider-add-service"),
	});

	const switchEditor = async (filename, mode, {line, column, forceUpdate}={}) => {
		//TODO: should go into loading mode first

		if (mode === "systemDoc") {
			const editorCallback = () => {
				editorDom = document.querySelector(".CodeMirror");
				editorDom && editorDom.classList.add("hidden");
			};
			editor({
				code: "",
				name: "",
				id: "",
				filename,
				callback: editorCallback,
			});

			systemDocsView = showSystemDocsView({
				filename,
				errors: systemDocsErrors,
			});
			systemDocsView && systemDocsView.classList.remove("hidden");

			editorPreview && editorPreview.classList.add("hidden");
			nothingOpenDom && nothingOpenDom.classList.add("hidden");

			return;
		}

		if (mode === "nothingOpen") {
			const editorCallback = () => {
				editorDom = document.querySelector(".CodeMirror");
				editorDom && editorDom.classList.add("hidden");
			};
			editor({
				code: "",
				name: "",
				id: "",
				filename: "",
				callback: editorCallback,
			});

			nothingOpenDom = showNothingOpen();
			nothingOpenDom && nothingOpenDom.classList.remove("hidden");

			editorPreview && editorPreview.classList.add("hidden");
			editorDom && editorDom.classList.add("hidden");
			systemDocsView && systemDocsView.classList.add("hidden");
			return;
		}

		setCurrentFile({ filePath: filename });

		const currentFile = await getCurrentFileFull({ noFetch: true });
		const {
			code = "error",
			path,
			name,
			id,
			filename: defaultFile,
		} = currentFile || {};

		if (!currentFile || !showFileInEditor(filename, code)) {
			const editorCallback = () => {
				editorDom = document.querySelector(".CodeMirror");
				editorDom && editorDom.classList.add("hidden");
			};
			editor({
				code: "",
				name: "",
				id: "",
				filename: "",
				callback: editorCallback,
			});

			editorPreview = showBinaryPreview({ filename, code });
			editorPreview && editorPreview.classList.remove("hidden");

			editorDom && editorDom.classList.add("hidden");
			nothingOpenDom && nothingOpenDom.classList.add("hidden");
			systemDocsView && systemDocsView.classList.add("hidden");
			return;
		}

		editor({
			code, line, column, name, id, path, forceUpdate,
			filename: filename || defaultFile
		});
		editorDom = document.querySelector(".CodeMirror");
		editorDom && editorDom.classList.remove("hidden");

		editorPreview && editorPreview.classList.add("hidden");
		nothingOpenDom && nothingOpenDom.classList.add("hidden");
		systemDocsView && systemDocsView.classList.add("hidden");
	};

	const paste = async () => {
		window.Editor.focus();
		const toPaste = await navigator.clipboard.readText();
		window.Editor.replaceSelection(toPaste);
	};
	const cutSelected = () => {
		window.Editor.focus();
		const copied = window.Editor.getSelection();
		navigator.clipboard.writeText(copied);
		window.Editor.replaceSelection('');
	};
	const copySelected = () => {
		const copied = window.Editor.getSelection();
		navigator.clipboard.writeText(copied);
	};

	attachListener({
		switchEditor,
		messageEditor,
		paste,
		cutSelected,
		copySelected
	});

	//deprecate
	return {
		inlineEditor: editor,
	};
}


function attachGutterHelper (){
	const getSizers = () => Array.from(document.querySelectorAll(".CodeMirror-sizer"));
	const getGutter = () => editorGutter || document.body.querySelector('.CodeMirror-gutters');

	let gutter = getGutter();
	let inGutter;
	let gutterNoted;

	const removeGutterHovered = () => {
		const cmSizers = getSizers();
		if(!cmSizers.length) return;
		cmSizers.forEach(x => x.classList.remove('gutter-hovered'));
		gutterNoted = false;
	};
	const addGutterHovered = () => {
		const cmSizers = getSizers();
		if(!cmSizers.length) return;
		cmSizers.forEach(x => x.classList.add('gutter-hovered'));
		gutterNoted = true;
	};

	const gutterHandler = (e) => {
		gutter = getGutter();
		if(!gutter) return removeGutterHovered();

		const { className="", classList } = e.target;
		inGutter = gutter.contains(e.target) ||
			classList.contains('CodeMirror-gutters') ||
			classList.contains('gutter-elt') ||
			classList.contains('guttermarker') ||
			(className.includes && className.includes('CodeMirror-guttermarker'));

		if(inGutter && !gutterNoted) return addGutterHovered();
		if(!inGutter && gutterNoted) return removeGutterHovered();
	};

	const listenOpts = { passive: true, capture: false };
	document.body.addEventListener("mouseover", gutterHandler, listenOpts);
}
attachGutterHelper();

export default _Editor;

//import "https://cdn.jsdelivr.net/npm/xterm@4.4.0/lib/xterm.min.js";
//import "https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.3.0/lib/xterm-addon-fit.js";
import "../../shared/vendor/xterm.min.js";
import "../../shared/vendor/xterm-addon-fit.js";
import { debounce } from "../../shared/modules/utilities.mjs";

import motd from "./motd.mjs";
import { attachEvents, connectTrigger, execCommand } from './events/terminal.mjs';
import { templateJSX, templateSVC3, transform } from './Templates.mjs';

const iframeSandboxPermissions = "allow-same-origin allow-scripts allow-popups allow-modals allow-downloads allow-forms";

let EventTrigger;

function _Terminal(){
	const options = {
		theme: {
			foreground: '#ccc', // '#ffffff',
			//background: '#000',
			background: 'rgba(255, 255, 255, 0.0)', // '#1e1e1e',
			cursor: '#ffffff',
			selection: 'rgba(255, 255, 255, 0.3)',
			black: '#000000',
			red: '#e06c75',
			brightRed: '#e06c75',
			green: '#A4EFA1',
			brightGreen: '#A4EFA1',
			brightYellow: '#EDDC96',
			yellow: '#EDDC96',
			magenta: '#e39ef7',
			brightMagenta: '#e39ef7',
			cyan: '#5fcbd8',
			brightBlue: '#5fcbd8',
			brightCyan: '#5fcbd8',
			blue: '#5fcbd8',
			white: '#b0b0b0',
			brightBlack: '#808080',
			brightWhite: '#ffffff'
		},
		allowTransparency: true,
		fontSize: 13,
		fontWeight: 100,
		convertEol: true
	};

	const term = new Terminal(options);

	const fitAddon = new (FitAddon.FitAddon)();
	term.loadAddon(fitAddon);

	const termContainer = document.createElement('div');
	termContainer.classList.add('term-contain');

	const selected = localStorage.getItem('rightPaneSelected') || "terminal";

	const pvActive = [];
	const pvControlsClass = (type) => `
		${type}-action
		preview-control
		${selected==="preview" ? "" : "hidden"}
		${pvActive.includes(type) ? "checked" : ""}
	`.split('\n').filter(x => !!x).join('');

	const termMenu = document.createElement('div');
	termMenu.id = "terminal-menu";
	termMenu.innerHTML = `
	<style>
		#terminal-menu > div:nth-child(2) ul li {
			padding-left: 15px;
		}
		#terminal-menu li.action-item:hover a.action-label {
			filter: none;
			color: rgb(231, 231, 231);
		}
		#terminal-menu li.action-item.checked a {
			color: rgb(231, 231, 231);
			border-bottom-color: rgba(128, 128, 128, 0.8);
		}
		#terminal-menu .terminal-actions li.action-item.checked a {
			border-bottom: 0;
		}
		li.action-item.preview-control.checked a.lock-panel-action {
			filter: brightness(.55) sepia(1) contrast(5);
		}
		#terminal-menu li.full-screen a {
			-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'/%3E%3C/svg%3E") no-repeat 50% 50%;
		}
		#terminal-menu li.full-screen.full-screen-exit a {
			-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z'/%3E%3C/svg%3E") no-repeat 50% 50% !important;
		}
		#terminal-menu li.full-screen a:before {
			content: '■';
			font-size: 62px;
			position: relative;
		}
		#terminal:fullscreen {
			padding-right: 18px;
		}
	</style>
	<div class="composite-bar panel-switcher-container">
		 <div class="monaco-action-bar">
				<ul class="actions-container view-switcher" role="toolbar" aria-label="Active View Switcher">
					 <li class="action-item ${selected==="terminal" ? "checked" : ""}" role="tab" draggable="true" active>
							<a class="action-label terminal" data-type="terminal">Terminal</a>
					 </li>
					 <li class="action-item ${selected==="preview" ? "checked" : ""}" role="tab" draggable="true">
							<a class="action-label preview" data-type="preview">Preview</a>
						</li>
						<li class="action-item hidden ${selected==="logs" ? "checked" : ""}" role="tab" draggable="true">
							<a class="action-label logs" data-type="logs">Logs</a>
						</li>
					 <li class="action-item" role="button" aria-label="Additional Views" title="Additional Views">
							<a class="action-label toggle-more" aria-label="Additional Views" title="Additional Views" style="background-color: rgb(30, 30, 30);"></a>
							<div class="badge" aria-hidden="true" aria-label="Additional Views" title="Additional Views" style="display: none;">
								 <div class="badge-content" style="color: rgb(255, 255, 255); background-color: rgb(77, 77, 77);"></div>
							</div>
					 </li>
				</ul>
		 </div>
	</div>
	<div class="title-actions terminal-actions">
		 <div class="monaco-toolbar">
				<div class="monaco-action-bar animated">
					 <ul class="actions-container" role="toolbar" aria-label="Terminal actions">
							<li class="action-item select-container" role="presentation">
								 <select class="monaco-select-box" aria-label="Open Terminals." title="1: node, node" style="background-color: rgb(60, 60, 60); color: rgb(240, 240, 240); border-color: rgb(60, 60, 60);">
										<option value="1: node, node">1: node, node</option>
								 </select>
							</li>
							<li class="action-item" role="presentation"><a class="hidden action-label icon terminal-action new" role="button" title="New Terminal"></a></li>
							<li class="action-item" role="presentation"><a class="hidden action-label icon terminal-action split" role="button" title="Split Terminal (⌘\)"></a></li>
							<li class="action-item" role="presentation"><a class="hidden action-label icon terminal-action kill" role="button" title="Kill Terminal"></a></li>
							<li class="action-item" role="presentation"><a class="hidden action-label icon maximize-panel-action" role="button" title="Maximize Panel Size"></a></li>

							<li class="action-item full-screen"
								role="presentation"
								data-type="full-screen"
							>
								<a class="action-label icon full-screen-panel-action" data-type="full-screen" role="button" title="Preview Full Screen"></a>
							</li>

							<li class="action-item ${pvControlsClass("lock")}"
								role="presentation"
								data-type="lock"
							>
								<a class="action-label icon lock-panel-action" data-type="lock" role="button" title="Lock Preview"></a>
							</li>

							<li class="action-item" role="presentation">
								<a class="disabled action-label icon hide-panel-action" role="button" title="Close Panel">
								</a>
							</li>
					 </ul>
				</div>
		 </div>
	</div>
	`;
	const termMenuActions = termMenu.querySelector('.terminal-actions');

	const previewContainer = document.createElement('div');
	previewContainer.classList.add('preview-contain');
	const showIframe = selected === "preview";
	!showIframe && previewContainer.classList.add('hidden');
	// const iframeUrl = showIframe
	// 	? "./reveal.html"
	// 	: "";
	const iframeUrl=""
	previewContainer.innerHTML = `
		<style>
			.preview-contain {
				position: absolute;
				left: 0;
				right: 0;
				top: 0px;
				bottom: 0px;
				background: #1d1d1d;
				z-index: 9;
				overflow: hidden;
			}
			#terminal iframe {
				position: relative;
				top: 0;
				right: -1px;
				left: -1px;
				bottom: -1px;
				width: calc(100% + 2px);
				height: 100%;
				z-index: 100;
				border: 0px;
			}
		</style>
		<iframe src="${iframeUrl}" sandbox="${iframeSandboxPermissions}"></iframe>
	`;

	const terminalPane = document.getElementById('terminal')
	terminalPane.appendChild(termMenu);
	terminalPane.appendChild(termContainer);
	terminalPane.appendChild(previewContainer);

	let previewIframe = previewContainer.querySelector('iframe');

	term.open(document.querySelector('#terminal .term-contain'));

	// term.prompt = () => {
  //   term.write("\r\n$ ");
	// };
	let charBuffer = [];
	const onEnter = function(callback){
		if(!charBuffer.length){
			return;
		}
		const command = charBuffer.join('');

		let preventDefault;
		try {
			preventDefault = EventTrigger(command, callback);
		}catch(e){}
		if(preventDefault){
			charBuffer = [];
			return;
		}

		term.write('\n');
		execCommand({
			command,
			loading: (m) => term.write(m),
			done: (m) => {
				m && term.write(m);
				setTimeout(() => fitAddon.fit(), 10);
				callback && callback();
			}
		});
		charBuffer = [];
		//term.write("\n$ ");
	};

	function prompt(term) {
		term.write('\x1B[38;5;14m \r\n∑ \x1B[0m');
	}

	term.attachCustomKeyEventHandler((event)=> {
		const F5 = 116;
		const F11 = 122;
		const keysToBubbleUp = [
			F5, F11
		];
		return !keysToBubbleUp
			.includes(event.which || event.keyCode);
	});

	term.onKey((e) => {
		const printable = !e.domEvent.altKey && !e.domEvent.altGraphKey && !e.domEvent.ctrlKey && !e.domEvent.metaKey;
		if (e.domEvent.keyCode === 13) {
				if(['cls', 'clear'].includes(charBuffer.join(''))){
					charBuffer = [];
					term.write('\x1B[2K');
					term.clear();
					term.write('\n\x1B[38;5;14m \r∑ \x1B[0m');
					//prompt(term);
					return;
				}
				onEnter(() => {
					prompt(term);
				});
		} else if (e.domEvent.keyCode === 8) {
				// Do not delete the prompt
				if (term._core.buffer.x > 2) {
						charBuffer.pop();
						term.write('\b \b');
				}
		} else if (printable) {
			if(e.key.length === 1){
				charBuffer.push(e.key);
			}
			term.write(e.key);
		}
	});

	term.onResize(() => {
		fitAddon.fit();
	});

	// not sure if this is really needed
	window.termResize = () => {
		fitAddon.fit();
	};

	window.addEventListener('resize', function() {
		fitAddon.fit();
	});

	fitAddon.fit();

	if(window.FUN ){
		//const whichMotd = Math.floor(Math.random() * motd.length);
		const whichMotd = 1;
		term.write(
			motd[whichMotd]
		);
	} else {
		term.write(`\x1B[38;5;242m
			Bartok Service Composer v0.4
		\x1B[0m`.replace(/\t/g, ''));
	}

	prompt(term);
	window.term = term;

	const updateLockIcon = (locked) => {
		const lockIconLi = termMenuActions.querySelector('.lock-action');
		if(locked){
			lockIconLi.classList.add('checked');
		} else {
			lockIconLi.classList.remove('checked');
		}
	};

	let alreadyUpdatedOnce;
	function updateIframeRaw({ url, src, soft}){
		if(url && soft && previewIframe.src === new URL(url, document.baseURI).href){
			return;
		}
		previewContainer.removeChild(previewIframe);
		previewIframe = document.createElement('iframe');
		previewIframe.setAttribute('sandbox', iframeSandboxPermissions)
		previewContainer.appendChild(previewIframe);

		alreadyUpdatedOnce = true;

		if(url){
			previewIframe.src = url;
			return;
		}
		const iframeDoc = previewIframe.contentWindow.document
		//previewIframe.contentWindow.location.href="about:blank";

		iframeDoc.open("text/html", "replace");
		iframeDoc.write(src);
		iframeDoc.close();

		// another way of doing it
		//iframeDoc.src="javascript:'"+doc+"'";

		// yet another way of doing it
		//iframeDoc.srcdoc = doc;
	}

	const updateIframe = debounce(updateIframeRaw, 300);
	const reloadIframe = (wait=0) => {
		/*
		TODO: in the future, frame will be reloaded offscreen and then replaced when loaded
		see: https://stackoverflow.com/a/18107241
		*/
		setTimeout(() => {
			previewIframe.contentWindow.location.reload();
		}, wait);
	};

	function viewUpdate({ supported, view, type, doc, docName, locked, url, wait=1000 }){
		if(locked !== undefined
			// && type !== "viewSelect"
			// && ![supported, view, type, doc, docName, url].find(x => x !== undefined)
		){
			updateLockIcon(locked);
			// return;
		}
		// if(!supported && doc && doc.includes('<!-- NO_PREVIEW -->')){
		// 	updateIframeRaw({ src: doc });
		// 	return;
		// }
		if(type ==="forceRefreshOnPersist"){
			reloadIframe(wait);
			return;
		}
		type !== "forceRefreshOnPersist" && updateLockIcon(locked);
		if(!supported && !doc && !url) debugger
		let src = supported
			? transform({ name: docName, contents: doc })
			: (docName||'').includes('jsx')
				? templateJSX(doc)
				: (doc||'').includes('/* svcV3 ')
					? templateSVC3(doc)
					: doc;

		if(type === "viewSelect"){
			const switcher = document.querySelector("#terminal-menu .panel-switcher-container");
			const termMenuActions = document.querySelector("#terminal-menu .terminal-actions");
			const previewControls = Array.from(termMenuActions.querySelectorAll('.preview-control'));

			Array.from(switcher.querySelectorAll(".action-item.checked"))
				.forEach(el => el.classList.remove('checked'));

			const newCheckedItem = switcher.querySelector(`.action-label[data-type=${view}]`);
			newCheckedItem.parentNode.classList.add('checked');

			if(view !== 'preview'){
				previewControls.forEach(pc => pc.classList.add('hidden'));
				previewContainer.classList.add('hidden');
				return;
			}

			previewControls.forEach(pc => pc.classList.remove('hidden'));
			previewContainer.classList.remove('hidden');
			updateIframe({ src, url, soft: true });
			return;
		}

		if(!locked && type === "fileClose" && !doc ){
			updateIframe({ src: "" });
			return;
		}
		if([
			"forceRefreshOnPersist",
			"operationDone"
		].includes(type)){
			updateIframeRaw({ src, url });
			return;
		}
		if(type === "previewSelect"){
			updateIframeRaw({ src, url });
		}
		if(
			type === "fileClose" ||
			type === "termMenuAction" ||
			type === "fileSelect" ||
			type === "fileChange"
		){

			if(!locked || !alreadyUpdatedOnce){
				updateIframeRaw({ src, url });
			}
			return;
		}
	}

	let terminalFullScreen = false;
	function terminalActions({ action, view, type, doc, docName, locked }){
		if(action === "full-screen"){
			if (!document.fullscreenEnabled) {
				console.error('fullscreen not supported');
				return;
			}
			const terminalDiv = document.getElementById('terminal');
			const terminalMenuFSItem = document.querySelector('.action-item.full-screen');
			if(terminalFullScreen){
				terminalFullScreen = false;
				terminalMenuFSItem.classList.remove('full-screen-exit');
				document.exitFullscreen();
			} else {
				terminalFullScreen=true;
				terminalMenuFSItem.classList.add('full-screen-exit');
				terminalDiv.requestFullscreen();
			}
			return;
		}
		updateLockIcon(locked);
	}


	connectTrigger({
		eventName: 'viewSelect',
		filter: e => termMenu.querySelector('.view-switcher').contains(e.target)
			&& e.target.tagName === 'A',
		data: (e) => ({ detail: { view: e.target.dataset.type } })
	});

	connectTrigger({
		eventName: 'termMenuAction',
		filter: e => termMenu.querySelector('.terminal-actions').contains(e.target)
			&& e.target.tagName === 'A'
			&& e.target.parentNode.parentNode.classList.contains('actions-container'),
		data: (e) => ({ detail: { action: e.target.dataset.type } })
	});

	EventTrigger = attachEvents({
		write: (x) => term.write(x),
		viewUpdate,
		viewReload: reloadIframe,
		terminalActions
	});
}

export default _Terminal;

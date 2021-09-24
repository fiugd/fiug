//import JSTreeView from "/shared/vendor/js-treeview.1.1.5.js";
import TreeView from "/shared/modules/TreeView.mjs";
import ext from "/shared/icons/seti/ext.json.mjs";

import { attachListener, connectTrigger } from "./treeEvents.mjs";
import "/shared/vendor/localforage.min.js";

let treeView, opener, tree, triggers, _service;

const driver = [
	localforage.INDEXEDDB,
	localforage.WEBSQL,
	localforage.LOCALSTORAGE,
];
const changesStore = localforage.createInstance({
	driver,
	name: "service-worker",
	version: 1.0,
	storeName: "changes",
	description: "keep track of changes not pushed to provider",
});

const treeMemory = (service, tree, action) => (...args) => {
	const handlers = {
		expand: async (args) => {
			const expanded = tree.context(args[0].target).path;
			const oldExpanded = (await changesStore.getItem(`tree-${service.name}-expanded`)) || [];
			const newExpanded = oldExpanded.includes(expanded)
				? oldExpanded
				: [...oldExpanded, expanded];
			await changesStore.setItem(`tree-${service.name}-expanded`, newExpanded);
		},
		collapse: async (args) => {
			const collapsed = tree.context(args[0].target).path;
			const oldExpanded = (await changesStore.getItem(`tree-${service.name}-expanded`)) || [];
			const newExpanded = oldExpanded.filter(x => x !== collapsed);
			await changesStore.setItem(`tree-${service.name}-expanded`, newExpanded);
		},
		select: async (args) => {
			const selected = tree.context(args[0].target).path;
			//await changesStore.setItem(`tree-${service.name}-selected`, selected);
		}
	};
	if(!handlers[action]) return;
	handlers[action](args);
};

function htmlToElement(html) {
	var template = document.createElement("template");
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	//also would be cool to remove indentation from all lines
	return template.content.firstChild;
}

const utils = (() => {
	const unique = (arr) => Array.from(new Set(arr));
	const htmlEscape = (html) =>
		[
			[/&/g, "&amp;"], //must be first
			[/</g, "&lt;"],
			[/>/g, "&gt;"],
			[/"/g, "&quot;"],
			[/'/g, "&#039;"],
		].reduce((a, o) => a.replace(...o), html);
	const highlight = (term = "", str = "", limit) => {
		const caseMap = str
			.split("")
			.map((x) => (x.toLowerCase() === x ? "lower" : "upper"));

		const splitstring = str.toLowerCase().split(term.toLowerCase());
		let html =
			"<span>" +
			(limit === 1
				? splitstring[0] +
					`</span><span class="highlight">${term.toLowerCase()}</span><span>` +
					splitstring.slice(1).join(term.toLowerCase())
				: splitstring.join(
						`</span><span class="highlight">${term.toLowerCase()}</span><span>`
					)) +
			"</span>";
		if ((limit = 1)) {
		}
		html = html.split("");

		let intag = false;
		for (let char = 0, i = 0; i < html.length; i++) {
			const thisChar = html[i];
			if (thisChar === "<") {
				intag = true;
				continue;
			}
			if (thisChar === ">") {
				intag = false;
				continue;
			}
			if (intag) continue;
			if (caseMap[char] === "upper") {
				html[i] = html[i].toUpperCase();
			}
			char++;
		}
		return html.join("");
	};
	const debounce = (func, wait, immediate) => {
		var timeout;
		return async function () {
			var context = this,
				args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	return {
		unique,
		htmlEscape,
		highlight,
		debounce,
	};
})();

const ProjectOpener = () => {
	let _opener = htmlToElement(`
		<div class="service-opener">
			<style>
				.service-opener > div {
					display: flex;
					flex-direction: column;
					padding: 0px 20px;
					margin-right: 17px;
				}
				.service-opener button {
					color: inherit;
					background: rgba(var(--main-theme-highlight-color), 0.4);
					font-size: 1.1em;
					border: 0;
					padding: 10px;
					margin-top: 3em;
					cursor: pointer;
				}
				.service-opener  p {
					white-space: normal;
					margin-bottom: 0;
				}
				.service-opener .opener-note {
					font-style: italic;
					opacity: 0.8;
				}
				.service-opener .opener-note:before {
					content: 'NOTE: '
				}
			</style>
			<div class="service-opener-actions">
				<p>You have nothing to edit. Pick an option below to get started.</p>
				<p class="opener-note">Your work will stay in this browser unless you arrange otherwise.</p>

				<button id="add-service-folder">Open Folder</button>
				<p>Upload from your computer into local browser memory.</p>

				<button id="connect-service-provider">Connect to a Provider</button>
				<p>Specify a service to read from and write to.</p>

				<button id="open-previous-service">Load Service</button>
				<p>Select a previously-loaded service.</p>
			</div>
		</div>
	`);
	const openerActions = _opener.querySelector(".service-opener-actions");
	connectTrigger({
		eventName: "add-service-folder",
		filter: (e) =>
			openerActions.contains(e.target) &&
			e.target.tagName === "BUTTON" &&
			e.target.id === "add-service-folder",
	});
	connectTrigger({
		eventName: "connect-service-provider",
		filter: (e) =>
			openerActions.contains(e.target) &&
			e.target.tagName === "BUTTON" &&
			e.target.id === "connect-service-provider",
	});
	connectTrigger({
		eventName: "open-previous-service",
		filter: (e) =>
			openerActions.contains(e.target) &&
			e.target.tagName === "BUTTON" &&
			e.target.id === "open-previous-service",
	});

	return _opener;
};

const ScrollShadow = () => {
	let scrollShadow = htmlToElement(`
		<div class="scroll-shadow">
			<style>
				.scroll-shadow {
					box-shadow: #000000 0 6px 6px -6px inset;
					height: 6px;
					position: absolute;
					top: 35px;
					left: 0;
					right: 0;
					display: none;
				}
			</style>
		</div>
	`);
	treeView.addEventListener("scroll", (event) => {
		try {
			event.target.scrollTop > 0
				? (scrollShadow.style.display = "block")
				: (scrollShadow.style.display = "none");
		} catch (e) {
			scrollShadow.style.display = "none";
		}
	});
	return scrollShadow;
};

const TreeMenu = () => {
	const _treeMenu = document.createElement("div");
	_treeMenu.id = "tree-menu";
	_treeMenu.classList.add("row", "no-margin");
	const menuInnerHTML = `
		<style>
			#tree-menu .title-actions .action-item a {
				color: inherit;
				outline: none;
			}
		</style>
		<div class="title-label">
			<h2 title=""></h2>
		</div>
		<div class="title-actions">
			<div class="monaco-toolbar">
					<div class="monaco-action-bar animated">
						<ul class="actions-container">
								<li class="action-item">
									<a class="action-label codicon explorer-action codicon-new-file" role="button" title="New File">
									</a>
								</li>
								<li class="action-item">
									<a class="action-label codicon explorer-action codicon-new-folder" role="button" title="New Folder">
									</a>
								</li>
								<li class="action-item hidden">
									<a class="action-label icon explorer-action refresh-explorer" role="button" title="Refresh Explorer">
									</a>
								</li>
								<li class="action-item hidden">
									<a class="action-label icon explorer-action collapse-explorer" role="button" title="Collapse Folders in Explorer">
									</a>
								</li>
								<li class="action-item hidden">
									<div class="monaco-dropdown">
										<div class="dropdown-label">
											<a class="action-label codicon codicon-toolbar-more" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false" title="Views and More Actions..."></a>
										</div>
									</div>
								</li>
						</ul>
					</div>
			</div>
		</div>
	`;
	_treeMenu.addEventListener(
		"click",
		(e) => {
			if (!_treeMenu.contains(e.target)) return;
			if (
				e.target.tagName === "A" &&
				e.target.className.includes("codicon-toolbar-more")
			) {
				console.warn("toolbar-more: not implemented");
				e.preventDefault();
				return false;
			}
		},
		{ passive: false }
	);
	connectTrigger({
		eventName: "new-file",
		filter: (e) =>
			_treeMenu.contains(e.target) &&
			e.target.tagName === "A" &&
			e.target.title === "New File",
	});
	connectTrigger({
		eventName: "new-folder",
		filter: (e) =>
			_treeMenu.contains(e.target) &&
			e.target.tagName === "A" &&
			e.target.title === "New Folder",
	});
	_treeMenu.innerHTML = menuInnerHTML;
	return _treeMenu;
};

const SearchBoxHTML = () => {
	const style = `
	<style>
		.tree-search {
			display: flex;
			flex-direction: column;
			margin-right: 0;
			user-select: none;
		}
		.tree-search p {
			white-space: normal;
		}
		.tree-search input {
			background: var(--main-theme-background-color) !important;
			margin: 0 !important;
			border: 0 !important;
			color: var(--main-theme-text-color);
			padding-left: .5em !important;
			padding-right: .5em !important;
			font-size: 1.1em !important;
			box-sizing: border-box !important;
			padding-top: .25em !important;
			padding-bottom: .25em !important;
			height: unset !important;
			transition: unset !important;
			border: 1px solid !important;
			border-color: transparent !important;
		}
		.tree-search input:focus {
			box-shadow: none !important;
			border-color: rgb(var(--main-theme-highlight-color)) !important;
		}
		.tree-search ::placeholder,
		.project-search-results {
			color: var(--main-theme-text-invert-color);
		}
		.tree-search > div {
			padding: 2px 0px;
			box-sizing: content-box;
		}
		.tree-search .field-container {
			margin-left: 17px;
			margin-right: 10px;
		}
		.tree-search .highlight {
			background: rgba(var(--main-theme-highlight-color), 0.25);
			padding-top: 4px;
			padding-bottom: 4px;
			filter: contrast(1.5);
			border-radius: 3px;
		}
		.form-container {
			position: absolute;
			top: 40px;
			left: 0;
			right: 0;
			bottom: 0;
			overflow: hidden;
		}
		.search-results::-webkit-scrollbar {
			display: none;
		}
		.search-results:hover::-webkit-scrollbar {
			display: block !important;
		}
		.search-results::-webkit-scrollbar {
			width:0.5em !important;
			height:0.5em !important;
		}
		.search-results::-webkit-scrollbar-thumb{
			background: #ffffff10;
		}
		.search-results::-webkit-scrollbar-track{
			background:none !important;
		}
		.search-results {
			padding-bottom: 15em;
			position: absolute;
			bottom: 0;
			top: 155px;
			overflow-y: auto;
			overflow-x: hidden;
			box-sizing: border-box;
			margin: 0;
			left: 0;
			right: 0;
			font-size: 0.9em;
			padding-right: 0;
		}
		.search-results > li { list-style: none; }

		.search-results > li > div {
			padding-left: 1em;
			padding-bottom: 0.2em;
			padding-top: 0.2em;
		}
		.search-results > li ul > li {
			white-space: nowrap;
			padding-left: 3em;
			padding-top: .2em;
			padding-bottom: .2em;
		}

		.search-results > li > div,
		.search-results > li ul > li,
		.search-results > li > div span,
		.search-results > li ul > li span {
			position: relative;
			white-space: nowrap;
		}
		.search-results ul.line-results > li > span,
		.search-results ul.line-results > li > div {
			user-select: none;
			pointer-events: none;
		}
		.search-results > li > div .hover-highlight,
		.search-results > li ul > li .hover-highlight {
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
			visibility: hidden;
			pointer-events: none;
			user-select: none;
			background: rgba(var(--main-theme-highlight-color), 0.15);
		}
		.search-results > li > div:hover .hover-highlight,
		.search-results > li ul > li:hover .hover-highlight {
			visibility: visible;
		}

		.search-summary {
			font-size: .85em;
			opacity: 0.7;
		}
		.search-results .foldable {
			cursor: pointer;
		}
		.search-results span.doc-path {
			opacity: .5;
		}
		.search-results .foldable ul { display: none; }
		.search-results .foldable > div span {
			pointer-events: none;
			user-select: none;
		}
		.search-results .foldable > div:before {
			margin-left: 4px;
			margin-right: 3px;
			content: '>';
			font-family: consolas, monospace;
			display: inline-block;
		}
		.search-results .foldable.open ul { display: block; }
		.search-results .foldable.open > div:before {
			margin-left: 2px;
			margin-right: 5px;
			content: '>';
			transform-origin: 5px 8.5px;
			transform: rotateZ(90deg);
		}
		.field-container label { font-size: .75em; }

	</style>
	`;

	const html = `
	<div class="form-container tree-search">
		${style}

		<div class="field-container">
			<input type="text" placeholder="Search" class="search-term project-search-input" spellcheck="false"/>
		</div>

		<div class="field-container">
			<label>include</label>
			<input type="text" class="search-include"/>
		</div>

		<div class="field-container">
			<label>exclude</label>
			<input type="text" class="search-exclude"/>
		</div>

		<div class="field-container">
			<span class="search-summary"></span>
		</div>

		<ul class="search-results"></ul>
	</div>
	`;

	return html;
};

class SearchBox {
	dom;

	constructor(parent, include) {
		const main = htmlToElement(SearchBoxHTML());
		this.dom = {
			main,
			term: main.querySelector(".search-term"),
			include: main.querySelector(".search-include"),
			exclude: main.querySelector(".search-exclude"),
			summary: main.querySelector(".search-summary"),
			results: main.querySelector(".search-results"),
		};
		this.dom.include.value = include || "./";
		this.attachListeners();
		(parent || document.body).appendChild(main);
	}

	attachListeners() {
		const debouncedInputListener = utils.debounce(
			(event) => {
				const term = this.dom.term.value;
				const include = this.dom.include.value;
				const exclude = this.dom.exclude.value;
				this.updateResults([], "");
				this.updateSummary({});
				this.searchStream({ term, include, exclude });
			},
			250,
			false
		);
		this.dom.term.addEventListener("input", (e) => {
			const term = this.dom.term.value;
			if (!term) {
				this.term = "";
				this.updateSummary({});
				this.dom.results.innerHTML = "";
				this.updateResults([], "");
				return;
			}
			this.updateSummary({ loading: true });
			this.updateResults({ loading: true });
			debouncedInputListener(e);
		});
		this.dom.include.addEventListener("input", (e) => {
			this.updateSummary({ loading: true });
			this.updateResults({ loading: true });
			debouncedInputListener(e);
		});
		this.dom.exclude.addEventListener("input", (e) => {
			this.updateSummary({ loading: true });
			this.updateResults({ loading: true });
			debouncedInputListener(e);
		});
		this.dom.results.addEventListener("click", (e) => {
			const handler = {
				"DIV foldable": () => e.target.parentNode.classList.add("open"),
				"DIV foldable open": () => e.target.parentNode.classList.remove("open"),
				"LI line-results": (e) => triggers.fileSelect(e.target.dataset),
			}[`${e.target.tagName} ${e.target.parentNode.className.trim()}`];

			if (handler) return handler(e);
		});
	}

	async searchStream({ term, include, exclude }) {
		this.dom.results.innerHTML = "";
		this.updateSummary({});

		const base = new URL("../../service/search", location.href).href;
		const res = await fetch(
			`${base}/?term=${term}&include=${include || ""}&exclude=${exclude || ""}`
		);
		const reader = res.body.getReader();
		const decoder = new TextDecoder("utf-8");
		const timer = { t1: performance.now() };
		let allMatches = [];
		let malformed;
		this.resultsInDom = false;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			let results = decoder.decode(value, { stream: true });
			if (malformed) {
				results = malformed.trim() + results.trim();
				malformed = "";
			}
			if (results.trim()[results.trim().length - 1] !== "}") {
				results = results.split("\n");
				malformed = results.pop();
				results = results.join("\n");
			}
			results = results.split("\n").filter((x) => !!x);
			this.updateResults(results, allMatches, term);
			this.updateSummary({
				allMatches,
				time: performance.now() - timer.t1,
				searchTerm: term,
			});
		}
	}

	updateTerm(term) {
		this.dom.term.value = term;
	}

	updateInclude(path) {
		this.dom.include.value = path;
	}

	hide() {
		this.dom.main.style.visibility = "hidden";
	}

	show() {
		this.dom.main.style.visibility = "visible";
	}

	async updateResults(results, allMatches, term) {
		const addFileResultsLineEl = (result) => {
			const limit = 1; //only highlight one occurence
			const listItemEl = (Array.isArray(result) ? result : [result]).map(
				(r, i) => `
					<li data-source="${r.file}" data-line="${r.line}" data-column="${r.column}">
						<div class="hover-highlight"></div>
						${utils.highlight(term, utils.htmlEscape(r.text.trim()), limit)}
					</li>
				`
			);
			return listItemEl;
		};
		const createFileResultsEl = (result, index) => {
			const items = ["html", "json", "info"];
			const iconClass =
				"icon-" + items[Math.floor(Math.random() * items.length)];
			const open = term.length > 1 || !this.resultsInDom ? "open" : "";
			const fileResultsEl = htmlToElement(`
				<li class="foldable ${open}" data-path="${result.file}">
					<div>
						<div class="hover-highlight"></div>
						<span class="${iconClass}">${result.docName}</span>
						<span class="doc-path">${result.path}</span>
					</div>
					<ul class="line-results">
						${addFileResultsLineEl(result).join("\n")}
					</ul>
				</li>
			`);
			return fileResultsEl;
		};
		for (var rindex = 0; rindex < results.length; rindex++) {
			const x = results[rindex];
			try {
				const parsed = JSON.parse(x);
				parsed.docName = parsed.file.split("/").pop();
				parsed.path = parsed.file
					.replace("/" + parsed.docName, "")
					.replace(/^\.\//, "");
				allMatches.push(parsed);

				window.requestAnimationFrame(() => {
					const existingFileResultsEl = this.dom.results.querySelector(
						`li[data-path="${parsed.file}"] ul`
					);
					let newLineItems;
					if (existingFileResultsEl) {
						newLineItems = addFileResultsLineEl(parsed);
					}
					if (newLineItems) {
						const elementItems = newLineItems.map(htmlToElement);
						existingFileResultsEl.append(...elementItems);
						return;
					}
					const fileResultsEl = createFileResultsEl(parsed, rindex);
					this.dom.results.appendChild(fileResultsEl);
					this.resultsInDom = true;
				});
			} catch (e) {
				console.warn(`trouble parsing: ${x}, ${e}`);
			}
		}
	}

	updateSummary({ allMatches, time, searchTerm, loading }) {
		if (loading) {
			this.dom.summary.innerHTML = "";
			return;
		}
		if (!allMatches || !allMatches.length) {
			this.dom.summary.innerHTML = "No results";
			return;
		}
		const totalFiles = utils
			.unique(allMatches.map((x) => x.docName))
			.map((x) => ({
				filename: x,
				results: [],
			}));
		const pluralRes = allMatches.length > 1 ? "s" : "";
		const pluralFile = totalFiles.length > 1 ? "s" : "";
		this.dom.summary.innerHTML = `${allMatches.length} result${pluralRes} in ${
			totalFiles.length
		} file${pluralFile}, ${time.toFixed(2)} ms`;
	}
}

let searchBox;
const Search = (parent) => {
	searchBox = searchBox || new SearchBox(parent);
	searchBox.hide();
	/*
	searchBox.updateTerm(searchTerm);
	searchBox.updateInclude(path)
	searchBox.searchStream({ term: searchTerm, include: path })
*/

	return searchBox;
};

const getTreeViewDOM = ({ showOpenService } = {}) => {
	if (opener && showOpenService) {
		opener.classList.remove("hidden");
		const treeMenuLabel = document.querySelector("#tree-menu .title-label h2");
		treeMenuLabel.innerText = "NO FOLDER OPENED";
		treeView && treeView.classList.add("nothing-open");
	} else if (opener) {
		opener.classList.add("hidden");
		treeView && treeView.classList.remove("nothing-open");
	}
	if (treeView) {
		return treeView;
	}

	treeView = document.createElement("div");
	treeView.id = "tree-view";
	opener = ProjectOpener();
	if (showOpenService) {
		const treeMenuLabel = document.querySelector("#tree-menu .title-label h2");
		treeMenuLabel.innerText = "NO FOLDER OPENED";
		treeView.classList.add("nothing-open");
	} else {
		treeView.classList.remove("nothing-open");
		opener.classList.add("hidden");
	}
	treeView.appendChild(opener);

	const explorerPane = document.body.querySelector("#explorer");
	explorerPane.appendChild(TreeMenu());
	Search(explorerPane);
	explorerPane.appendChild(ScrollShadow(treeView));
	explorerPane.appendChild(treeView);
	explorerPane.classList.remove("pane-loading");

	return treeView;
};

const updateTree = (treeView) => (change, { name, id, file }) => {
	return;
	//TODO: fix this (should be handled by tree module)
	if (change !== "dirty") {
		return;
	}

	let dirtyParents;
	//console.log(`Need to mark ${file} from ${name} ${id} as dirty`);
	Array.from(treeView.querySelectorAll(".tree-leaf-content")).forEach((t) => {
		const item = JSON.parse(t.dataset.item);
		if (item.name === file) {
			t.classList.add("changed");
			dirtyParents = t.dataset.path.split("/").filter((x) => !!x);
		}
	});
	if (!dirtyParents) {
		return;
	}
	Array.from(treeView.querySelectorAll(".tree-leaf-content")).forEach((t) => {
		const item = JSON.parse(t.dataset.item);
		if (dirtyParents.includes(item.name)) {
			t.classList.add("changed");
		}
	});
};

function treeDomNodeFromPath(path) {
	if (!path) {
		return document.querySelector("#tree-view");
	}
	const leaves = Array.from(
		document.querySelectorAll("#tree-view .tree-leaf-content")
	);
	const name = path.split("/").pop();
	const found = leaves.find((x) => JSON.parse(x.dataset.item).name === name);
	return found;
}

function newFile({ parent, onDone }) {
	if (!onDone) {
		return console.error("newFile requires an onDone event handler");
	}
	const parentDOM = treeDomNodeFromPath(parent);
	let nearbySibling;
	if (parent) {
		const expando = parentDOM.querySelector(".tree-expando");
		expando.classList.remove("closed");
		expando.classList.add("expanded", "open");
		const childLeaves = parentDOM.parentNode.querySelector(
			".tree-child-leaves"
		);
		childLeaves.classList.remove("hidden");
		nearbySibling = childLeaves.querySelector(".tree-leaf");
	} else {
		try {
			nearbySibling = Array.from(parentDOM.children).find(
				(x) =>
					JSON.parse(x.querySelector(".tree-leaf-content").dataset.item)
						.children.length === 0
			);
		} catch (e) {}
	}
	if (!nearbySibling) {
		console.error("unable to add new file; error parsing DOM");
		return;
	}
	const paddingLeft = nearbySibling.querySelector(".tree-leaf-content").style
		.paddingLeft;
	const newFileNode = htmlToElement(`
		<div class="tree-leaf new">
			<div class="tree-leaf-content" style="padding-left: ${paddingLeft};">
				<div class="tree-leaf-text icon-default">
					<input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
				</div>
			</div>
		</div>
		`);
	const fileNameInput = newFileNode.querySelector("input");
	const finishInput = (event) => {
		if (event.key && event.key !== "Enter") {
			return;
		}
		const filename = fileNameInput.value;

		fileNameInput.removeEventListener("blur", finishInput);
		fileNameInput.removeEventListener("keyup", finishInput);
		if (!filename) {
			return;
		}

		newFileNode.classList.add("creating");
		fileNameInput.disabled = true;
		onDone(filename, parent);
	};
	fileNameInput.addEventListener("blur", finishInput);
	fileNameInput.addEventListener("keyup", finishInput);

	//TODO: focus input, when input loses focus create real file
	//TODO: when ENTER is pressed, create real file (or add a cool error box)
	nearbySibling.parentNode.insertBefore(newFileNode, nearbySibling);
	fileNameInput.focus();
}
window.newFile = newFile; //TODO: kill this some day

function newFolder({ parent, onDone }) {
	if (!onDone) {
		return console.error("newFolder requires an onDone event handler");
	}
	const parentDOM = treeDomNodeFromPath(parent);
	const expando = parentDOM.querySelector(".tree-expando");
	expando.classList.remove("closed");
	expando.classList.add("expanded", "open");
	const childLeaves = parentDOM.parentNode.querySelector(".tree-child-leaves");
	childLeaves.classList.remove("hidden");
	const nearbySibling = childLeaves.querySelector(".tree-leaf");
	const paddingLeft = nearbySibling.querySelector(".tree-leaf-content").style
		.paddingLeft;
	const newFolderNode = htmlToElement(`
		<div class="tree-leaf new">
			<div class="tree-leaf-content" style="padding-left: ${paddingLeft};">
				<div class="tree-leaf-text icon-default">
					<input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
				</div>
			</div>
		</div>
	`);
	const folderNameInput = newFolderNode.querySelector("input");
	const finishInput = (event) => {
		if (event.key && event.key !== "Enter") {
			return;
		}
		const foldername = folderNameInput.value;

		folderNameInput.removeEventListener("blur", finishInput);
		folderNameInput.removeEventListener("keyup", finishInput);
		newFolderNode.parentNode.removeChild(newFolderNode);

		if (!foldername) {
			return;
		}
		onDone(foldername, parent);
	};
	folderNameInput.addEventListener("blur", finishInput);
	folderNameInput.addEventListener("keyup", finishInput);

	//TODO: focus input, when input loses focus create real folder
	//TODO: when ENTER is pressed, create real folder (or add a cool error box)
	nearbySibling.parentNode.insertBefore(newFolderNode, nearbySibling);
	folderNameInput.focus();
}

function showServiceChooser(treeview) {
	return () => {
		getTreeViewDOM({ showOpenService: true });
	};
}

let projectName;
const updateTreeMenu = ({ title, project }) => {
	const treeMenu = document.querySelector("#explorer #tree-menu");
	const titleEl = treeMenu.querySelector(".title-label h2");
	const explorerActions = document.querySelector(
		"#explorer .actions-container"
	);
	if (title && title.toLowerCase() === "search") {
		explorerActions.style.display = "none";
	} else {
		explorerActions.style.display = "";
	}
	if (title) {
		titleEl.setAttribute("title", title);
		titleEl.innerText = title;
		return;
	}
	titleEl.setAttribute("title", project || projectName || "");
	titleEl.innerText = project || projectName || "";
	if (project) {
		projectName = project;
	}
};

const showSearch = (treeView) => {
	const treeSearch = treeView.parentNode.querySelector(".tree-search");
	const searchInput = document.querySelector(".project-search-input");

	return ({ show, include }) => {
		if (show) {
			treeView.style.visibility = "hidden";
			treeSearch.style.visibility = "visible";
			treeSearch.style.height = "";
			updateTreeMenu({ title: "search" });
			include && searchBox.updateInclude(include);

			setTimeout(() => {
				searchInput.focus();
				searchInput.select();
			}, 1);
		} else {
			treeView.style.visibility = "visible";
			treeSearch.style.visibility = "hidden";
			updateTreeMenu({});
		}
	};
};

function _TreeView(op) {
	if (op === "hide") {
		const prevTreeView = document.querySelector("#tree-view");
		if (prevTreeView) {
			prevTreeView.style.display = "none";
		}
		return;
	}
	//OH WELL?: feels kinda dirty in some senses, very reasonable in others
	//TODO: do this with stylus??
	const treeDepthStyles = (rootId, depth, ems) => new Array(depth).fill()
		.reduce((all, one, i) => [
			all,
			`/* NESTING LEVEL ${i+1} */\n`,
			`#${rootId}>.tree-leaf>.tree-child-leaves`,
			...new Array(i).fill('>.tree-leaf>.tree-child-leaves'),
			">.tree-leaf>.tree-leaf-content\n",
			`{ padding-left:${(i+2)*ems}em; }\n\n`
		].join(''), `
			#${rootId}>.tree-leaf>.tree-leaf-content { padding-left:${ems}em; }
		`);

	treeView = getTreeViewDOM();
	treeView.style.display = "";
	const treeViewStyle = htmlToElement(`
		<style>
			#tree-view {
				padding-top: 0.1em;
			}

			/* tree view dimming*/
			/*
			#tree-view {
				opacity: .7;
				transition: opacity 25s;
				padding-top: 0.1em;
			}
			#tree-view:hover, #tree-view.nothing-open {
				opacity: 1;
				transition: opacity 0.3s;
			}
			*/

			#tree-view .tree-expando:not(.hidden) + .tree-leaf-text:before {
				font-family: codicon;
				content: "\\eab4";
				font-size: 1.1em;
				margin-right: 0.4em;
				margin-left: 0;
				transform: rotate(0deg);
			}
			#tree-view .tree-expando:not(.expanded, .hidden) + .tree-leaf-text:before {
				transform: rotate(-90deg);
			}
			#tree-view .tree-leaf.file div[class*='icon-'] {
				margin-left: -0.3em;
			}
			#tree-view.dragover .tree-leaf,
			.tree-leaf.folder.dragover {
				background: #4d5254;
			}
			.tree-leaf {
				user-select: none;
			}
			.tree-leaf.hidden-leaf {
				display: none;
			}
			${treeDepthStyles("tree-view", 20, 0.9)}
		</style>
	`);
	treeView.parentNode.append(treeViewStyle);

	const newTree = ({ service, treeState }) => {
		_service = service ? service.name : '';
		const treeRootId = "tree-view";
		// TODO: clear old tree if exists?
		const extensionMapper = (extension) => {
			const override = {
				md: "info",
			};
			const _ext = extension.toLowerCase();
			return "icon-" + (override[_ext] || ext[_ext] || "default");
		};
		tree = new TreeView(service, treeRootId, treeState, extensionMapper);
		const memoryHandler = (action) => treeMemory(service, tree, action);
		tree.on('expand', memoryHandler('expand'));
		tree.on('collapse', memoryHandler('collapse'));
		tree.on('select', memoryHandler('select'));
		Object.entries(triggers)
			.forEach( ([event, handler]) => tree.on(event, handler) )
		updateTreeMenu({ project: service.name });
	};

	const Update = {
		updateTree: updateTree(treeView),
		newTree,
		treeView,
	};

	const treeMethods = [
		'Add', 'Delete', 'Select', 'Move', 'Rename', 'Context', 'Change', 'ClearChanged'
	].reduce((all, one) => {
			all['tree'+one] = (...args) => {
				try {
					if(!tree) return; //should keep track of this instead of blindly returning
					if(one === 'Add' && typeof args[2] === 'undefined'){
						return tree.add(args[0], null, tree.currentFolder || '');
					}
					if(one === 'ClearChanged'){
						return tree.clearChanged();
					}
					return tree[one.toLowerCase()](...args);
				} catch(e){
					console.warn(e);
				}
			}
			return all;
	}, {});

	attachListener(Update, {
		...treeMethods,
		newFile: ({ parent }) => tree.add('file', null, parent),
		newFolder: ({ parent }) => tree.add('folder', null, parent),
		showSearch: showSearch(treeView),
		updateTreeMenu,
		showServiceChooser: showServiceChooser(treeView),
	});


	// these get attached each newly created tree module
	triggers = [
		'fileSelect',
		'fileAdd',
		'fileRename',
		'fileMove',
		'fileDelete',

		'folderSelect',
		'folderAdd',
		'folderRename',
		'folderMove',
		'folderDelete'
	].reduce((all, operation) => {
		const handler = connectTrigger({
			eventName: operation.includes('Select')
				? operation
				: 'operations',
			type: "raw",
		});
		const operationAdapt = {
			fileAdd: 'addFile',
			fileDelete: 'deleteFile',
			fileRename: 'renameFile',
			fileMove: 'moveFile',

			folderAdd: 'addFolder',
			folderDelete: 'deleteFolder',
			folderRename: 'renameFolder',
			folderMove: 'moveFolder',
		};
		const treeEventHandler = (args) => {
			const { source, target, line, column } = args;
			const name = (target || source).split('/').pop();
			const parent = (target || source).split('/').slice(0,-1).join('/');
			const handlerMessage = {
				detail: {
					name,
					oldName: source,
					newName: target,
					src: source,
					tgt: target,
					parent,
					operation: operationAdapt[operation] || operation,
					filename: name,
					folderName: name,
					line, column,
					body: {},
					service: _service || '',
				}
			};
			return handler(handlerMessage);
		};

		all[operation] = treeEventHandler;
		return all;
	}, {});
}

export default _TreeView;

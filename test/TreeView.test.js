//show-preview
import { prism, importCSS, consoleHelper, htmlToElement, fetchJSON } from '../.welcome/.tools/misc.mjs'
import '../.welcome/shared.styl';
consoleHelper();

import ext from "/shared/icons/seti/ext.json.mjs";
import '/shared/css/seti-icons.css';

import ServiceTree from '../shared/modules/TreeView.mjs';
import './TreeView.test.styl';

/*
	https://stackoverflow.com/questions/5894879/calculate-minimal-operations-to-make-two-tree-structures-identical
*/

const checklistItems = () => { return `

	# prima
	- integrate with app
		- A (Added)
		- M (Modified)
		- D (Deleted)
		- U (Untracked)
		- C (Conflict)
		- R (Renamed)
		- or maybe just changed/new
	- keep duplicate files/folders from happening
	- ? creating folder at root fails to attach expand/collapse handler

	# proxima
	- remove tree-leaf-content dataset
	- scroll into view when an out-of-view file is selected [PORT]
	- cut (move w/o target) and paste (move w/o source)
	- DnD: should not be able to drag parent into itself
	- DnD: weird issue where unhovered drop targets flash on/off quickly

	# postera
	- DnD: if hovered over folder, should expand
	- DnD: change dragging icon to something different
	- drag file out of tree into another view
	- mult-select with all associated ops [EPIC]

	# plena
	- [X] open tree when adding file/folder
	- [X] right-click/context menu handler
	- [X] tree.context fires when node is right-clicked, provides context
	- [X] DnD: if dragged is already in target, don't highlght
	- [X] DnD: fix issues related to path not changing
	- [X] expand folders that contain selected file after move/rename
	- [X] update folder children when CRUD'ing folder
	- [X] crud ops NOTIFY outside
	- [X] add classes to files depending on type
	- [X] rename item element
	- [X] add file element
	- [X] add folder element
	- [X] rename file/folder should update leaf path
	- [X] rename file/folder should update position in tree
	- [X] drag and drop files and folders to move them
	- [X] recall tree state on project reload
	- [X] RENAME a FILE from outside by path
	- [X] MOVE a FILE from outside by path
	- [X] ADD a FILE from outside by path
	- [X] DELETE a FILE from outside by path
	- [X] RENAME a FOLDER from outside by path
	- [X] MOVE a FOLDER from outside by path
	- [X] DELETE a FOLDER from outside by path
	- [X] ADD a FOLDER from outside by path
	- [X] collapsed parent with uncollapsed descendant
	- [X] SELECT a FILE from outside by path, eg. via tab selection
	- [X] open parent folders when child selected
	- [X] context tree clicks, esp. right clicks, ie. path info
	- [X] open and close all branches
	- [X] map between UI trees and saved trees (difference?)
	- [X] does not confuse files with same names in different dirs
	- [X] properly sort files and folders
	- [X] js-treeview muddies dom w/ item metadata, sucks
		- [X] use shadow dom? like es6tree?
		- [X] TreeMap proxy allows clean-up via toJSON prop
	- [X] minimize need for external CSS, like es6tree?
	- [X] should be very responsive
`.trim().replace(/\t/gm, '');
};

// USAGE OF MODULE
(async () => {
	const { result: allServices } = await fetchJSON('/service/read');
	const svcId = allServices
		.find(x => x.name === 'crosshj/fiug-beta')
		.id;

	const { result: [service] } = await fetchJSON(`/service/read/${svcId}`);

	const treeState = {
		expand: [
			'.welcome/.tools',
			'.welcome/frontend/react',
			'.welcome/examples',
			'.welcome/examples/binary'
		],
		select: '.welcome/examples/binary/audio.mp3',
		changed: [
			'.welcome/examples/binary/video.mp4'
		],
		new: [
			'.welcome/1ncubate/auth0.md'
		]
	};

	const extensionMapper = (extension) => {
		const override = { md: 'info' };
		return 'icon-' + (override[extension] || ext[extension] || 'default');
	};

	const treeRoot = htmlToElement(`<div id="tree-root"></div>`);
	document.body.append(treeRoot);
	const tree = new ServiceTree(service, 'tree-root', treeState, extensionMapper);

	//OH WELL?: feels kinda dirty in some senses, very reasonable in others
	//TODO: do this with stylus??
	const treeDepthStyles = (max) => new Array(max).fill()
		.reduce((all, one, i) => [
			all,
			`/* NESTING LEVEL ${i+1} */\n`,
			'#tree-root>.tree-leaf>.tree-child-leaves',
			...new Array(i).fill('>.tree-leaf>.tree-child-leaves'),
			">.tree-leaf>.tree-leaf-content\n",
			`{ padding-left:${(i+1)*0.7}em; }\n\n`
		].join(''), '\n');

	const treeRootDom = htmlToElement(`
		<div id="test-container">
			<style>${treeDepthStyles(20)}</style>
			<div id="tree-container">
				<div id="tree-controls">
					<button class="control collapse-all">Min</button>
					<button class="control expand-all">Max</button>
					<button class="control add-file">+File</button>
					<button class="control add-folder">+Fold</button>
					<button class="control rename-file">RNFile</button>
					<button class="control rename-folder">RNFold</button>
				</div>
			</div>
			<div id="tests">
				<div class="select">
					<button>select</button>
					<input type="text" value="4rchive/search.js"/>
				</div>
				<div class="current-file">${tree.currentFile}</div>
				<div class="rename-file">
					<button>rename</button>
					<input type="text" value="renamedFile.jpg"/>
				</div>
				<div class="move-file">
					<button>move</button>
					<input type="text" value="examples/data"/>
				</div>
				<div class="delete-file"><button>delete</button></div>

				<div class="current-folder">${tree.currentFolder}</div>
				<div class="rename-folder">
					<button>rename</button>
					<input type="text" value="renamedFolder"/>
				</div>
				<div class="move-folder">
					<button>move</button>
					<input type="text" value="examples/data"/>
				</div>
				<div class="delete-folder"><button>delete</button></div>
				<div class="add-file-in-folder">
					<button>add file</button>
					<input type="text" value="addedFile.jpg"/>
				</div>
				<div class="add-folder-in-folder">
					<button>add folder</button>
					<input type="text" value="addedFolder"/>
				</div>
				<div class="last-op">
					<div>History:</div>
					<div class="list"></div>
				</div>
				<div class="checklist">
					<div>TODO:</div>
					<div class="list"></div>
				</div>
			</div>
		</div>
	`);
	const treeContainer = treeRootDom.querySelector("#tree-container");
	const treeControls = treeRootDom.querySelector("#tree-controls");
	const tests = treeRootDom.querySelector("#tests");
	const updateTest = (which, text) => tests.querySelector('.'+which).textContent = text;

	treeContainer.append(treeRoot);
	document.body.append(treeRootDom);

	// "internal controls"
	Object.entries({
		'.expand-all': () => tree.expandAll(),
		'.collapse-all':() => tree.collapseAll(),
		'.add-file': () => tree.add('file', undefined, tree.currentFolder),
		'.add-folder': () => tree.add('folder', undefined, tree.currentFolder),
		'.rename-file': () => tree.rename(tree.currentFile),
		'.rename-folder': () => tree.rename(tree.currentFolder)
	}).forEach(([k,v]) => {
		//TODO: should also create the div here
		treeControls.querySelector(k).addEventListener('click', v);
	})
	
	Object.entries({
		'.select': (i) => tree.select(i),
		'.rename-file': (i) => tree.rename(tree.currentFile, i),
		'.move-file': (i) => tree.move(tree.currentFile, i),
		'.delete-file': (i) => tree.delete(tree.currentFile),
		'.rename-folder': (i) => tree.rename(tree.currentFolder, i),
		'.move-folder': (i) => tree.move(tree.currentFolder, i),
		'.delete-folder': (i) => tree.delete(tree.currentFolder),
		'.add-file-in-folder': (i) => tree.add('file', i, tree.currentFolder),
		'.add-folder-in-folder': (i) => tree.add('folder', i, tree.currentFolder)
	}).forEach(([k,v]) => {
		//TODO: should also create the div here
		const button = tests.querySelector(k +  ' button');
		const input = tests.querySelector(k +  ' input');
		const handler = () => v(input && input.value);
		button.onclick = handler;
		if(!input) return;
		input.addEventListener('keydown', (e) => {
			const ENTER_KEY_CODE = 13;
			if(e.keyCode === ENTER_KEY_CODE) { v(input.value); }
		}, false);
		input.setAttribute('autocomplete', "off");
		input.setAttribute('autocorrect', "off");
		input.setAttribute('autocapitalize', "off");
		input.setAttribute('spellcheck', "false");
	})

	tree.on('select', () => {
		updateTest('current-file', tree.currentFile);
		updateTest('current-folder', tree.currentFolder);
	});

	Object.entries({
		fileSelect: '',
		fileAdd: '',
		fileRename: '',
		fileMove: '',
		fileDelete: '',

		folderSelect: '',
		folderAdd: '',
		folderRename: '',
		folderMove: '',
		folderDelete: '',
	}).forEach(([k, v]) => {
		const historyDiv = document.querySelector('.last-op .list');
		tree.on(k, (args) => {
			updateTest('current-file', tree.currentFile);
			updateTest('current-folder', tree.currentFolder);
			
			const summary = `${k}: ${args}`;
			historyDiv.innerHTML += `
				<div>
					<div>${new Date().toLocaleTimeString('AZ')}</div>
					<div>${k}</div>
					<div>${args.source || ''}</div>
					<div>${args.target || ''}</div>
				</div>
			`;
		});
	})

	tests.querySelector('.checklist .list').innerHTML += checklistItems()
		.split('\n')
		.filter(x=>!!(x.trim()))
		.map(x => {
			if(x.toLowerCase().includes('[x]')){
				x = x.split(/\[X\]/i)[1];
				return {
					checked: true,
					value: x,
					type: 'item'
				}
			}
			return {
				value: x.split(/-\s|#/i)[1],
				type: x.includes('- ') ? 'item' : 'header'
			};
		})
		.sort((a,b) => (a.checked && b.checked) || (!a.checked && !b.checked)
			? 0
			: a.checked && !b.checked ? 1 : -1
		)
		.map((x, i) => {
				if(x.type === 'item') return `
					<div ${x.checked ? 'disabled' : ''}>
						<input type="checkbox" name="checkbox-${i}" ${x.checked ? 'checked' : ''} />
						<label for="checkbox-${i}">${x.value}</label>
					</div>
				`;
				if(x.type === 'header') return `
					<h4 style="margin-bottom:.5em;opacity: .4;border-bottom: 1px dashed;">${x.value}</h4>
				`;
				return x.value;
		})
		.join('\n');
	
	window.tree = tree;
})();


//show-preview

import ServiceTree from './ServiceTree.mjs';

import { prism, importCSS, consoleHelper, htmlToElement } from '../.tools/misc.mjs'
import '../shared.styl';
consoleHelper();

/*
	https://stackoverflow.com/questions/5894879/calculate-minimal-operations-to-make-two-tree-structures-identical
*/

const checklistItems = () => { return `
	- update folder children when CRUD'ing folder
	- inside versions of CRUD ops
	- NOTIFY for CRUD ops and expand/collapse as needed

	- drag file out of tree into another view
	- scroll into view when an out-of-view file is selected
	- cut (move w/o target) and paste (move w/o source)
	- insert new files and folders in the right place

	- add classes to files depending on type

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
	- [X] collapse a parent without closing child branches (+programmatically)
	- [X] SELECT a FILE from outside by path, eg. via tab selection
	- [X] open parent folders when child file selected from outside
	- [X] provide context to file clicks and especially right clicks, ie. path info
	- [X] open and close all branches
	- [X] translate between UI trees and saved trees (and decide the diff)
	- [X] does not confuse files with same names in different dirs
	- [X] properly sort files and folders
	- [X] I don't really like the way that js-treeview dumps items into the dom
		- [X] maybe would prefer the way that es6tree uses shadow dom?
		- [X] but I could live with it since toJSON proxy let me clean that up
	- [X] I don't really like that css has to be included - mimic es6tree?
	- [X] should be very responsive
`.trim().replace(/\t/gm, '');
};

// USAGE OF MODULE
(async () => {
	const { result: allServices } = await(await fetch('/service/read')).json();
	const thisServiceId = allServices.find(x => x.name === '.welcome').id;

	const { result: [service] } = await(await fetch(`/service/read/${thisServiceId}`)).json();

	const treeState = {
		expand: [
			'.tools',
			'frontend/react',
			'examples',
			'examples/binary'
		],
		select: 'examples/binary/audio.mp3' //TODO: js-treeview does not support creating dom with this
	};

	const treeRoot = htmlToElement(`<div id="tree-root"></div>`);
	document.body.append(treeRoot);
	const tree = new ServiceTree(service, 'tree-root', treeState);

	//OH WELL?: feels kinda dirty in some senses, very reasonable in others
	const treeDepthStyles = (max) => new Array(max).fill()
		.reduce((all, one, i) => [
			all,
			`/* NESTING LEVEL ${i+1} */\n`,
			'#tree-root>.tree-leaf>.tree-child-leaves',
			...new Array(i).fill('>.tree-leaf>.tree-child-leaves'),
			">.tree-leaf>.tree-leaf-content\n",
			`{ padding-left:${i+1}em; }\n\n`
		].join(''), '\n');

	const treeStyle = () => {
		return `
			body { margin-bottom: 0; }
			div#test-container {
				width: 100%;
				display: flex;
			}
			div#tests {
				flex: 1;
				background: hsl(177deg 11% 13%);
				padding: 0.5em 1em;
				display: flex;
				flex-direction: column;
				height: calc(100vh - 3em);
				box-sizing: border-box;
			}
			div#tests > * { box-sizing: border-box; }
			#tests h4 { margin-top: 1em; }
			#tests > div { margin-bottom: 1em; display: flex; }
			#tests > div:before {
				font-variant: all-petite-caps;
				opacity: .5;
				min-width: 8.5em;
				display: inline-block;
			}
			#tests > div input[type="text"] {
				background: #6663; border: 0; color: white;
				flex: 1;
			}
			#tests > div input[type="checkbox"] {
				filter: invert(1) saturate(0);
				mix-blend-mode: screen;
				width: 1.1em;
				height: 1.1em;
				text-align: center;
			}
			#tests > div [disabled] { opacity: 0.6; }
			#tests > div button {
				min-width: 9em; margin-bottom: 0; height: 100%;
				margin-right: 1em; padding: 3px 10px; border: 0px;
				background: #7771
			}
			#tests > div button:hover { background: #9995 }
			#tests .current-file:before { content: 'Current File: '; }
			#tests .current-folder:before { content: 'Current Folder: '; }
			#tests .checklist { flex-direction: column; overflow-y: auto; }


			.tree-leaf{position:relative}
			.tree-leaf .tree-child-leaves{display:block;}
			.tree-leaf .hidden{display:none;visibility:hidden}
			.tree-leaf .tree-expando{background:#333;border-radius:3px;cursor:pointer;height:10px;line-height:10px;position:relative;text-align:center;top:5px;width:10px}
			.tree-leaf .tree-expando:hover{background:#aaa}
			.tree-leaf .tree-leaf-content:after,.tree-leaf .tree-leaf-content:before{content:" ";display:table}

			.tree-leaf-content.selected {
				background: #88888842;
			}
			.tree-leaf {
				min-width: 200px;
				user-select: none;
			}
			.tree-leaf .tree-leaf-text {
				cursor: pointer;
				margin-left: 5px;
				flex: 1;
			}
			.tree-leaf-content { display: flex; }
			.tree-leaf-content:hover {
				background-color: #88888813;
			}

			#tree-root.dragover .tree-leaf,
			.tree-leaf.folder.dragover {
				background: #232323;
			}

			#tree-container {
				height: calc(100vh - 3em);
				display: flex;
				flex-direction: column;
				background: #172030;
			}
			#tree-controls { background: #202717; margin-bottom: 1em; }
			#tree-controls button { margin-bottom: 0; min-width: unset; }
			#tree-root {
				background: #171717;
				flex: 1;
				overflow-y: auto;
				padding: 0;
				padding-bottom: 5em;
			}


		`.replace(/^\t\t\t/gm, '');
	};

	const treeRootDom = htmlToElement(`
		<div id="test-container">
			<div id="tree-container">
				<style>${treeStyle()}</style>
				<style>${treeDepthStyles(20)}</style>

				<div id="tree-controls">
					<button class="control collapse-all">Collapse All</button>
					<button class="control expand-all">Expand All</button>
					<button class="control add-file">Add File</button>
					<button class="control add-folder">Add Folder</button>
				</div>
			</div>
			<div id="tests">
				<div class="current-file">${tree.currentFile}</div>
				<div class="rename-file">
					<button>rename</button>
					<input type="text" autocomplete="nope" value="renamedFile.jpg"/>
				</div>
				<div class="move-file">
					<button>move</button>
					<input type="text" autocomplete="nope" value="examples/data"/>
				</div>
				<div class="delete-file"><button>delete</button></div>

				<div class="current-folder">${tree.currentFolder}</div>
				<div class="rename-folder">
					<button>rename</button>
					<input type="text" autocomplete="nope" value="renamedFolder"/>
				</div>
				<div class="move-folder">
					<button>move</button>
					<input type="text" autocomplete="nope" value="examples/data"/>
				</div>
				<div class="delete-folder"><button>delete</button></div>
				<div class="add-file-in-folder">
					<button>add file</button>
					<input type="text" autocomplete="nope" value="addedFile.jpg"/>
				</div>
				<div class="add-folder-in-folder">
					<button>add folder</button>
					<input type="text" autocomplete="nope" value="addedFolder"/>
				</div>
				<div class="checklist">
					<h4>Requirements:</h4>
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

	treeControls.querySelector('.expand-all').addEventListener('click', () => tree.expandAll());
	treeControls.querySelector('.collapse-all').addEventListener('click', () => tree.collapseAll());
	treeControls.querySelector('.add-folder').addEventListener('click', () => tree.add('folder'));
	treeControls.querySelector('.add-file').addEventListener('click', () => tree.add('file'));

	// file tests
	tests.querySelector('.rename-file button').addEventListener('click', (event) => {
		const newName = event.target.closest('div').querySelector('input').value;
		tree.rename(tree.currentFile, newName);
	});
	tests.querySelector('.move-file button').addEventListener('click', (event) => {
		const targetDir = event.target.closest('div').querySelector('input').value;
		tree.move(tree.currentFile, targetDir);
	});
	tests.querySelector('.delete-file button').addEventListener('click', () => {
		tree.delete(tree.currentFile);
	});

	// folder tests
	tests.querySelector('.rename-folder button').addEventListener('click', (event) => {
		const newName = event.target.closest('div').querySelector('input').value;
		tree.rename(tree.currentFolder, newName);
	});
	tests.querySelector('.move-folder button').addEventListener('click', (event) => {
		const targetDir = event.target.closest('div').querySelector('input').value;
		tree.move(tree.currentFolder, targetDir);
	});
	tests.querySelector('.delete-folder button').addEventListener('click', () => {
		tree.delete(tree.currentFolder);
	});
	tests.querySelector('.add-file-in-folder button').addEventListener('click', (event) => {
		const newName = event.target.closest('div').querySelector('input').value;
		tree.add('file', newName, tree.currentFolder);
	});
	tests.querySelector('.add-folder-in-folder button').addEventListener('click', (event) => {
		const newName = event.target.closest('div').querySelector('input').value;
		tree.add('folder', newName, tree.currentFolder);
	});

	tree.on('select', ({ target }) => {
		updateTest('current-file', tree.currentFile);
		updateTest('current-folder', tree.currentFolder);
	});
	tree.on('expand', ({ target }) => updateTest('current-folder', tree.currentFolder));
	tree.on('collapse', ({ target }) => updateTest('current-folder', tree.currentFolder));

	tests.querySelector('.checklist').innerHTML += '<div style="overflow-y: auto;">' + 
		checklistItems()
			.split('\n')
			.filter(x=>!!(x.trim()))
			.map(x => {
				if(x.toLowerCase().includes('[x]')){
					x = x.split(/\[X\]/i)[1];
					return { checked: true, value: x }
				}
				return { value: x.split(/-\s/i)[1] };
			})
			.sort((a,b) => (a.checked && b.checked) || (!a.checked && !b.checked)
				? 0
				: a.checked && !b.checked ? 1 : -1
			)
			.map((x, i) => `
				<div ${x.checked ? 'disabled' : ''}>
					<input type="checkbox" name="checkbox-${i}" ${x.checked ? 'checked' : ''} />
					<label for="checkbox-${i}">${x.value}</label>
				</div>
			`)
			.join('\n') +
		'</div>';
	
	window.tree = tree;
})();

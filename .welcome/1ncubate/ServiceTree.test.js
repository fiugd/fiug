//show-preview
import { prism, importCSS, consoleHelper, htmlToElement } from '../.tools/misc.mjs'
import '../shared.styl';
consoleHelper();

import ServiceTree from './ServiceTree.mjs';
import './ServiceTree.styl';

/*
	https://stackoverflow.com/questions/5894879/calculate-minimal-operations-to-make-two-tree-structures-identical
*/

/*
<style>
	.tree-leaf.folder > .tree-child-leaves {
		//hidden
	}
	.tree-leaf.folder.expanded > .tree-child-leaves {
		//not hidden
	}

	.tree-leaf.file > .tree-leaf-content > .tree-expando {
		//hidden
	}
	.tree-leaf.folder > .tree-leaf-content > .tree-expando {
		//right arrow
	}
	.tree-leaf.folder.expanded > .tree-leaf-content > .tree-expando {
		//down arrow
	}
</style>

<div class="tree-leaf folder expanded" path="examples" draggable="true">
	<div class="tree-leaf-content">
		<div class="tree-expando"></div>
		<div class="tree-leaf-text">examples</div>
	</div>
	<div class="tree-child-leaves">
		<div class="tree-leaf folder" path="examples/folder" draggable="true">
			...
		</div>
		<div class="tree-leaf file" path="examples/file.jpg" draggable="true">
			<div class="tree-leaf-content">
				<div class="tree-expando"></div>
				<div class="tree-leaf-text">file.jpg</div>
			</div>
		</div>
	</div>
</div>

how to get to this:
	- path needs to be added to all tree leaves (at start and on changes)
	- class 'expanded' needs to be added/removed on tree open/close
	- probably have to live with tree-leaf-content data-item, but delete and see what happens
	- don't respect .tree-child-leaves.hidden, probably have to live with it existing, though
	- [X] expando needs to be hidden completely and some other style used for that icon
	- [X] probably have to live with expando classes changing/adding/being
*/

const checklistItems = () => { return `
	
	# prima
	- rename item element
	- update folder children when CRUD'ing folder
	- crud ops NOTIFY outside

	# proxima
	- add classes to files depending on type
	- keep duplicate files/folders from happening
	- DnD: if hovered over folder, should expand
	- DnD:  if dragged is already in target, don't highlght
	- don't select (but expand folder?) after move

	# postera
	- tree-leaf-content dataset -> tree-leaf props
	- scroll into view when an out-of-view file is selected [PORT]
	- drag file out of tree into another view
	- cut (move w/o target) and paste (move w/o source)
	- mult-select with all associated ops [EPIC]

	# plena
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
		treeControls.querySelector(k).addEventListener('click', v);
	})

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

	tests.querySelector('.checklist').innerHTML += '<div style="overflow-y: auto; border-top:1px solid; border-bottom:1px solid; border-color: #0e1110; margin-top:1em; padding-bottom: 2em;">' + 
		checklistItems()
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
			.join('\n') +
		'</div>';
	
	window.tree = tree;
})();

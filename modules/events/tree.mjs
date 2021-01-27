import { attach, attachTrigger } from '../Listeners.mjs';
import { getDefaultFile, getState } from '../state.mjs';

import ext from '../../../shared/icons/seti/ext.json.mjs';

let tree;


const sortFn = (a, b) => {
	const afilename = a.name.toLowerCase().split('.').slice(0,-1).join('.') || a.name.toLowerCase();
	const bfilename = b.name.toLowerCase().split('.').slice(0,-1).join('.') || b.name.toLowerCase();
	if(afilename < bfilename) { return -1; }
	if(afilename > bfilename) { return 1; }
	const aExt = a.name.toLowerCase().replace(afilename, '');
	const bExt = b.name.toLowerCase().replace(bfilename, '');
	if(aExt < bExt) { return -1; }
	if(aExt > bExt) { return 1; }
	return 0;
};

const flatten = (obj) => {
	const array = Array.isArray(obj) ? obj : [obj];
	return array.reduce((acc, value) => {
		acc.push(value);
		if (value.children) {
			acc = [ ...acc, ...flatten(value.children) ];
			//delete value.children;
		}
		return acc;
	}, []);
};

const getTree = (result) => {
	let resultTree = {
		"index.js": {}
	};

	if(result && result[0] && result[0].tree){
		return result[0].tree;
	}

	const name = ((result||[])[0]||{}).name || 'no service name';

	try {
		resultTree = { [name]: resultTree };
		resultTree[name] = JSON.parse(result[0].tree);
	} catch(e){
		console.log('error parsing file tree');
	}

	return resultTree;
};

const fileTreeConvert = (input, converted=[]) => {
	const keys = Object.keys(input);
	keys.forEach(k => {
		converted.push({
			name: k,
			children: fileTreeConvert(input[k])
		})
	});
	return converted.sort(sortFn);
};

function getFileType(fileName=''){
	let type = 'default';
	const extension = ((
			fileName.match(/\.[0-9a-z]+$/i) || []
		)[0] ||''
	).replace(/^\./, '');

	//console.log(extension)
	if(ext[extension]){
		type=ext[extension];
	}
	if(extension === 'md'){
		type = 'info';
	}
	return type;
}

const fileSelectHandler = (e) => {
	const { name, next } = e.detail;

	Array.from(
		document.querySelectorAll('#tree-view .selected')||[]
	)
		.forEach(x => x.classList.remove('selected'));
	tree && (tree.selected = undefined);

	if(e.type === "fileClose" && !next){
		tree && (tree.selected = 'noneSelected');
		return;
	}

	const leaves = Array.from(
		document.querySelectorAll('#tree-view .tree-leaf-content')||[]
	);
	const found = leaves.find(x => {
		return x.innerText.includes(next || name);
	});
	if(found){
		tree.selected = name || next;
		found.classList.add('selected');

		//also open all parent folders
		let parentNode = found.parentNode;
		while(parentNode.id ? parentNode.id !== "tree-view" : true){
			if(parentNode.classList.contains('tree-child-leaves')){
				parentNode.classList.remove('hidden');
			}
			parentNode = parentNode.parentNode;
		}
		if(found.scrollIntoViewIfNeeded){
			const opt_center = true;
			found.scrollIntoViewIfNeeded(opt_center)
		} else {
			found.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		}

	}

}

const folderSelectHandler = (e) => {
	let { name, next, collapse } = e.detail;

	if(collapse){
		return;
	}

	let split;

	if((name || next).includes('/')){
		console.log(`tree path: ${name || next}`)
		console.error('should be opening all parent folders');
		split = (name||next).split('/').filter(x => !!x);
		//name = split[split.length-1];
	} else {
		split = [name||next]
	}

	// Array.from(
	// 	document.querySelectorAll('#tree-view .selected')||[]
	// )
	// 	.forEach(x => x.classList.remove('selected'));

	const leaves = Array.from(
		document.querySelectorAll('#tree-view .tree-leaf-content')||[]
	);

	split.forEach((spl, i) => {
		const found = leaves.find(x => {
			return x.innerText.includes(spl);
		});
		if(!found){ return; }
		if(i === split.length-1){
				tree.selected = spl;
				//found.classList.add('selected');
		}
		const expando = found.querySelector('.tree-expando');
		expando && expando.classList.remove('closed');
		expando && expando.classList.add('expanded', 'open');
		const childLeaves = found.parentNode.querySelector('.tree-child-leaves');
		childLeaves && childLeaves.classList.remove('hidden');
	});
}

const fileChangeHandler = (updateTree) => (event) => {
	const { name, id, file } = event.detail;
	updateTree('dirty', {name, id, file});
};

const contextMenuHandler = ({ treeView, showMenu }) => (e) => {
	if(!treeView.contains(e.target)){ return true; }
	e.preventDefault();

	const listItems = [{
		name: 'New File'
	}, {
		name: 'New Folder'
	}, 'seperator', {
		name: 'Open in Preview'
	}, {
		name: 'Open in New Window'
	}, {
		name: 'Open in Terminal',
		disabled: true
	}, 'seperator', {
		name: 'Copy',
		disabled: true
	}, {
		name: 'Copy Path'
	}, 'seperator',  {
		name: 'Rename',
		disabled: true
	},{
		name: 'Delete'
	}];
	// ^^^ this list should be built based on what was clicked
	let data;
	try {
		const treeLeafContent = e.target.classList.contains('.tree-leaf-content')
			? e.target
			: e.target.closest('.tree-leaf-content');
		data = {
			name: treeLeafContent.querySelector('.tree-leaf-text').innerText,
			type: treeLeafContent.classList.contains('folder') ? 'folder' : 'file'
		};
	} catch(e) {
		data = {
			name: '', type: 'folder'
		}
	}

	if(!data){
		console.error('some issue finding data for this context click!')
		return;
	}

	// debugger;
	showMenu()({
		x: e.clientX,
		y: e.clientY,
		list: listItems,
		parent: 'TreeView',
		data
	});
	return false;
};

const getParent = (data) => {
	let parent;
	if(data.type === 'folder'){
		try {
			const state = getState({ folderPaths: true, serviceRelative: true });
			parent = state.paths
				.find(x => x.name === data.name)
				.path;
		}catch(e){
			parent="";
		}
	} else {
		try{
			const state = getState({ serviceRelative: true });
			parent = state.paths
				.find(x => x.name === data.name)
				.path
				.split('/').slice(0, -1)
				.join('/');
		} catch(e){}
	}
	return parent;
}

const contextMenuSelectHandler = ({ newFile, newFolder }) => (e) => {
	const { which, parent, data } = (e.detail || {});
	if(parent !== 'TreeView'){
		//console.log('TreeView ignored a context-select event');
		return;
	}
	if(which === 'New File'){
		const parent = getParent(data);
		return newFile({
			parent,
			onDone: (filename, parent) => {
				if(!filename){ return; }

				const storeTree = JSON.parse(sessionStorage.getItem('tree'));
				storeTree.expanded = storeTree.expanded || [];
				const parentName = parent.split('/').pop();
				if(!storeTree.expanded.includes(parentName)){
					storeTree.expanded.push(parentName);
					sessionStorage.setItem('tree', JSON.stringify(storeTree));
				}
				const event = new CustomEvent('operations', {
					bubbles: true,
					detail: {
						operation: 'addFile',
						filename,
						parent,
						body: {} //TODO: sucks that body is needed!!!
					}
				});
				document.body.dispatchEvent(event);
			},
		});
	}

	if(which === "New Folder"){
		const parent = getParent(data);
		return newFolder({
			parent,
			onDone: (folderName, parent) => {
				if(!folderName){ return; }
				const event = new CustomEvent('operations', {
					bubbles: true,
					detail: {
						operation: 'addFolder',
						folderName,
						parent,
						body: {} //TODO: sucks that body is needed!!!
					}
				});
				document.body.dispatchEvent(event);
			},
		});
	}

	if(which === 'Delete'){
		const parent = getParent(data);
		const { name, type } = data;

		if(!["folder", "file"].includes(type)){
			console.error('cannot delete object of unknown type');
			return;
		}
		const detail = { body: {} }; //TODO: sucks that body is needed!!!

		if(type === "folder"){
			detail.operation = 'deleteFolder';
			detail.folderName = name;
			detail.parent = parent
				.replace(new RegExp(`/${data.name}$`, 'g'), '');
		}
		if(type === "file"){
			detail.operation = 'deleteFile';
			detail.filename = name;
			detail.parent = parent;
		}

		const event = new CustomEvent('operations', { bubbles: true, detail });
		document.body.dispatchEvent(event);
		return;
	}

	if(which === "Copy Path"){
		const state = getState();
		const { name } = data;
		let url;
		try{
			url = state.paths
				.find(x => x.name === name)
				.path
				.replace('/welcome/', '/.welcome/')
				.replace(/^\//, './');
		} catch(e){}
		if(!url) {
			console.log('TODO: make Copy Path work with folders!');
			return;
		}
		const path = new URL(url, document.baseURI).href;
		navigator.clipboard.writeText(path)
			.then(x => console.log(`Wrote path to clipboard: ${path}`))
			.catch(e => {
				console.error(`Error writing path to clipboard: ${path}`)
				console.error(e);
			});
	}

	if(which === "Open in New Window"){
		const state = getState();
		const { name } = data;
		let url;
		try{
			url = state.paths
				.find(x => x.name === name)
				.path
				.replace('/welcome/', '/.welcome/')
				.replace(/^\//, './');;
		} catch(e){}
		if(!url) return;
		const path = new URL(url, document.baseURI).href;

		const shouldExclude = [
			'.svg', '.less', '.scss', '.css', '.js', '.json', '.templates'
		].find(x => path.includes(x));
		// this overrides excludes
		const shouldInclude = ['.jsx']
			.find(x => path.includes(x));

		const query = shouldExclude && !shouldInclude
			? '/::preview::/'
			: '/::preview::/';

		window.open(path+query);
	}

	if(which === 'Open in Preview'){
		const { name } = data;
		const event = new CustomEvent('previewSelect', {
			bubbles: true,
			detail: { name }
		});
		document.body.dispatchEvent(event);
	}

};

const searchProject = ({ showSearch, hideSearch }) => {
	//TODO: keep track of search state

	showSearch({ show: !hideSearch });
};


//TODO: code that creates a tree should live in ../TreeView and be passed here!!
// new tree is created when: switch/open project, add file, ...
function attachListener(treeView, JSTreeView, updateTree, {
	newFile, newFolder, showSearch, updateTreeMenu, showServiceChooser
}){
	const listener = async function (e) {
		const { id, result, op } = e.detail;

		let selected, expanded=[];

		if(!id){
			//console.log(`No ID for: ${e.type} - ${op}`);
			return;
		}

		//console.log(e.detail);
		if(e.type === "operationDone" && op ===  "update"){
			//TODO: maybe pay attention to what branches are expanded/selected?
			selected = tree ? tree.selected : undefined;
			expanded = (tree ? tree.expanded : undefined) || expanded;
			//debugger;
			tree && tree.off();
			tree = undefined;
		}

		if(result.length > 1){
			return; // TODO: this is right???
		}
		if(tree && tree.id === id){
			return;
		}
		const currentExplorer = document.querySelector('#explorer');
		const backupStyle = {
			minWidth: currentExplorer.style.minWidth,
			maxWidth: currentExplorer.style.maxWidth,
			width: currentExplorer.style.width,
			clientWidth: currentExplorer.clientWidth
		};
		//currentExplorer.style.width = currentExplorer.clientWidth;
		//currentExplorer.style.minWidth = currentExplorer.clientWidth + 'px';

		const refreshTree = tree && tree.id !== id;
		if(refreshTree){
			tree && tree.off();
			tree = undefined;
		}

		const treeFromStorage = (() => {
			try {
				const storeTree = JSON.parse(sessionStorage.getItem('tree'));
				storeTree.expanded = storeTree.expanded || [];
				let flat = flatten(storeTree.data);
				// make selections
				(flat.find(x => x.name === storeTree.selected) || {}).selected = true;
				// make expansions
				for(var i=0, len=storeTree.expanded.length; i<len; i++){
					const expanded = storeTree.expanded[i];
					(flat.find(x => x.name === expanded) || {}).expanded = true;
				}
				return storeTree;
			} catch(e){
				//debugger
			}
		})();

		let childrenSorted;
		if(!tree || refreshTree || !(treeFromStorage && treeFromStorage.data) ){
			const treeFromResult = getTree(result);
			const converted = fileTreeConvert(treeFromResult);
			//converted[0].expanded = true;

			const projectName = converted[0].name;
			updateTreeMenu({ project: projectName });

			const children = converted[0].children; // don't use "tree trunk" folder

			if(!result[0]){
				return;
			}

			// this sort will only be affective on root level
			const files = children
				.filter(x => result[0].code.find(y => y.name === x.name))
				.sort(sortFn);
			const folders = children
				.filter(x => !result[0].code.find(y => y.name === x.name))
				.sort(sortFn);

			function sortChildren(folder){
				const folders = folder.children
					.filter(x => x.children.length > 0)
					.map(sortChildren)
					.sort(sortFn);
				const files = folder.children
					.filter(x => x.children.length <= 0)
					.sort(sortFn);
				folder.children = [...folders, ...files];
				return folder;
			}
			folders.forEach(sortChildren);

			childrenSorted = [...folders, ...files];
			if(!(treeFromStorage && treeFromStorage.data)){
				sessionStorage.setItem('tree', JSON.stringify({ data: childrenSorted }));
			} else {
				selected = treeFromStorage.selected;
				expanded = treeFromStorage.expanded;
			}
		} else {
			if(result && result[0] && result[0].name){
				updateTreeMenu({ project: result[0].name });
			}
			childrenSorted = treeFromStorage.data;
		}

		const newTree = new JSTreeView(childrenSorted, 'tree-view');

		newTree.id = id;
		newTree.selected = selected;
		newTree.expanded = expanded;
		if(treeFromStorage && treeFromStorage.expanded){
			expanded = [...expanded, ...newTree.expanded ];
			newTree.expanded = [...expanded, ...newTree.expanded ];
		}
		if(treeFromStorage && treeFromStorage.selected){
			selected =  treeFromStorage.selected;
			newTree.selected = treeFromStorage.selected;
		}

		function triggerFolderSelect(e, collapse) {
			const event = new CustomEvent('folderSelect', {
				bubbles: true,
				detail: {
					collapse,
					name: e.target.querySelector('.tree-leaf-text').innerText
				}
			});
			document.body.dispatchEvent(event);
		}

		newTree.on('expand', function(e){
			tree.expanded = tree.expanded || [];
			const folderName = JSON.parse(e.target.dataset.item).name;
			//const folderPath = e.target.dataset.path + folderName;
			tree.expanded.push(folderName);
			const storeTree = JSON.parse(sessionStorage.getItem('tree'));
			storeTree.expanded = storeTree.expanded || [];
			storeTree.expanded.push(folderName);
			//storeTree.selected = folderName;
			sessionStorage.setItem('tree', JSON.stringify(storeTree));
			triggerFolderSelect(e);
		});

		newTree.on('collapse', function(e){
			tree.expanded = tree.expanded || [];
			const folderName = JSON.parse(e.target.dataset.item).name;
			//const folderPath = e.target.dataset.path + folderName;
			tree.expanded = tree.expanded.filter(x => x !== folderName);
			const storeTree = JSON.parse(sessionStorage.getItem('tree'));
			//storeTree.selected = folderName;
			storeTree.expanded = storeTree.expanded || [];
			storeTree.expanded = storeTree.expanded.filter(x => x !== folderName);
			sessionStorage.setItem('tree', JSON.stringify(storeTree));
			const collapse = true;
			triggerFolderSelect(e, collapse);
		});

		newTree.on('select', function (e) {
			const parent = e.target.target.parentNode;
			const isFolder = parent.classList.contains('folder');

			const storeTree = JSON.parse(sessionStorage.getItem('tree'));
			storeTree.selected = e.data.name;
			sessionStorage.setItem('tree', JSON.stringify(storeTree));

			if(isFolder){
				const expando = parent.querySelector('.tree-expando');
				const isOpen = expando.classList.contains('open');
				if(isOpen){
					expando.classList.remove('expanded', 'open');
					expando.classList.add('closed');
				} else {
					expando.classList.remove('closed');
					expando.classList.add('expanded', 'open');
				}
				triggerFolderSelect({ target: parent });
				return;
			}

			//TODO: what is the purpose of this?
			let changed;
			try {
				changed = parent.classList.contains('changed')
			} catch(e){}

			const event = new CustomEvent('fileSelect', {
				bubbles: true,
				detail: {
					name: e.data.name,
					changed
				}
			});
			document.body.dispatchEvent(event);
		});

		const defaultFile = getDefaultFile(result[0]);
		Array.from(treeView.querySelectorAll('.tree-leaf-content'))
			.forEach(t => {
				const item = JSON.parse(t.dataset.item);
				const foundFile = result[0].code.find(x => x.name === item.name);

				//TODO: this is where nested padding should be set

				if(item.children.length || !foundFile){
					t.classList.add('folder');
					t.querySelector('.tree-expando').classList.remove('hidden');
				} else {
					const textNode = t.querySelector('.tree-leaf-text');
					textNode.classList.add(`icon-${getFileType(textNode.innerText)}`);
				}

				if(expanded.includes(item.name)){
					const expando = t.querySelector('.tree-expando');
					expando && expando.classList.remove('closed');
					expando && expando.classList.add('expanded', 'open');

					const childLeaves = t.parentNode.querySelector('.tree-child-leaves');
					childLeaves && childLeaves.classList.remove('hidden');
				}

				if(item.name === defaultFile && !selected){
					t.classList.add('selected');
				}
				if(selected && item.name === selected){
					t.classList.add('selected');
				}
			});
		const rootNode = document.getElementById('tree-view');

		// set path attribute and padding on child nodes
		function traverseTree(node, path){
			const children = Array.from(node.children)
			children.forEach(c => {
				const leafContentNode = c.querySelector('.tree-leaf-content');
				leafContentNode.setAttribute('data-path', path);
				leafContentNode.style.paddingLeft = (path.split('/').length-1)*9 + 'px';

				const leavesNode = c.querySelector('.tree-child-leaves');
				if(!leavesNode){
					return;
				}
				const name = JSON.parse(leafContentNode.dataset.item).name;
				traverseTree(leavesNode, `${path}${name}/`);
			});
		}
		traverseTree(rootNode, '/');

		tree = newTree;
	};

	const saveTree = (fn) => (...args) => {
		const result = fn(...args);
		if(tree){
			try {
				const storeTree = JSON.parse(sessionStorage.getItem('tree'));
				// console.log(JSON.stringify({
				// 	oldSelected: storeTree.selected,
				// 	newSelected: tree.selected
				// }, null, 2));
				// console.log(JSON.stringify({
				// 	oldExpanded: storeTree.expanded,
				// 	newExpanded: tree.expanded
				// }, null, 2));
				storeTree.selected = tree.selected;
				//storeTree.expanded = tree.expanded;
				sessionStorage.setItem('tree', JSON.stringify(storeTree));
			} catch(e){
				debugger;
			}
		}
		return result;
	};

	attach({
		name: 'Explorer',
		eventName: 'noServiceSelected',
		listener: (event) => showServiceChooser()
	});
	// triggered by Hot Key
	attach({
		name: 'Explorer',
		eventName: 'ui',
		listener: (event) => {
			const { detail={} } = event;
			const { operation } = detail;
			if(operation !== "searchProject"){
				return;
			}
			searchProject({ showSearch });
		}
	});
	// triggered by Action Bar
	attach({
		name: 'Explorer',
		eventName: 'showSearch',
		listener: (event) => searchProject({ showSearch, hideSearch: false })
	});

	attach({
		name: 'Explorer',
		eventName: 'showServiceCode',
		listener: (event) => searchProject({ showSearch, hideSearch: true })
	});

	attach({
		name: 'Explorer',
		eventName: 'operationDone',
		listener
	});
	attach({
		name: 'Explorer',
		eventName: 'fileSelect',
		listener: saveTree(fileSelectHandler)
	});
	attach({
		name: 'Explorer',
		eventName: 'folderSelect',
		listener: folderSelectHandler
	});
	attach({
		name: 'Explorer',
		eventName: 'fileClose',
		listener: saveTree(fileSelectHandler)
	});
	attach({
		name: 'Explorer',
		eventName: 'fileChange',
		listener: saveTree(fileChangeHandler(updateTree))
	});
	attach({
		name: 'Explorer',
		eventName: 'contextmenu',
		listener: contextMenuHandler({
			treeView,
			showMenu: () => window.showMenu
		})
	});
	attach({
		name: 'Explorer',
		eventName: 'contextmenu-select',
		listener: contextMenuSelectHandler({ newFile, newFolder })
	});
	attach({
		name: 'Explorer',
		eventName: 'new-file',
		listener: () => console.warn('new-file handler not implemented, use right click menu')
	});
	attach({
		name: 'Explorer',
		eventName: 'new-folder',
		listener: () => console.warn('new-folder handler not implemented, use right click menu')
	});
}

const connectTrigger = (args) => attachTrigger({ ...args, name: 'Explorer' });

export {
	attachListener,
	connectTrigger
};

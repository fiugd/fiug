import TreeView from '/shared/vendor/js-treeview.1.1.5.js';
const tryFn = (fn, _default) => {
	try {
		return fn();
	} catch (e) {
		return _default;
	}
};

function htmlToElement(html) {
	const template = document.createElement('template');
	template.innerHTML = html.trim();
	return template.content.firstChild;
}

class DragAndDrop {
	rootNode;

	constructor({ rootNode, move }){
		this.rootNode = rootNode;

		this.attach = this.attach.bind(this);
		this.update = this.update.bind(this);

		this.handleDragEnter = this.handleDragEnter.bind(this);
		this.handleDragStart = this.handleDragStart.bind(this);
		this.handleDrop = this.handleDrop.bind(this);

		this.move = move;

		this.update();
	}

	handleDragStart(e){
		const leaf = e.target.classList.contains('tree-leaf')
			? e.target
			: e.target.closest('.tree-leaf');
		this.dragged = leaf;
	}
	handleDragEnter(e){
		//TODO: if hovered over folder, should expand
		let leaf = e.target.classList.contains('tree-leaf')
			? e.target
			: e.target.closest('.tree-leaf')
		if(!leaf.classList.contains('folder')){
			leaf = leaf.parentNode.closest('.tree-leaf');
		};
		if(this.draggedOver){
			this.draggedOver.classList.remove('dragover');
		}
		this.draggedOver = leaf;
		leaf.classList.add('dragover');
	}
	handleDrop(e){
		const draggedOverNodes = Array.from(
			document.querySelectorAll('.tree-leaf.dragover')
		);
		draggedOverNodes.forEach((item) => item.classList.remove('dragover'));
		if(this.dragged && this.draggedOver){
			console.log(this.dragged);
			this.move(
				this.dragged.getAttribute('path'),
				this.draggedOver.getAttribute('path')
			)
		}
		e.stopPropagation();
		return false;
	}
	preventDefault(e){
		e.preventDefault && e.preventDefault();
		return false;
	}

	attach(rootNode){
		const allLeaves = Array.from(rootNode.querySelectorAll('.tree-leaf:not([draggable])'));
		allLeaves.forEach(leaf => {
			//TODO: would be better if this were done elsewhere
			const contentNode = leaf.querySelector(':scope > .tree-leaf-content');
			const { type, id:path } = tryFn(() => JSON.parse(contentNode.dataset.item));
			leaf.setAttribute('path', path);
			leaf.classList.add(type);

			leaf.draggable = true;

			if(type !== 'folder') {
				leaf.addEventListener('dragstart', this.handleDragStart, false);
				return;
			}

			leaf.addEventListener('dragstart', this.handleDragStart, false);
			leaf.addEventListener('dragenter', this.handleDragEnter, false);
			leaf.addEventListener('drop', this.handleDrop, false);
			
			leaf.addEventListener('dragover', this.preventDefault, false);
		});
	}
	update(){
		this.attach(this.rootNode);
	}
}

class TreeNode {
	constructor(item){
		const { name, type, id } = item;
		const expandoClass = [
			"tree-expando",
			"closed",
			type === 'folder' ? '' : 'hidden'
		].join(' ');
		const container = htmlToElement(`
			<div class="tree-leaf">
				<div class="tree-leaf-content" data-item='${JSON.stringify(item)}'>
					<div class="${expandoClass}">+</div>
					<div class="tree-leaf-text">${name}</div>
				</div>
				${ type === 'folder'
					? `<div class="tree-child-leaves hidden"></div>`
					: ''
				}
			</div>
		`);

		// TODO: remove this when rewriting underlying js-treeview (use listener at top level)
		Array.from(container.querySelectorAll('.tree-leaf-text, .tree-expando'))
			.forEach(function (node) {
				const hijacked = document.querySelector('.tree-leaf-text').onclick
				node.onclick = hijacked;
			});
		return container;
	}
}

class TreeMapper {
	constructor(service, state){
		this.state = state;
		this.service = service;
		this.get = this.get.bind(this);
		return new Proxy(service.tree[service.name], this);
	}

	mapEntry = (target) => ([k,v]) => {
		const child = {
			name: k,
			id: target.path ? `${target.path}/${k}` : k,
			//TODO: maybe should figure out better way to determine folder vs file
			type: Object.keys(v).length === 0 ? 'file' : 'folder',
			//children: []
		};
		if(child.type === 'folder'){
			const dummyArray = [];
			dummyArray.path = target.path
				? `${target.path}/${k}`
				: k;
			child.expanded = this.state.expand.includes(dummyArray.path);
			child.children = new Proxy(dummyArray, this);
		} else {
			child.selected = this.state.select === child.id;
		}
		return child;
	}

	sort = (a, b) => {
		if(a.type > b.type) return -1;
		if(a.type < b.type) return 1;
		return a.name.toLowerCase() > b.name.toLowerCase()
			? 1
			: -1;
	}

	get(target, prop, receiver) {
		//console.log(prop)
		const realTarget = (target.path||"")
			.split('/')
			.reduce((all, one) => {
				return all[one] || all;
			}, this.service.tree[this.service.name]);
		
		const isNumericProp = !isNaN(prop) && 'number'

		const propertyMapper = {
			length: children => children.length,
			forEach: children => fn => children.forEach(fn),
			children: children => children,
			number: children => children[prop],
			toJSON: children => fn => undefined
		}[isNumericProp || prop];
		
		if(!propertyMapper) {
			debugger;
			//console.error(`Mapper proxy unable to handle prop: ${prop}`);
			return undefined;
		}

		try { 
			const children = Object.entries(realTarget)
				.map(this.mapEntry(target))
				.sort(this.sort);
			return propertyMapper(children);
		} catch (error){
			console.error(error);
		}
	}

}

class ServiceTree {
	mappedTree;
	jstreeview;
	rootNode;

	constructor(service, domRoot, treeState){
		this.mappedTree = new TreeMapper(service, treeState);
		this.jstreeview = new TreeView(this.mappedTree, domRoot);

		const exposedAPI = ['on', 'off', 'collapse', 'collapseAll', 'expand', 'expandAll'];
		for(var i=0, len=exposedAPI.length; i<len; i++){
			const key = exposedAPI[i];
			this[key] = this.jstreeview[key].bind(this.jstreeview);
		}
		this.add = this.add.bind(this);
		this.select = this.select.bind(this);
		this.delete = this.delete.bind(this);
		this.move = this.move.bind(this);
		this.rootNode = document.getElementById(domRoot);
		this.dragAndDrop = new DragAndDrop(this);

		if(treeState.select){
			this.select(treeState.select);
			this.currentFile = treeState.select;
			this.currentFolder = treeState.select.split('/').slice(0,-1).join('/');
		}
		
		this.on('select', ({ target, data }) => {
			this.currentFile = data.id;
			this.currentFolder = data.id.split('/').slice(0,-1).join('/');

			Array.from(this.rootNode.querySelectorAll('.selected'))
					.forEach(s => s.classList.remove('selected'));
			const { target: node } = target;
			const leafContent = node.closest('.tree-leaf-content');
			leafContent.classList.add('selected');
		});
		
		// on expand, currentFolder is expanded folder
		// on collapse, currentFolder is currentFile's parent
	}

	/*
		this is for programmatically selecting a file/folder
	*/
	select(path, skipDomUpdate){
		const splitPath = path.split('/');
		let success = false;
		let currentNode = this.rootNode;
		//TODO: dom traversal sucks, would be better to traverse an internal model?
		for(var i=0, len=splitPath.length; i<len; i++){
			const nodeName = splitPath[i];
			const immediateChildren = currentNode.querySelectorAll(':scope > .tree-leaf');
			const found = Array.from(immediateChildren)
				.find(child => {
					const { item: itemSource } = tryFn(() =>
						child.querySelector(':scope > .tree-leaf-content').dataset
					, {});
					const { name } = tryFn(() => JSON.parse(itemSource), {});
					return name === nodeName;
				});
			if(!found) break;

			const node = found.querySelector(':scope > .tree-leaf-content');
			const leaves = found.querySelector(':scope > .tree-child-leaves');
			if(!skipDomUpdate){
				if(leaves){
					this.expand(node, leaves, 'skipEmit')
				} else {
					Array.from(this.rootNode.querySelectorAll('.selected'))
						.forEach(s => s.classList.remove('selected'));
					node.classList.add('selected');
				}
			}
			currentNode = leaves || found;
		}
		const isFolder = [...currentNode.classList].includes('tree-child-leaves');
		if(isFolder) currentNode = currentNode.closest('.tree-leaf');

		return currentNode;
	}
	
	insertDomNode(leavesNode, domNode){
		//TODO: should insert in the correct position
		//OPTION 1: insert at end then sort
		//OPTION 2: insertBefore or insertAfter correct node
		leavesNode.append(domNode);
	}

	add(type, name, target){
		// trigger a box to come up (in the right place) that allows adding a folder or file
		// when box is entered or dismissed, trigger the add or dismiss
		if(!name || typeof target === 'undefined') return console.error(type + ' add ui: not implemented');

		const id = target
			? target + '/' + name
			: name;
		const domNode = new TreeNode({ name, type, id });
		const targetNode = this.select(target, 'skipDomUpdate');
		const targetChildLeaves = targetNode.querySelector(':scope > .tree-child-leaves');
		this.insertDomNode(targetChildLeaves || targetNode, domNode);

		this.dragAndDrop.update();
		// tell the outside world that this happened
	}

	move(path, target){
		// change the dom
		const domNode = this.select(path, 'skipDomUpdate');
		const treeLeafContent = domNode.querySelector('.tree-leaf-content');

		const children = domNode.querySelector('.tree-child-leaves');
		
		const targetNode = this.select(target, 'skipDomUpdate');
		const targetChildLeaves = targetNode.querySelector(':scope > .tree-child-leaves');
		this.insertDomNode(targetChildLeaves || targetNode, domNode);
		
		const itemData = tryFn(() => JSON.parse(treeLeafContent.dataset.item));
		itemData.id = target.trim()
			? [...target.split('/'), itemData.name].join('/')
			: itemData.name;
		treeLeafContent.dataset.item = JSON.stringify(itemData);

		this.select(itemData.id);



		if(children){
			console.error('TREE MOVE: descendants must have their id(path) updated');
		}
		
		// tell the outside world this happened
	}

	rename(path, newName){
		// trigger a box to come up that allows a rename
		// when box is entered or dismissed, trigger the rename or dismiss

		const domNode = this.select(path, 'skipDomUpdate');
		const treeLeafContent = domNode.querySelector('.tree-leaf-content');
		const treeLeafText = domNode.querySelector('.tree-leaf-text');
		const children = domNode.querySelector(':scope > .tree-child-leaves');

		const itemData = tryFn(() => JSON.parse(treeLeafContent.dataset.item));
		itemData.name = newName;
		itemData.id = [...itemData.id.split('/').slice(0,-1), newName].join('/');
		treeLeafContent.dataset.item = JSON.stringify(itemData);
		treeLeafText.textContent = newName;

		if(children){
			console.error('TREE RENAME: descendants must have their id(path) updated');
		}

		// TODO: tell the outside world that this happened
	}

	delete(path){
		const domNode = this.select(path, 'skipDomUpdate');
		domNode.remove();
		// TODO: tell the outer world that this was deleted
	}

	/*
		rewrite the interface for on select (instead rewrite on?)
			- current returns a target mouse event and data
			- would prefer to return path (and no more/less?)
		select and expand should be the same thing?
	*/
	onSelect(){}
}

export default ServiceTree;

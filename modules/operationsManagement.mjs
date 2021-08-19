const manageOp = {
	operation: "updateProject"
};

const flattenTree = (tree) => {
	const results = [];
	const recurse = (branch, parent='/') => {
		const leaves = Object.keys(branch);
		leaves.map(x => {
			results.push({
				name: x, parent
			})
			recurse(branch[x], x);
		});
	};
	recurse(tree);
	return results;
};

function getContextFromPath(root, folderPath){
	const split = folderPath.split('/').filter(x => !!x);
	const folderName = split.pop();
	const parentObject = split
		.reduce((all, one) => {
			all[one] = all[one] || {};
			return all[one];
		}, root);
	return { folderName, parentObject};
}

function uberManageOp({
	currentFolder="/",
	currentService,
	oldName, newName,
	createNewTree, deleteOldTree,
	createNewFile, deleteOldFile
}){
	let operationComplete;
	try {
		//TODO: guard against empty/improper filename

		//TODO: if path not included or relative to current
		//      add currentFolder to oldName/newName

		const rootFolderName = Object.keys(currentService.tree)[0];
		const root = currentService.tree[rootFolderName];

		let { folderName, parentObject} = getContextFromPath(root, oldName);
		const oldFolderParent = parentObject;
		const oldFolderName = folderName;

		if(createNewTree){
			// this clone causes problems with JSX and HTML files
			// TODO: fix probably deals with < being escaped properly
			const clonedOldFolderContents = JSON.parse(JSON.stringify(
				oldFolderParent[oldFolderName]
			));

			({ folderName, parentObject} = getContextFromPath(root, newName));
			const newFolderParent = parentObject;
			const newFolderName = folderName;

			newFolderParent[newFolderName] = clonedOldFolderContents;
		}

		if(deleteOldTree){
			delete oldFolderParent[oldFolderName];
		}

		if(createNewFile){
			const oldContents = (currentService.code.find(x => x.name === oldFolderName)||{}).code;
			currentService.code.push({
				name: folderName,
				code: oldContents
			});
		}

		if(deleteOldFile){
			currentService.code = currentService.code.filter(x => x.name !== oldFolderName)
		}

		operationComplete = true;
	} catch(e) {

	}
	return operationComplete;
}


function addFile(e, currentService, currentFile) {
	let { filename, parent, listener, untracked } = e.detail;
	let manageOp, currentServiceCode, treeEntryAdded;
	if(parent){
		filename = parent + '/' + filename;
	}

	if(untracked){
		currentServiceCode = JSON.parse(JSON.stringify(currentService.code));
		const currentlyUsedNumbers = currentServiceCode
			.filter(x => x.name.includes('Untitled-'))
			.map(x => Number(x.name.replace('Untitled-','')));
		let foundNumber;
		let potentialNumber=1;
		while(!foundNumber){
			if(currentlyUsedNumbers.includes(potentialNumber)){
				potentialNumber++;
				continue;
			}
			foundNumber = potentialNumber
		}
		const untitledName = `Untitled-${foundNumber}`;
		e.detail.filename = untitledName;
		currentServiceCode.push({
			name: untitledName,
			untracked: true,
			code: ""
		});
		manageOp = {
			operation: "updateProject",
			listener
		};
		currentService.code = currentServiceCode;
		return manageOp;
	}

	try {
		//TODO: guard against empty/improper filename
		const split = filename.split('/').filter(x => !!x);
		const file = split.length > 1 ? split[split.length-1] : undefined;
		const codePath = filename.includes(currentService.name)
			? `/${filename}`
			: `/${currentService.name}/${filename}`;

		currentServiceCode = JSON.parse(JSON.stringify(currentService.code));
		currentServiceCode.push({
			name: file || filename,
			code: codePath,
			path: codePath,
		});

		if(e.detail.untracked){}

		let alreadyPlaced;
		if(file){
			let parentPath = split.filter(x => x !== file ).join('/');
			const rootFolderName = Object.keys(currentService.tree)[0];
			parentPath = parentPath.replace(new RegExp(`^${rootFolderName}/`), '');

			const root = currentService.tree[rootFolderName];
			const { parentObject } = getContextFromPath(root, parentPath);
			const context = parentObject[parentPath.split('/').pop()] || parentObject;
			context[file] = {};
			alreadyPlaced = true;
		}
		!alreadyPlaced && (
			currentService.tree[Object.keys(currentService.tree)[0]][filename] = {}
		);

		treeEntryAdded = true;
		manageOp = {
			operation: "updateProject",
			listener
		};
	}
	catch (e) {
		console.log('could not add file');
		console.log(e);
		return;
	}
	if(manageOp && currentServiceCode && treeEntryAdded){
		currentService.code = currentServiceCode;
	}
	return manageOp;
}

function renameFile(e, currentService, currentFile){
	const { filename, newName } = e.detail;
	let manageOp, currentServiceCode, treeEntryRenamed;

	try {
		//TODO: guard against empty/improper filename, newName
		currentServiceCode = JSON.parse(JSON.stringify(currentService.code));
		const fileToRename = currentServiceCode.find(x => x.name === filename);
		fileToRename.name = newName;

		//TODO: only handles root level files!!!
		const rootLevel = currentService.tree[Object.keys(currentService.tree)[0]];
		delete rootLevel[filename];
		rootLevel[newName] = {};
		treeEntryRenamed = true;
		manageOp = {
			operation: "updateProject"
		};
	}
	catch (e) {
		console.log('could not rename file');
		console.log(e);
	}
	if(manageOp && currentServiceCode && treeEntryRenamed){
		currentService.code = currentServiceCode;
	}
	// console.log(JSON.stringify({ currentService }, null, 2 ));
	// return;
	return manageOp;
}

function deleteFile(e, currentService, currentFile){
	//console.log('deleteFile');
	let { filename, parent, listener } = e.detail;
	let manageOp, currentServiceCode, treeEntryDeleted;
	if(parent){
		filename = parent + '/' + filename;
	}

	try {
		const split = filename.split('/').filter(x => !!x);
		const file = split[split.length-1];

		let alreadyDeleted;
		if(file){
			let parentPath = split.filter(x => x !== file ).join('/');
			const rootFolderName = Object.keys(currentService.tree)[0];
			parentPath = parentPath.replace(new RegExp(`^${rootFolderName}/`), '');

			const root = currentService.tree[rootFolderName];
			const { parentObject } = getContextFromPath(root, parentPath);
			const context = parentObject[parentPath.split('/').pop()] || parentObject;
			delete context[file];
			alreadyDeleted = true;
		}
		!alreadyDeleted && (
			delete currentService.tree[Object.keys(currentService.tree)[0]][filename]
		);
		treeEntryDeleted = true;

		//TODO: guard against empty/improper filename
		currentServiceCode = currentService.code.filter(x => x.name !== (file || filename));

		manageOp = {
			operation: "updateProject",
			listener
		};
	} catch (e) {
		console.log('could not delete file');
		console.log(e);
		return;
	}
	if(manageOp && currentServiceCode && treeEntryDeleted){
		currentService.code = currentServiceCode;
	}
	return manageOp;
}

function moveFile(e, currentService, currentFile){
	//console.log('moveFile');
	const { target, destination } = e.detail;

	//TODO: is either current selected folder or parent of currentFile
	const currentFolder = "/";

	//TODO: may want to keep same target name but move to diff folder

	const fileRenamed = uberManageOp({
		currentFolder,
		currentService,
		oldName: target,
		newName: destination,
		createNewTree: true,
		deleteOldTree: true,
		createNewFile: true,
		deleteOldFile: true
	});

	return fileRenamed
		? manageOp
		: undefined;
	return;
}

function renameProject(e, currentService, currentFile){
	console.log('renameProject');
	return;
}

function addFolder(e, currentService, currentFile){
	//console.log('addFolder');
	let { folderName, parent, listener } = e.detail;
	let manageOp, currentServiceCode, folderAdded;
	if(parent){
		folderName = parent + '/' + folderName;
	}
	try {
		//TODO: guard against empty/improper folder name
		const rootFolderName = Object.keys(currentService.tree)[0];
		folderName	= folderName.replace(new RegExp(`^/${rootFolderName}`), '');
		let parentObject = currentService.tree[rootFolderName];

		if(folderName.includes('/')){
			({ folderName, parentObject} = getContextFromPath(
				parentObject, folderName
			));
		}
		// adding child of .keep make sure this is a folder
		// TODO: remove .keep if adding a child folder or file
		// TODO: add .keep if deleting last child folder or file
		parentObject[folderName] = {
			'.keep': {}
		};
		folderAdded = true;
		manageOp = {
			operation: "updateProject",
			listener
		};
	} catch (e) {
		console.log('could not add folder');
		console.log(e);
		return;
	}
	return manageOp;
}

function renameFolder(e, currentService, currentFile){
	const { oldName, newName } = e.detail;

	//TODO: is either current selected folder or parent of currentFile
	const currentFolder = "/";

	const folderRenamed = uberManageOp({
		currentFolder,
		currentService,
		oldName, newName,
		createNewTree: true,
		deleteOldTree: true,
		createNewFile: false,
		deleteOldFile: false
	});

	return folderRenamed
		? manageOp
		: undefined;
}

function deleteFolder(e, currentService){
	// console.log('deleteFolder');
	let { folderName, parent, listener } = e.detail;
	if(parent){
		folderName = parent + '/' + folderName;
	}

	//TODO: is either current selected folder or parent of currentFile
	const currentFolder = "/";

	// delete all child files
	const rootFolderName = Object.keys(currentService.tree)[0];
	folderName = folderName.replace(new RegExp(`^/${rootFolderName}`), '');
	const root = currentService.tree[rootFolderName];

	const { folderName: folder, parentObject} = getContextFromPath(root, folderName);
	const children = flattenTree(parentObject[folder])
		.map(x => x.name);

	const currentServiceCode = currentService.code
		.filter(c => !children.includes(c.name));
	currentService.code = currentServiceCode;

	const folderdeleted = uberManageOp({
		deleteOldTree: true,
		oldName: folderName,

		currentFolder,
		currentService,
		newName: '',
		createNewTree: false,
		createNewFile: false,
		deleteOldFile: false
	});

	if(manageOp){
		manageOp.listener = listener;
	}
	return folderdeleted
		? manageOp
		: undefined;
}

function moveFolder(e, currentService, currentFile){
	//console.log('moveFolder');
	const { target, destination } = e.detail;

	//TODO: is either current selected folder or parent of currentFile
	const currentFolder = "/";

	//TODO: may want to keep same target name but move to diff folder

	const folderRenamed = uberManageOp({
		currentFolder,
		currentService,
		oldName: target,
		newName: destination,
		createNewTree: true,
		deleteOldTree: true,
		createNewFile: false,
		deleteOldFile: false
	});

	return folderRenamed
		? manageOp
		: undefined;
}

function readFolder(e, currentService, currentFile, currentFolder){
	const rootFolderName = Object.keys(currentService.tree)[0];
	const root = currentService.tree[rootFolderName];
	const { folderName, parentObject } = getContextFromPath(root, currentFolder);
	const context = parentObject[folderName] || parentObject;

	const children = Object.keys(context)
		.map(c => {
			const isFolder = !currentService.code.find(x=>x.name===c);
			return isFolder
				? `...${c}/`
				: c;
		})
		.sort()
		.map(x => x.replace('...', ''));

	return children;
}

const ops = {
	addFile, renameFile, deleteFile, moveFile,
	addFolder, renameFolder, deleteFolder, moveFolder,
	renameProject, readFolder
};
function managementOp(e, currentService, currentFile, currentFolder) {
	const thisOps = Object.keys(ops);
	const { operation="" } = (e && e.detail) || {};

	//console.log({ operation, e });
	if (!thisOps.includes(operation)) {
		return;
	}
	return ops[operation];
}

export {
	managementOp
};
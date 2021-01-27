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
	const { filename } = e.detail;
	let manageOp, currentServiceCode, treeEntryAdded;

	try {
		const split = filename.split('/').filter(x => !!x);
		const file = split.length > 1 ? split[split.length-1] : undefined;

		//TODO: guard against empty/improper filename
		currentServiceCode = JSON.parse(JSON.stringify(currentService.code));
		currentServiceCode.push({
			name: file || filename,
			code: ""
		});

		let alreadyPlaced;
		if(file){
			const parentPath = split.filter(x => x !== file ).join('/');
			const rootFolderName = Object.keys(currentService.tree)[0];
			const root = currentService.tree[rootFolderName];
			const { parentObject } = getContextFromPath(root, parentPath);
			const context = parentObject[parentPath];
			context[file] = {}
			alreadyPlaced = true;
		}
		!alreadyPlaced && (
			currentService.tree[Object.keys(currentService.tree)[0]][filename] = {}
		);

		treeEntryAdded = true;
		manageOp = {
			operation: "updateProject"
		};
	}
	catch (e) {
		console.log('could not add file');
		console.log(e);
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
	const { filename=currentFile } = e.detail;
	let manageOp, currentServiceCode, treeEntryDeleted;


	try {
		const split = filename.split('/').filter(x => !!x);
		const file = split[split.length-1];

		let alreadyDeleted;
		if(file){
			const parentPath = split.filter(x => x !== file ).join('/');
			const rootFolderName = Object.keys(currentService.tree)[0];
			const root = currentService.tree[rootFolderName];
			const { parentObject } = getContextFromPath(root, parentPath);
			delete parentObject[file];
			alreadyDeleted = true;
		}
		!alreadyDeleted && (
			delete currentService.tree[Object.keys(currentService.tree)[0]][filename]
		);
		treeEntryDeleted = true;

		//TODO: guard against empty/improper filename
		currentServiceCode = currentService.code.filter(x => x.name !== (file || filename));

		manageOp = {
			operation: "updateProject"
		};
	} catch (e) {
		console.log('could not delete file');
		console.log(e);
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
	let { folderName, parent } = e.detail;
	let manageOp, currentServiceCode, folderAdded;
	try {
		//TODO: guard against empty/improper filename
		const rootFolderName = Object.keys(currentService.tree)[0];
		let parentObject = currentService.tree[rootFolderName];

		if(folderName.includes('/')){
			({ folderName, parentObject} = getContextFromPath(
				parentObject, folderName
			));
		}
		parentObject[folderName] = {
			'.keep': {}
		};
		folderAdded = true;
		manageOp = {
			operation: "updateProject"
		};
	} catch (e) {
		console.log('could not add folder');
		console.log(e);
	}
	if(manageOp && currentServiceCode && treeEntryDeleted){
		currentService.code = currentServiceCode;
	}
	return manageOp;
}

function renameFolder(e, currentService, currentFile){
	//console.log('renameFolder');
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

function deleteFolder(e, currentService, currentFile){
	// console.log('deleteFolder');
	// console.log(e.detail);
	const { folderName } = e.detail;

	//TODO: is either current selected folder or parent of currentFile
	const currentFolder = "/";

	// delete all child files
	const rootFolderName = Object.keys(currentService.tree)[0];
	const root = currentService.tree[rootFolderName];
	const { folderName: folder, parentObject} = getContextFromPath(root, folderName);
	const children = flattenTree(parentObject[folder])
		.map(x => x.name);
	// console.log({ children });
	// console.log(currentService.code.map(x => x.name))
	const currentServiceCode = currentService.code
		.filter(c => !children.includes(c.name));
	// console.log(currentServiceCode.map(x => x.name))
	currentService.code = currentServiceCode;

	const folderdeleted = uberManageOp({
		currentFolder,
		currentService,
		oldName: folderName,
		newName: '',
		createNewTree: false,
		deleteOldTree: true,
		createNewFile: false,
		deleteOldFile: false
	});

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
	const manageOp = ops[operation]
		? ops[operation](e, currentService, currentFile, currentFolder)
		: undefined;
	return manageOp;
}

export {
	managementOp
};



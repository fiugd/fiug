//2021-06-19 01:54

import { isString } from "./Types.mjs";
import { attach, attachTrigger } from "./Listeners.mjs";
import ext from "/shared/icons/seti/ext.json.mjs";

import "/shared/vendor/localforage.min.js";
import packageJson from "/package.json" assert { type: "json" };

const SYSTEM_NAME = `${packageJson.name} v${packageJson.version}`;

const execTrigger = attachTrigger({
	name: "State",
	eventName: "operations",
	type: "raw",
});

let listenerQueue = [];

let currentService;
let currentFile;
let currentFilePath;

let currentFolder;
let allServices;

const state = {
	changedFiles: {},
	openedFiles: {},
};

// TODO: fix the following fails for extensionless files
const isFolder = filename => {
	return filename.split('/').pop().split('.').length === 1;
};

/*
steps to opened/closed/selected files state sanity:
- [x] when a file is loaded from service worker (selected)
	- [x] it is considered selected
	- [x] it is pushed to opened array
	- [x] if a file was selected previously
		- and was changed: keep it in opened array
		- and was not changed: pop it from opened array
- [x] when a previously selected file is selected again
	- it is considered selected
	- it gets order:0 and other files get order:+1
- [x] when a file is deleted
	- if selected: next file in order is selected & file is removed from opened array
	- if opened: it is removed from opened, following files get bumped up in order
- [ ] when a file is moved or renamed
	- it stays in order and selected state, it's details are updated
- [x] what if file is loaded from service worker, but not used by editor?
	- handle this by doing tracking in app state module versus in SW

Currently, storage writes for this state are here:
modules/TreeView#L23
- https://github.com/crosshj/fiug-beta/blob/694dcfbe73e2c29c8c6c6e7f86cfe23010841612/modules/TreeView.mjs#L23
*/

class StateTracker {
	constructor(){
		const driver = [
			localforage.INDEXEDDB,
			localforage.WEBSQL,
			localforage.LOCALSTORAGE,
		];
		this.store = localforage.createInstance({
			driver,
			name: "service-worker",
			version: 1.0,
			storeName: "changes",
			description: "keep track of changes not pushed to provider",
		});
		this.getState = this.getState.bind(this);
		this.setState = this.setState.bind(this);
		this.withState = this.withState.bind(this);
		this.closeFile = this.withState(['opened'], this.closeFile);
		this.openFile = this.withState(['changed', 'opened'], this.openFile);
	}

	async setState({ opened=[], selected={} }={}){
		const { store } = this;
		opened && await store.setItem(`state-${currentService.name}-opened`, opened);
		selected && await store.setItem(`tree-${currentService.name}-selected`, selected.name);
	}

	async getState(which=[]){
		const { store } = this;
		const state = {
			opened: () => store.getItem(`state-${currentService.name}-opened`),
			changed: async () => (await store.keys())
				.filter(key => key.startsWith(currentService.name))
				.map(key => key.replace(currentService.name+'/', ''))
		};
		const results = {};
		for(let i=0, len=which.length; i<len; i++){
			const whichProp = which[i];
			results[whichProp] = (await state[whichProp]()) || undefined;
		}
		return results;
	}

	withState(depends, fn){
		return async (arg) => {
			if(!currentService) return;
			const { setState, getState } = this;
			const current = await getState(depends);
			const result = await fn(current, arg);
			setState(result);
		};
	}

	// close a file (or folder)
	closeFile({ opened=[] }, filename){
		if(!filename) return {};
		if(filename.startsWith('/')) filename = filename.slice(1);
		filename = filename.replace(currentService.name+'/', '');
		const filterOpened = isFolder(filename)
			? x => !x.name.startsWith(filename)
			: x => x.name !== filename;
		opened = opened.filter(filterOpened);
		[...opened]
			.sort((a,b)=>a.order - b.order)
			.forEach((x,i)=>x.order=i);
		const selected = opened.find(x => x.order === 0);
		return { opened, selected };
	}

	openFile({ changed=[], opened=[] }, filename){
		if(!filename) return {};
		if(filename.startsWith('/')) filename = filename.slice(1);
		filename = filename.replace(currentService.name+'/', '');
		const lastFile = opened[opened.length-1];
		const lastFileIsChanged = lastFile
			? changed.includes(lastFile.name)
			: true;
		let selected = opened.find(x => x.name === filename);

		opened.forEach(x => x.order += 1);
		if(!selected && !lastFileIsChanged){
			opened = opened.filter(x => x.name !== lastFile.name);
		}
		if(!selected){
			selected = { name: filename };
			opened.push(selected);
		}
		selected.order = -Number.MAX_VALUE;
		[...opened]
			.sort((a,b)=>a.order - b.order)
			.forEach((x,i)=>x.order=i);
		return { opened, selected };
	}
}
const stateTracker = new StateTracker();

class ServiceSwitcher {
	shouldSwitch(event){
		try {
			const {source, op, result} = event.detail;
			if(
				op === 'update' &&
				source === 'Terminal' &&
				result.length === 1
			) {
				this.newService = result[0];
				return true;
			};
		} catch(e){}
		return false;
	}
	switch(){
		const { newService } = this;
		currentService = newService;
		// TODO: other things that could be set here (maybe should not)
		// currentFile;
		// currentFilePath;
		// currentFolder;
	}
}
const serviceSwitcher = new ServiceSwitcher();

const sortAlg = (propFn = (x) => x, alg = "alpha") => {
	if (alg === "alpha") {
		const lowSafe = (x = "") => x.toLowerCase();
		return (a, b) => {
			const afilename =
				lowSafe(propFn(a)).split(".").slice(0, -1).join(".") ||
				lowSafe(propFn(a));
			const bfilename =
				lowSafe(propFn(b)).split(".").slice(0, -1).join(".") ||
				lowSafe(propFn(b));
			if (afilename < bfilename) {
				return -1;
			}
			if (afilename > bfilename) {
				return 1;
			}
			const aExt = lowSafe(propFn(a)).replace(afilename, "");
			const bExt = lowSafe(propFn(b)).replace(bfilename, "");
			if (aExt < bExt) {
				return -1;
			}
			if (aExt > bExt) {
				return 1;
			}
			return (a, b) => propFn(a) - propFn(b);
		};
	}
	console.log(`sort algorithm not found: ${alg}`);
};

function getFileType(fileName = "") {
	let type = "default";
	const extension = ((fileName.match(/\.[0-9a-z]+$/i) || [])[0] || "").replace(
		/^\./,
		""
	);

	//console.log(extension)
	if (ext[extension]) {
		type = ext[extension];
	}
	if (extension === "md") {
		type = "info";
	}
	return type;
}

const flattenTree = (tree, folderPaths) => {
	const results = [];
	const recurse = (branch, parent = "/") => {
		const leaves = Object.keys(branch);
		leaves.map((key) => {
			const children = Object.keys(branch[key]);
			if (!children || !children.length) {
				results.push({
					name: key,
					code: parent + key,
					path: parent + key,
				});
			} else {
				if (folderPaths) {
					results.push({
						name: key,
						path: parent + key,
					});
				}
				recurse(branch[key], `${parent}${key}/`);
			}
		});
	};
	recurse(tree);
	return results;
};

function getDefaultFile(service) {
	let defaultFile;
	try {
		const manifestJson = JSON.parse(
			service.code.find((x) => x.name === "service.manifest.json").code
		);
		defaultFile = manifestJson.main;
	} catch (e) {}
	try {
		const packageJson = JSON.parse(
			service.code.find((x) => x.name === "package.json").code
		);
		defaultFile = packageJson.main;
	} catch (e) {}
	return defaultFile || "index.js";
}

const getCurrentServiceTree = ({ flat, folders } = {}) => {
	return flat
		? flattenTree(currentService.tree, folders)
				.map(({ name, path } = {}) => ({
					name,
					path,
					relativePath: path.split(currentService.name).slice(1).join(''),
					type: getFileType(name)
				}))
				.sort(sortAlg((x) => x.name))
		: currentService.tree;
};

// has side effects of setting current code
const getCurrentService = ({ pure } = {}) => {
	if (pure) {
		//if (!currentService?.code) debugger;
		return currentService;
	}
	const changedArray = Object.keys(state.changedFiles).map(
		(k) => state.changedFiles[k]
	);
	const mostRecent = changedArray.map((x) => x[x.length - 1]);

	//error here because currentService is wrong sometimes

	// SIDE EFFECTS!!!
	mostRecent.forEach((m) => {
		const found = currentService.code.find((x) => {
			x.path === `/${currentService.name}/${m.filename}` ||
			x.name === m.filename
		});
		if (!found) {
			console.error({
				changedArray,
				mostRecent,
				filename: m.filename,
				found: found || "notfound",
			});
			return;
		}
		found.code = m.code;
	});

	return currentService;
};

// has side-effects of setting currentService and currentFile

// this should really be broken out into:
//    setCurrentFile, setCurrentService
//    getCurrentFile, getCurrentService

function setCurrentFile({ filePath, fileName }){
	if(filePath){
		currentFile = filePath.split('/').pop();
		//currentFilePath = `/${currentService.name}/${filePath}`;
		currentFilePath = filePath;
		return;
	}
	currentFile = fileName;
	currentFilePath = undefined;
}

function getCurrentFile(){
	return currentFilePath || currentFile;
}
async function getCurrentFileFull({ noFetch } = {}){
	const pathWithServiceName = currentFilePath.includes(currentService.name)
		? currentFilePath
		: `/${currentService.name}/${currentFilePath}`;
	if(noFetch) return { path: pathWithServiceName };

	const fileBody = currentFilePath
		? currentService.code.find((x) => x.path === pathWithServiceName)
		: currentService.code.find((x) => x.name === currentFile);

	if(fileBody && fileBody.path){
		fileBody.code = await (await fetch(fileBody.path, {
			headers: {
				'x-requestor': 'editor-state'
			}
		})).text();
	}

	return fileBody;
}

function setCurrentService(service) {
	return getCodeFromService(service);
}

function getCodeFromService(service, file) {
	const serviceAction = !!service ? "set" : "get";
	const fileAction = !!file ? "set" : "get";

	if (
		serviceAction === "set" &&
		currentService &&
		Number(currentService.id) !== Number(service.id)
	) {
		resetState();
	}

	if (serviceAction === "set") {
		currentService = service;
	}

	if (serviceAction === "get") {
		//this caues service files based on changedArray
		getCurrentService();
	}

	if (fileAction === "set") {
		currentFile = file;
	}

	if (fileAction === "get") {
		currentFile = currentFile || getDefaultFile(currentService);
	}

	const code = Array.isArray(currentService.code)
		? (currentService.code.find((x) => x.name === currentFile) || {}).code || ""
		: isString(() => currentService.code)
		? currentService.code
		: "";

	return {
		name: currentService.name,
		id: currentService.id,
		// may be able to make next two lines go away (and also other code and file related stuff
		code,
		filename: currentFile,
	};
}

function getState({ folderPaths, serviceRelative } = {}) {
	//TODO: should probably pull only latest state change
	let paths;
	try {
		const tree = serviceRelative
			? currentService.tree[currentService.name]
			: currentService.tree;
		paths = flattenTree(tree, folderPaths);
	} catch (e) {}
	return JSON.parse(JSON.stringify({ ...state, paths }));
}

function setState(change) {
	//TODO: this could be expensive
	const { name, id, code, prevCode, filename } = change;
	//console.log(change);
	const stateKey = `${id}|${name}|${filename}`;

/*
	if (!state.changedFiles[stateKey]) {
		state.changedFiles[stateKey] = [
			{
				name,
				id,
				code: prevCode,
			},
		];
	}
	state.changedFiles[stateKey].push({ name, id, code, filename });
*/
	openFile({ name: filename });
	return currentFile;
}

const getCurrentFolder = () => currentFolder;
const setCurrentFolder = (path) => {
	currentFolder = path;
};

const resetState = () => {
	//console.log(`Current Service reset!`);
	currentFile = currentService = null;
	state.changedFiles = {};
};

async function getAllServices() {
	const queueListener = () =>
		new Promise((resolve, reject) => {
			const commandQueueId = Math.random().toString().replace("0.", "");
			listenerQueue.push({
				id: commandQueueId,
				after: ({ result = {} } = {}) => {
					allServices = result.result || allServices || [];
					resolve(allServices);
				},
			});
			execTrigger({
				detail: {
					operation: "read",
					listener: commandQueueId,
					body: {
						id: "*",
					},
				},
			});
		});
	return await queueListener();
}

function openFile({ name, parent, path, ...other }) {
	path = path || parent;
	const fullName = path
		? `${path}/${name}`
		: name;
	if(!state.openedFiles[fullName] || !state.openedFiles[fullName].selected){
		//purposefully not awaiting this, should listen not block
		stateTracker.openFile(fullName);
	}

	const SOME_BIG_NUMBER = Math.floor(Number.MAX_SAFE_INTEGER/1.1);
	Object.entries(state.openedFiles)
		.forEach(([k,v]) => {
			v.selected = false;
		});
	state.openedFiles[fullName] = {
		name: fullName,
		...other,
		selected: true,
		order: SOME_BIG_NUMBER,
	};
	//NOTE: well-intentioned, but not currently working right
	//currentFile = fullName;
	Object.entries(state.openedFiles)
		.sort(([ka,a],[kb,b]) => a.order - b.order)
		.forEach(([k,v], i) => {
			v.order = i;
		});
}

function closeFile({ name, filename, parent, path, next, nextPath }) {
	path = path || parent;
	name = name || filename;
	const fullName = path
		? `${path}/${name}`
		: name;
	const nextFullName = nextPath
		? `${nextPath}/${next}`
		: next;

	//purposefully not awaiting this, should listen not block
	stateTracker.closeFile(fullName);

	const objEntries = Object.entries(state.openedFiles)
		.map(([key, value]) => value)
		.filter((x) => x.name !== fullName)
		.sort((a, b) => a.order - b.order)
		.map((x, i) => {
			const selected = x.name === nextFullName;
			return { ...x, order: i, selected };
		})
		.map((x) => {
			const fullName = x.parent
				? `${x.parent}/${x.name}`
				: x.name;
			return [fullName, x]
		});
	state.openedFiles = Object.fromEntries(objEntries);
}

function moveFile({ name, order }) {
	state.openedFiles[name].order = order;
}

function getOpenedFiles() {
	return Object.entries(state.openedFiles)
		.map(([key, value]) => value)
		.sort((a, b) => a.order - b.order)
		.map((x, i) => {
			return { ...x, ...{ order: i } };
		});
}

function getSettings(){
	const storedSettings = JSON.parse(localStorage.getItem('editorSettings')||'{}');
	return {
		SYSTEM_NAME,
		tabSize: 2,
		indentWithTabs: true,
		...storedSettings
	}
}

const operationDoneHandler = (event) => {
	if(serviceSwitcher.shouldSwitch(event))
		serviceSwitcher.switch();

	if (listenerQueue.length === 0) {
		//console.warn('nothing listening!');
		return;
	}
	const { detail } = event;
	const { op, id, result, operation, listener } = detail;

	const foundQueueItem =
		listener && listenerQueue.find((x) => x.id === listener);
	if (!foundQueueItem) {
		//console.warn(`nothing listening for ${listener}`);
		return false;
	}
	listenerQueue = listenerQueue.filter((x) => x.id !== listener);
	foundQueueItem.after && foundQueueItem.after({ result: { result } });
	return true;
};

const operationsHandler = (event) => {
	const { operation } = event.detail || {};
	if(!operation || !['deleteFile'].includes(operation)) return;

	if(operation === 'deleteFile'){
		closeFile(event.detail);
		return;
	}
};

const events = [{
	eventName: "operationDone",
	listener: operationDoneHandler,
}, {
	eventName: "operations",
	listener: operationsHandler,
}, {
	eventName: "fileClose",
	listener: (event) => closeFile(event.detail),
}, {
	eventName: "fileSelect",
	listener: (event) => openFile(event.detail),
}, {
	eventName: "open-settings-view",
	listener: (event) => openFile({
		name: "system::open-settings-view"
	})
}];
events.map((args) =>
	attach({ name: 'State', ...args })
);

export {
	getAllServices,
	getCodeFromService,

	getCurrentFile,
	getCurrentFileFull,
	setCurrentFile,

	getCurrentService,
	getCurrentServiceTree,
	getDefaultFile,
	setCurrentService,
	getCurrentFolder,
	setCurrentFolder,
	getState,
	setState,
	resetState,
	getSettings,
	openFile,
	closeFile,
	moveFile,
	getOpenedFiles,
};
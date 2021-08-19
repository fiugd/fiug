/*
2021-02-26 15:21

there are two different ways of handling a Management Operation

1) trigger event.type=operation event with detail.operation = {some management op}
	- tree does this

2) trigger event.type={some management op} event
	- terminal does this

THIS IS CONFUSING - going to kill #2

*/
import { getOpenedFiles, getCurrentService } from "./state.mjs";

import { attach, attachTrigger } from "./Listeners.mjs";
import { debounce } from "/shared/modules/utilities.mjs";

const noFrontSlash = (path) => {
	if(!path) return path;
	if(!path.includes('/')) return path;
	if(path[0] === '/') return path.slice(1);
	return path;
};

const pathNoServiceName = (service, path) => {
	if(!path.includes('/')) return path;
	if(!path.includes(service.name)) return stripLeadSlash(path);
	return stripLeadSlash(
		stripLeadSlash(path).replace(service.name, '')
	);
};

const tryFn = (fn, _default) => {
	try {
		return fn();
	} catch (e) {
		return _default;
	}
};
const stripLeadSlash = (path="") => path[0] === '/'
	? path.slice(1)
	: path;
const flattenTree = (tree) => {
	const results = [];
	const recurse = (branch, parent = "/") => {
		const leaves = Object.keys(branch);
		leaves.map((x) => {
			results.push({
				name: x,
				parent,
			});
			recurse(branch[x], x);
		});
	};
	recurse(tree);
	return results;
};

const guessCurrentFolder = (currentFile, currentService) => {
	if((currentFile||'').includes('/')){
		const parent = currentFile.split('/').slice(0,-1).join('/');
		return parent.includes(currentService.name)
			? parent.replace(`${currentService.name}/`, '')
			: parent;
	}
	if(!currentService) return '/';
	//return currentService.name;
	let parent;
	try {
		const flat = flattenTree(
			currentService.tree[Object.keys(currentService.tree)[0]]
		);
		// TODO: should follow parents up tree and build path from that
		let done;
		let path = [];
		let file = currentFile;
		while (!done) {
			file = flat.find((x) => x.name === file).parent;
			if (file === "/") {
				done = true;
			} else {
				path.push(file);
			}
		}
		parent = "/" + path.reverse().join("/");
	} catch (e) {}
	return parent;
};

async function performOp(
	currentService,
	operations,
	performOperation,
	externalStateRequest,
	callback
) {
	const files = JSON.parse(JSON.stringify(currentService.code));
	const body = {
		id: currentService.id,
		name: currentService.name,
		code: JSON.stringify({
			tree: currentService.tree,
			files,
		}),
	};

	const foundOp = operations.find((x) => x.name === "update");
	const foundOpClone = JSON.parse(JSON.stringify(foundOp));
	foundOpClone.config = foundOpClone.config || {};
	foundOpClone.config.body = JSON.stringify(body);
	foundOpClone.eventToBody = foundOp.eventToBody;
	foundOpClone.eventToParams = foundOp.eventToParams;

	foundOpClone.after = (...args) => {
		foundOp.after(...args);
		callback && callback(null, "DONE");
	};

	await performOperation(foundOpClone, { body }, externalStateRequest);
}

// -----------------------------------------------------

const showCurrentFolderHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	getCurrentFolder,
}) => (event) => {
	// this should move to management.mjs
	const { detail } = event;
	const { callback } = detail;
	const currentFile = getCurrentFile();
	const currentService = getCurrentService({ pure: true });
	const currentFolder = getCurrentFolder();
	if(!currentService){
		callback && callback('unable to read current service');
		return;
	}
	const parent = currentFolder
		? currentFolder
		: guessCurrentFolder(currentFile, currentService);
	const currentFolderResponse = parent === '/'
		? currentService.name + '/'
		: `${currentService.name}/${stripLeadSlash(parent)}`;

	callback && callback(
		!parent ? "trouble finding current path" : false,
		currentFolderResponse,
		currentService?.name
	);
};

const changeCurrentFolderHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	getCurrentFolder,
	setCurrentFolder,
}) => (event) => {
	console.log("OPERATIONS: changeCurrentFolder");
	const { detail } = event;
	const { callback, folderPath } = detail;

	const currentService = getCurrentService({ pure: true });
	const currentFile = getCurrentFile();
	const currentFolder = getCurrentFolder() ||
		guessCurrentFolder(currentFile, currentService);

	const firsChar = folderPath[0];
	let currentPath = (firsChar === "/"
		? folderPath
		: (currentFolder || "") + "/" + folderPath
	).replace(/\/\//g, "/");

	if(folderPath.includes('..')){
		currentPath = (currentFolder||'').split('/')
			.slice(0,-1)
			.join('/') || '/';
		const restOfPath = folderPath.replace('..', '')
		if(restOfPath){
			currentPath += restOfPath;
		}
	}

	setCurrentFolder(currentPath);

	const folderSelectEvent = new CustomEvent("folderSelect", {
		bubbles: true,
		detail: { name: currentPath },
	});
	document.body.dispatchEvent(folderSelectEvent);

	callback && callback(null, " ");
};

const addFolderHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	operations,
	getOperations,
}) => async (event) => {
	const { detail } = event;
	const { callback } = detail;
	const currentService = getCurrentService({ pure: true });
	const currentFile = getCurrentFile();
	operations =
		operations ||
		getOperations(
			() => {},
			() => {}
		);
	event.detail.operation = event.detail.operation || event.type;
	const op = managementOp(event);
	const manageOp = op(event, currentService, currentFile);

	await performOp(
		currentService,
		operations,
		performOperation,
		externalStateRequest,
		callback
	);
};

const renameFolderHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	operations,
}) => async (event) => {
	// console.log('OPERATIONS: renameFolder');
	const { detail } = event;
	const { callback } = detail;
	const currentService = getCurrentService({ pure: true });
	const currentFile = getCurrentFile();
	event.detail.operation = event.detail.operation || event.type;
	const manageOp = managementOp(event, currentService, currentFile);
	//currentService, operations, performOperation, externalStateRequest
	await performOp(
		currentService,
		operations,
		performOperation,
		externalStateRequest,
		callback
	);
};

const deleteFolderHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	operations,
}) => async (event) => {
	const { detail } = event;
	const { callback } = detail;
	const currentService = getCurrentService({ pure: true });
	const currentFile = getCurrentFile();
	event.detail.operation = event.detail.operation || event.type;
	const manageOp = managementOp(event, currentService, currentFile);

	await performOp(
		currentService,
		operations,
		performOperation,
		externalStateRequest,
		callback
	);
};

const moveFolderHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	operations,
}) => async (event) => {
	//console.log('OPERATIONS: move');
	const { detail } = event;
	const { callback } = detail;
	const currentService = getCurrentService({ pure: true });
	const currentFile = getCurrentFile();
	event.detail.operation = event.detail.operation || event.type;
	const manageOp = managementOp(event, currentService, currentFile);

	await performOp(
		currentService,
		operations,
		performOperation,
		externalStateRequest,
		callback
	);
};

const moveFileHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	operations,
}) => async (event) => {
	//console.log('OPERATIONS: move');
	const { detail } = event;
	const { callback } = detail;
	const currentService = getCurrentService({ pure: true });
	const currentFile = getCurrentFile();
	event.detail.operation = event.detail.operation || event.type;
	const manageOp = managementOp(event, currentService, currentFile);

	await performOp(
		currentService,
		operations,
		performOperation,
		externalStateRequest,
		callback
	);
};

const readFolderHandler = ({
	managementOp,
	performOperation,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	getCurrentFolder,
}) => (event) => {
	// this should move to management.mjs
	const { detail } = event;
	const { callback } = detail;
	const currentFile = getCurrentFile();
	const currentService = getCurrentService({ pure: true });
	const currentFolder = getCurrentFolder();
	const parent = currentFolder
		? currentFolder
		: guessCurrentFolder(currentFile, currentService);

	event.detail.operation = "readFolder";
	const op = managementOp(event, currentService, currentFile, currentFolder);
	const children = op(event, currentService, currentFile, parent);

	callback &&
		callback(
			!parent || !children ? "trouble finding current path or children" : false,
			children && children.length ? children.join("\n") : "<empty>"
		);
};

const fileChangeHandler = (...args) =>
	debounce((event) => {
		const {
			getState,
			getOperations,
			performOperation,
			triggerOperationDone,
			getCurrentService,
		} = args[0];
		const state = getState();
		const service = getCurrentService({ pure: true }).name;
		const operations = getOperations();
		const changeOp = (operations || []).find((x) => x.name === "change");

		const { filePath, code } = event.detail;
		const path = `./${service}/${filePath}`;

		(async () => {
			const results = await performOperation(changeOp, {
				path,
				code,
				service,
			});
			triggerOperationDone(results);
		})();
	}, 300);

// ----------------------------------------------------------------------------------------------------------

const updateServiceHandler = async ({
	getCurrentService,
	getState,
	performOperation,
	foundOp,
	manOp,
}) => {
	try {
		const service = getCurrentService();
		const state = getState();

		//TODO: maybe some day get fancy and only send changes
		// for now, just update all service files that have changed and send whole service
		Object.keys(state.changedFiles).forEach((chKey) => {
			const [serviceId, serviceName, filename] = chKey.split("|");
			const changes = state.changedFiles[chKey];

			const foundFile = service.code.find((x) => x.name === filename);
			foundFile.code = changes[changes.length - 1];
		});
		const body = service;

		const eventData = {
			body,
		};

		if (manOp && manOp.listener) {
			eventData.listener = manOp.listener;
		}

		const results = await performOperation(foundOp, eventData);
		return results;
	} catch (e) {
		console.error("error updating service");
		console.error(e);
	}
};

const serviceOperation = async ({
	service: { name: service },
	operation: command,
	filename,
	folderName,
	parent='',
}) => {
	const base = parent.includes(service)
		? parent
		: `${service}/${parent}`;
	const path = `/${base}/${filename || folderName}`;

	const options = {
		method: "POST",
		body: JSON.stringify({ path, command, service }),
	};
	const result = await fetch("service/change", options).then(x => x.json());
	return result;
};

const operationsHandler = ({
	managementOp,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	setCurrentService,
	getCurrentFolder,
	setCurrentFolder,
	getState,
	resetState,
	getOperations,
	getReadAfter,
	getUpdateAfter,
	performOperation,
	operationsListener,
	triggerOperationDone,
	getChainedTrigger,
}) => async (event) => {
	try {
		// deprecate from dummyFunc -> updateAfter -> readAfter;
		const dummyFunc = () => {};
		const updateAfter = getUpdateAfter(dummyFunc, dummyFunc, dummyFunc);
		const readAfter = getReadAfter(dummyFunc);
		const allOperations = getOperations(updateAfter, readAfter);
		const { detail } = event;
		const { callback } = detail;

		// NOTE: simple operations handling - tell service worker to do everything
		const stripLeadingSlash = (s='') => s.startsWith('/') ? s.slice(1) : s;
		const swOps = {
			"addFile": (detail, op, service) => {
				const { parent, filename } = detail;
				op.target = stripLeadingSlash(
					`${parent}/${filename}`.replace(service+'/', '')
				);
				op.source = "\n";
			},
			"addFolder": (detail, op, service) => {
				const {folderName, parent } = detail;
				op.target = stripLeadingSlash(
					`${parent}/${folderName}`.replace(service+'/', '')
				);
				delete op.source;
			},
			"moveFile": (detail, op, service) => {
				debugger;
			},
			"moveFolder": (detail, op, service) => {
				const { folderName } = detail;
				if(op.target === op.source) return { error: "invalid move operation" };
				op.target = op.target.replace(new RegExp(`${folderName}$`), '');
			},
			"copyFile": (detail, op, service) => {
				debugger;
			},
			"copyFolder": (detail, op, service) => {
				debugger;
			},
			"renameFile": (detail, op, service) => {
				debugger;
			},
			"renameFolder": (detail, op, service) => {
				debugger;
			},
			"deleteFile": (detail, op, service) => {
				const { parent, filename } = detail;
				op.source = stripLeadingSlash(
					`${parent}/${filename}`.replace(service+'/', '')
				);
				delete op.target;
			},
			"deleteFolder": (detail, op, service) => {
				const { parent, filename } = detail;
				op.source = stripLeadingSlash(
					`${parent}/${filename}`.replace(service+'/', '')
				);
				delete op.target;
			},
		};
		if( Object.keys(swOps).includes(detail?.operation) ){
			console.log('%c using service worker for: %c'+ detail.operation,
				'color: blue;',
				'color: yellow;'
			);
			const updateOp = allOperations.find((x) => x.name === "update");
			const currentService = getCurrentService() || { };
			currentService.name = currentService.name || 'service-not-found'
	
			const body = {
				name: currentService.name,
				id: currentService.id,
				operation: {
					name: event.detail.operation,
				}
			};
			try {
				body.operation.source = event.detail.src.replace(currentService.name+'/', '');
			} catch(e){}
			try {
				body.operation.target = event.detail.tgt.replace(currentService.name+'/', '');
			} catch(e){}
	
			const { error } = swOps[detail.operation](event.detail, body.operation, currentService.name) || {};
			if(error){
				console.error('time to reconsider your life..');
				debugger;
				return;
			}
			const result = await performOperation(updateOp, { body });
			const updatedService = result?.detail?.result[0];
			setCurrentService(updatedService);
			triggerOperationDone(result);
			callback && callback(undefined, result);
			return;
		}

		if (detail && detail.operation === "showCurrentFolder") {
			return showCurrentFolderHandler({
				getCurrentFile,
				getCurrentService,
				getCurrentFolder,
			})(event);
		}
		if (detail && detail.operation === "changeCurrentFolder") {
			return changeCurrentFolderHandler({
				getCurrentFile,
				getCurrentService,
				getCurrentFolder,
				setCurrentFolder,
			})(event);
		}

		const manageOp = managementOp(event);
		if (manageOp) {
			const currentService = getCurrentService();
			const currentFile = getCurrentFile();
			const currentFolder =
				getCurrentFolder() || guessCurrentFolder(currentFile, currentService);
			const manageOpResult = manageOp(
				event,
				currentService,
				currentFile,
				currentFolder
			);
			if (!manageOpResult || manageOpResult.operation !== "updateProject") {
				if (!callback) {
					debugger;
					return;
				}

				//some management ops do not require state update!?
				callback(null, manageOpResult);

				//might be cool to do this another way (but needs work)
				//triggerOperationDone(manageOpResult);
				return;
			}

			// deleteFolder, addFolder, moveFile, moveFolder(?) needs to handle non-callback flow (operationDone)
			const foundOp = allOperations.find((x) => x.name === "update");
			const result = await updateServiceHandler({
				getCurrentService,
				getState,
				performOperation,
				foundOp,
				manOp: manageOpResult,
			});

			//if this is a deleteFile or deleteFolder, provider needs to know (and shouldn't have to guess)
			//this probably is the only thing that needs to be done (and not what is above!)
			let deleteResult;
			if (["deleteFile", "deleteFolder"].includes(event.detail.operation)) {
				deleteResult = await serviceOperation({
					service: currentService,
					...event.detail,
				});
				console.log(JSON.stringify(deleteResult, null, 2));
			}

			triggerOperationDone(result);
			const chainedTrigger = getChainedTrigger(event);
			if (chainedTrigger) {
				await chainedTrigger();
			}
			callback && callback(undefined, deleteResult || result);
			return;
		}

		const foundOp = allOperations.find(
			(x) => x.name === event.detail.operation
		);
		if (!foundOp) {
			return;
		}
		if (foundOp.name === "update") {
			const result = await updateServiceHandler({
				getCurrentService,
				getState,
				performOperation,
				foundOp,
			});
			triggerOperationDone(result);
			return;
		}
		const result = await performOperation(foundOp, event.detail);
		triggerOperationDone(result);
		//wrangle context(state?)?
		//execute operation with context
		//debugger;
	} catch (e) {
		console.error(e);
	}
};

const providerHandler = ({
	managementOp,
	externalStateRequest,
	getCurrentFile,
	getCurrentService,
	setCurrentService,
	getCurrentFolder,
	setCurrentFolder,
	getState,
	resetState,
	getOperations,
	getReadAfter,
	getUpdateAfter,
	performOperation,
	operationsListener,
	triggerOperationDone,
}) => (event) => {
	const { detail, type } = event;
	if (
		!["provider-test", "provider-save", "provider-add-service"].includes(type)
	) {
		return;
	}
	let { data } = detail;
	data = data.reduce((all, one) => {
		// this is just an extra step, probably should remove it
		const mappedName = {
			"provider-url": "providerUrl",
			"provider-type": "providerType",
			"provider-access-token": "auth",
			"provider-repository": "repo",
			"provider-repository-branch": "branch",
		}[one.name];
		if (!mappedName) {
			console.error("could not find data mapping!");
			return;
		}
		all[mappedName] = one.value;
		return all;
	}, {});

	//TODO: provider-add-service should just be service/create with provider passed as argument

	const handler = operationsHandler({
		managementOp,
		externalStateRequest,
		getCurrentFile,
		getCurrentService,
		setCurrentService,
		getCurrentFolder,
		setCurrentFolder,
		getState,
		resetState,
		getOperations,
		getReadAfter,
		getUpdateAfter,
		performOperation,
		operationsListener,
		triggerOperationDone,
	});
	return handler({
		detail: { ...data, operation: type },
	});
};

const operationDoneHandler = ({
	getCurrentService,
	setCurrentService,
	triggerServiceSwitchNotify,
}) => (event) => {
	const result = tryFn(() => event.detail.result, []);
	const op = tryFn(() => event.detail.op, "");
	const inboundService = tryFn(() => event.detail.result[0], {});
	const wasAllServicesRead = !event.detail.id && event.detail.id !== 0;

	const readOneServiceDone =
		result?.length === 1 &&
		op === "read" &&
		(inboundService?.id || inboundService?.id === 0) &&
		inboundService?.id !== "*" &&
		!wasAllServicesRead;

	const handledHere = [readOneServiceDone];
	if (!readOneServiceDone) return;

	// TODO: this should be handled in state event handler..
	if (readOneServiceDone) {
		const currentService = getCurrentService({ pure: true });
		const isNewService =
			!currentService ||
			Number(inboundService.id) !== Number(currentService.id);
		if (!isNewService) return;
		setCurrentService(inboundService);
		triggerServiceSwitchNotify();
		return;
	}
};

const handlers = {
	showCurrentFolderHandler,
	changeCurrentFolderHandler,

	addFolderHandler,
	readFolderHandler,
	deleteFolderHandler,
	renameFolderHandler,
	moveFolderHandler,
	moveFileHandler,

	operationsHandler,
	operationDoneHandler,
	"provider-test": providerHandler,
	"provider-save": providerHandler,
	"provider-add-service": providerHandler,
	fileChangeHandler,
};

const getChainedTrigger = ({ triggers }) => (event) => {
	const handler = {
		addFile: async () => {
			const service = getCurrentService({ pure: true });
			const name = event.detail.parent
				? `${event.detail.parent}/${event.detail.name}`
				: event.detail.name;
			triggers.triggerFileSelect({
				detail: { name: pathNoServiceName(service, name) },
			});
		},
		deleteFile: async () => {
			const name = event.detail.parent
				? `${event.detail.parent}/${event.detail.name}`
				: event.detail.name;
			const allOpen = getOpenedFiles() || [];
			const opened = allOpen.filter(x => x.name !== name);
			if(allOpen?.length === opened?.length) return;

			let next;
			if (opened.length) {
				next = opened[opened.length - 1].name;
			}
			const alreadySelected = allOpen.find(x => x.selected);
			if(alreadySelected){
				next = alreadySelected.name;
			}
			triggers.triggerFileClose({
				detail: { name, next },
			});
		},
	}[event.detail.operation];
	return handler;
};

function attachListeners(args) {
	const triggers = {
		triggerServiceSwitchNotify: attachTrigger({
			name: "Operations",
			eventName: "service-switch-notify",
			type: "raw",
		}),
		triggerOperationDone: attachTrigger({
			name: "Operations",
			eventName: "operationDone",
			type: "raw",
		}),
		triggerFileSelect: attachTrigger({
			name: "Operations",
			eventName: "fileSelect",
			type: "raw",
		}),
		triggerFileClose: attachTrigger({
			name: "Operations",
			eventName: "fileClose",
			type: "raw",
		}),
	};
	const mapListeners = (handlerName) => {
		const eventName = handlerName.replace("Handler", "");
		attach({
			name: "Operations",
			eventName,
			listener: handlers[handlerName]({
				...triggers,
				getChainedTrigger: getChainedTrigger({ triggers }),
				...args,
			}),
		});
	};
	Object.keys(handlers).map(mapListeners);
	return triggers;
}

const connectTrigger = (args) => attachTrigger({ ...args, name: "Operations" });

export { attachListeners, connectTrigger };
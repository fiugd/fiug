import {
	attach, trigger, attachTrigger
} from '../Listeners.mjs';

import {
	isSupported
} from '../Templates.mjs';

import { getState, getCurrentFile, getCurrentService } from '../state.mjs';
import { getDefaultFile } from '../state.mjs';
import { getCurrentFolder } from '../state.mjs';

let locked;
let lsLocked = localStorage.getItem("previewLocked");
if(lsLocked === null){
	lsLocked = "true"
	localStorage.setItem("previewLocked", "true");
}
locked = lsLocked === "true";

let currentFile;
let currentFileName;
let currentView = localStorage.getItem('rightPaneSelected');

let backupForLock = {
	currentFile: '',
	currentFileName: ''
};

const PROMPT = '\x1B[38;5;14m \r∑ \x1B[0m';

const NO_PREVIEW = `
<!-- NO_PREVIEW -->
<html>
	<style>
		.no-preview {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 1.5em;
			color: #666;
		}
		body {
			margin: 0px;
			margin-top: 40px;
			height: calc(100vh - 40px);
			overflow: hidden;
			color: #ccc;
			font-family: sans-serif;
		}
	</style>
	<body>
		<pre>
			<div class="no-preview">No preview available.</div>
			</pre>
	</body>
</html>
`;

const commands = [{
	name: 'showCurrentFolder',
	about: 'Shows the path of the current folder',
	alias: ['pwd'],
	required: [],
	args: []
}, {
	name: 'changeCurrentFolder',
	about: 'Switches the current folder',
	alias: ['cd'],
	required: ['folderPath'],
	args: ['folderPath']
}, {
	name: 'addFolder',
	about: 'Makes a folder in the current folder or parent of choice',
	alias: ['md', 'mkdir'],
	required: ['folderName'],
	args: ['folderName', 'parent']
}, {
	name: 'readFolder',
	about: 'Lists the contents of the current folder or parent of choice',
	alias: ['ls', 'dir'],
	required: [],
	args: ['parent']
}, {
	name: 'deleteFolder',
	about: 'Delete a folder. Use a folder in current folder or include path in name.',
	alias: ['df'],
	required: ['folderName'],
	args: ['folderName']
}, {
	name: 'renameFolder',
	about: 'Rename folder. Use a folder in current folder or include path in name.',
	alias: ['rf'],
	required: ['oldName', 'newName'],
	args: ['oldName', 'newName']
}, {
	name: 'moveFolder',
	about: 'Moves folder to destination',
	alias: ['mv'],
	required: ['target', 'destination'],
	args: ['target', 'destination']
}, {
	name: 'moveFile',
	about: 'Moves file to destination',
	alias: ['mf'],
	required: ['target', 'destination'],
	args: ['target', 'destination']
}];

//NOTE: these are mostly already handled in ../Terminal.mjs
//TODO: migrate to this pattern
const manageOps = [
	"addFile", "renameFile", "deleteFile",
	"renameProject"
];
const projectOps = [
	"cancel", "create", "read", "update", "delete",
	"manage", "monitor", "persist",
	"fullscreen", "help"
];
const eventsHandledAlready = [...manageOps, ...projectOps];

const terminalTrigger = (write, command, callback) => {

	let preventDefault = true;
	const [ op, ...args] = command.split(' ');

	if(['help', '?'].includes(op)){
		preventDefault = true;
		write(`\n\nThese might work:\n\n\r   ${
			[
				...eventsHandledAlready,
				...commands.map(x => [...x.alias, x.name].join(' | '))
			]
				.filter(x => x !== "help")
				.join('\n\r   ')
		}\n`);
		callback && callback();
		return preventDefault;
	}

	if(eventsHandledAlready.includes(op)){
		preventDefault = false;
		return preventDefault;
	}

	const currentCommand = commands.find(x => {
		const opMatchesName = op.toLowerCase() === x.name.toLowerCase();
		const opMatchesAlias = x.alias.length > 0
			&& x.alias.map(a=>a.toLowerCase()).includes(op.toLowerCase());
		return opMatchesName || opMatchesAlias;
	});

	if(!currentCommand){
		write(`\nCommand not found: ${op}\n`);
		callback && callback();
		return preventDefault;
	}

	if(args[0] === "?"){
		preventDefault = true;
		write(`\n\nABOUT: ${currentCommand.about}`);
		write(
			`\nUSAGE: ( ${
				[...currentCommand.alias, currentCommand.name].join(' | ')
			} ) ${currentCommand.args.join(" ") || "{no args}"}`
		);
		write(`\nREQUIRED: ${currentCommand.required.join(", ") || "none"}`);
		write(`\n`);
		callback && callback();
		return preventDefault;
	}


	const eventArgs = {};
	for(var i=0, len=currentCommand.args.length; i<len; i++){
		const currentCommandArg = currentCommand.args[i];
		eventArgs[currentCommandArg] = args[i] || null;
	}
	const missingArgs = currentCommand.required
		.map(x => eventArgs[x] ? null : x)
		.filter(x => !!x);

	if(missingArgs.length > 0 ){
		preventDefault = true;
		write(`\nMissing arguments: ${missingArgs.join(', ')}\n`);
		callback && callback();
		return preventDefault;
	}

	const cb = (err, res) => {
		if(err){
			write(`\nERROR: ${err}\n`);
			callback && callback();
			return;
		}
		write(`\n${Array.isArray(res)
			? res.join('\n')
			: res || 'Finished.'
		}\n`);
		callback && callback();
	};

	trigger({
		type: 'operations',
		detail: { operation: currentCommand.name },
		params: { ...eventArgs, ...{ callback: cb }},
		source: 'Terminal'
	});
	return preventDefault;
};

/// ----------------------------------------------------------------------------

const viewSelectHandler = ({ viewUpdate }) => (event) => {
	const { type, detail } = event;
	const { view } = detail;

	currentView = view;
	localStorage.setItem('rightPaneSelected', view);

	if(!currentFile){
		// TODO: bind and conditionally trigger render
		// console.log({ type, op, id });
		const doc = NO_PREVIEW;
		viewUpdate({ type, doc, docName: currentFileName, ...event.detail });
		return;
	}

	let code = typeof currentFile === "string"
		? currentFile
		: '';
	const name = currentFileName || '';
	const isHTML = code.includes('</html>') && ['htm', 'html'].find(x => { return name.includes('.'+x)});
	const isSVG = code.includes('</svg>') && ['svg'].find(x => { return name.includes('.'+x)});
	const isJSX = (name).includes('jsx');
	const isSVC3 = code.includes('/* svcV3 ');
	const hasTemplate = isSupported({ name, contents: code });

	if(!isSVG && !isHTML && !isJSX && !isSVC3 && !hasTemplate){
		code = `<div class="no-preview">No preview available.</div>`;
	}
	const doc = isHTML || isJSX || isSVC3 || hasTemplate
		? code
		: `
		<html>
			<style>
				.no-preview {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 1.5em;
					color: #666;
				}
				body {
					margin: 0px;
					margin-top: 40px;
					height: calc(100vh - 40px);
					overflow: hidden;
					color: #ccc;
					font-family: sans-serif;
				}
			</style>
			<body>
				<pre>${code}</pre>
			</body>
		</html>
	`;
	const supported = hasTemplate || isHTML || isJSX || isSVC3 || isSVG;
	viewUpdate({
		supported,
		type,
		doc,
		docName: currentFileName,
		locked,
		...event.detail
	});
	return;
};

//NOTE: this also handles fileClose events, thus next||name below
let firstLoadSelect = true;
const fileSelectHandler = ({ viewUpdate, getCurrentService }) => (event) => {
	//console.log('terminal-file select');
	if(firstLoadSelect){
		firstLoadSelect = false;
		return;
	}
	const { type, detail } = event;
	const { op, id, name, next } = detail;
	if(type==="fileClose" && next && next.includes('system::')
		|| type==="fileSelect" && name && name.includes('system::')
	){
		return;
	}
	if(type==="fileClose" && locked){
		viewUpdate({ locked });
		return;
	}

	if(type==="fileClose" && !next){
		//TODO: this should be a bit more nuanced
		sessionStorage.setItem('preview', 'noPreview');
		viewUpdate({ supported: false, doc: NO_PREVIEW });
		return;
	}
	if(type === "fileClose" && next === currentFileName){
		return;
	}
	let code;
	try {
		const service = getCurrentService();
		const selectedFile = service.code.find(x => x.name === (next || name));
		({ code } = selectedFile);
	} catch(e) {
		console.error('could not find the file!');
		return;
	}

	code = typeof code === "string"
		? code
		: '';

	// bind and conditionally trigger render
	// for instance, should not render some files
	const isHTML = code.includes('</html>') && ['htm', 'html'].find(x => { return (next||name).includes('.'+x)});
	const isSVG = code.includes('</svg>') && ['svg'].find(x => { return (next||name).includes('.'+x)});
	const isJSX = (next||name).includes('jsx');
	const isSVC3 = code.includes('/* svcV3 ');
	const hasTemplate = isSupported({ name: next||name, contents: code });

	if(!isSVG && !isHTML && !isJSX && !isSVC3 && !hasTemplate){
		code = `<div class="no-preview">No preview available.</div>`;
	}
	const doc = isHTML || isJSX || isSVC3 || hasTemplate
		? code
		: `
		<html>
			<style>
				.no-preview {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 1.5em;
					color: #666;
				}
				body {
					margin: 0px;
					margin-top: 40px;
					height: calc(100vh - 40px);
					overflow: hidden;
					color: #ccc;
					font-family: sans-serif;
				}
			</style>
			<body>
				<pre>${code}</pre>
			</body>
		</html>
	`;
	if(!locked){
		currentFile = doc;
		currentFileName = next||name;
	} else {
		backupForLock.currentFile = doc;
		backupForLock.currentFileName = next||name;
	}
	const supported = hasTemplate || isHTML || isJSX || isSVC3;
	const viewArgs = { supported, type, locked, doc, docName: next || name, ...event.detail };
	viewUpdate(viewArgs);
	return;
};

const terminalActionHandler = ({ terminalActions, viewUpdate }) => (event) => {
	const { type, detail } = event;
	const { action } = detail;

	if(type==="termMenuAction" && action === "lock"){
		localStorage.setItem("previewLocked", !locked);
		locked = !locked;
	}

	terminalActions({ type, detail, locked, ...event.detail });

	if(action === 'full-screen'){
		return;
	}

	if(backupForLock.currentFile){
		currentFile = backupForLock.currentFile;
		currentFileName = backupForLock.currentFileName;
	}

	if(!currentFile){ return; }

	let code;
	code = typeof currentFile === "string"
		? currentFile
		: '';

	const isHTML = code.includes('</html>') && ['htm', 'html'].find(x => { return currentFileName.includes('.'+x)});
	const isSVG = code.includes('</svg>') && ['svg'].find(x => { return currentFileName.includes('.'+x)});
	const isJSX = (currentFileName).includes('jsx');
	const isSVC3 = code.includes('/* svcV3 ');
	const hasTemplate = isSupported({ name: currentFileName, contents: code });

	if(!isSVG && !isHTML && !isJSX && !isSVC3 && !hasTemplate){
		code = `<div class="no-preview">No preview available.</div>`;
	}
	const doc = isHTML || isJSX || isSVC3 || hasTemplate
		? code
		: `
		<html>
			<style>
				.no-preview {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 1.5em;
					color: #666;
				}
				body {
					margin: 0px;
					margin-top: 40px;
					height: calc(100vh - 40px);
					overflow: hidden;
					color: #ccc;
					font-family: sans-serif;
				}
			</style>
			<body>
				<pre>${code}</pre>
			</body>
		</html>
	`;

	const supported = hasTemplate || isHTML || isJSX || isSVC3;
	viewUpdate({
		type, locked, supported,
		doc,
		docName: currentFileName,
		...event.detail
	});

};

let queuedCommands = [];
const _execCommand = (execTrigger) => ({ command, loading, done }) => {
	const [ op, ...args] = command.split(' ');
	let filename, newName, _id, name, other;
	let after, noDone;

	const manageOps = [
		"addFile", "renameFile", "deleteFile",
		"renameProject"
	];
	const projectOps = [
		"cancel", "create", "read", "update", "delete",
		"manage", "monitor", "persist",
		"fullscreen", "help"
	];

	const ops = [...manageOps, ...projectOps]

	const isManageOp = manageOps
		.map(x => x.toLowerCase())
		.includes(op.toLowerCase());
	const isProjectOp = projectOps
		.map(x => x.toLowerCase())
		.includes(op.toLowerCase());

	if(isManageOp){
		([ filename, newName ] = args);
	}
	if(isProjectOp){
		([ _id, name, ...other] = args);
	}
	let id = Number(_id);

	if(!isManageOp && !isProjectOp){
		done(`${command}:  command not found!\nSupported: ${ops.join(', ')}\n`);
		return;
	}

	if(['help'].includes(op)){
		done(`\nThese might work:\n\n\r   ${
			ops
				.filter(x => x !== "help")
				.join('\n\r   ')
		}\n`);
		return;
	}

	if(['fullscreen'].includes(op)){
		document.documentElement.requestFullscreen();
		return done();
	}

	const body = (id === 0 || !!id)
		? { id }
		: {
			name: name || (document.body.querySelector('#service_name')||{}).value,
			id: id || (document.body.querySelector('#service_id')||{}).value,
			code: (window.Editor||{ getValue: ()=>{}}).getValue()
		}

	if(['read'].includes(op)){
		body.id = id;
		delete body.name;
		delete body.code;
		if((!id && id !== 0) || id === NaN){
			body.id = "*";
			after = ({ result }) => {
				loading('DONE');
				const services = (result.result||[])
					.sort((a, b) => Number(a.id||0)-Number(b.id||0))
					.map(x => `${(x.id||0).toString().padStart(5, ' ')}   ${x.name}`).join('\n')
				loading(`\n
				${services}
				\n`.replace(/\t/g, ''));
				done();
			};
			noDone = () => {}
		}
	}

	if(['create'].includes(op)){
		body.id = Number(id);
		body.name = name;
		body.code = (window.Editor||{ getValue: ()=>{}}).getValue()
	}

	const commandQueueId = Math.random().toString().replace('0.', '');
	queuedCommands.push({
		id: commandQueueId,
		operation: op,
		// MESSY/CONFUSING: done is a default handler, id after is specified then don't use done handler
		done: !after ? () => done('DONE\n') : undefined,
		after
	});

	execTrigger({
		detail: {
			operation: op,
			listener: commandQueueId,
			filename, newName,
			body
		}
	});
};

const handleCommandQueue = (event) => {
	const { detail } = event;
	const { op, id, result, operation, listener } = detail;

	const foundQueueItem = listener && queuedCommands.find(x => x.id === listener);
	if(!foundQueueItem){
		return false;
	}
	queuedCommands = queuedCommands.filter(x => x.id !== listener);
	foundQueueItem.after && foundQueueItem.after({ result: { result } });
	foundQueueItem.done && foundQueueItem.done();
	return true;
}

let firstLoad = true;
const operationDone = ({ viewUpdate, viewReload }) => (event) => {
	handleCommandQueue(event);

	if(firstLoad){
		const savedPreview = (() => {
			let preview = sessionStorage.getItem('preview');
			try {
				preview = JSON.parse(preview);
			} catch(e){}

			return preview;
		})();
		firstLoad = false;
		firstLoadSelect = false;
		if(savedPreview === 'noPreview'){
			viewUpdate({ supported: false, doc: NO_PREVIEW });
			return;
		}

		if(savedPreview){
			currentFile = savedPreview.doc;
			currentFileName = savedPreview.docName;
			backupForLock.currentFile = savedPreview.doc;
			backupForLock.currentFileName = savedPreview.docName;
			viewUpdate({ ...savedPreview, locked, view: currentView });
			return;
		}
	}
	const { detail } = event;
	const { op, id, result, operation } = detail;

	if(op === 'change'){
		!locked && viewReload(detail);
		return;
	}

	// only care about service read with id
	if(op !== "read" || !id){
		return;
	}

	const defaultFile = getDefaultFile(result[0]);
	const defaultFileContents = (result[0].code.find(x => x.name === defaultFile)||{}).code;
	currentFileName = defaultFile || '';
	currentFile = defaultFileContents || '';

	let code;
	code = typeof currentFile === "string"
		? currentFile
		: '';

	const isHTML = code.includes('</html>') && ['htm', 'html'].find(x => { return currentFileName.includes('.'+x)});
	const isSVG = code.includes('</svg>') && ['svg'].find(x => { return currentFileName.includes('.'+x)});
	const isJSX = (currentFileName).includes('jsx');
	const isSVC3 = code.includes('/* svcV3 ');

	const hasTemplate = isSupported({
		name: defaultFile,
		contents: defaultFileContents
	});

	const supported = hasTemplate || isHTML || isJSX || isSVC3;


	viewUpdate({
		supported,
		type: 'operationDone',
		locked,
		doc: (supported || hasTemplate) ? defaultFileContents : NO_PREVIEW,
		docName: defaultFile,
		...event.detail
	});
};

const operations = ({ viewUpdate, getCurrentService }) => (event) => {
	console.log(`terminal event listen heard operation: ${event.detail.operation}`);
	if(event.detail.operation !== "update"){
		return;
	}
	const state = getState();
	const name = getCurrentFile();

	const lastChange = (() => {
		try{
		return Object.entries(state.changedFiles)
			.filter(([key]) => key.split('|')[2] === name)
			.map(([key, value]) => value[value.length-1])[0]
			.code;
		}catch(e){}
	})();
	const getFileFromService = (fileName) => {
		const service = getCurrentService();
		if(!service){
			console.error('Terminal module cannot see current service');
			return;
		}
		const selectedFile = service.code.find(x => x.name === name);
		const { code } = selectedFile || {};
		return code;
	};
	const contents = (lastChange
		? lastChange
		: getFileFromService(name)
	) || '';
	const hasTemplate = isSupported({ name, contents });
	if(locked && currentFileName !== name){
		backupForLock.currentFile = contents;
		backupForLock.currentFileName = name;
		return;
	}

	currentFile = contents;
	currentFileName = name;

	const isHTML = contents.includes('</html>') && ['htm', 'html'].find(x => { return name.includes('.'+x)});
	const isJSX = (name).includes('jsx');
	const isSVC3 = contents.includes('/* svcV3 ');

	const supported = hasTemplate || isHTML || isJSX || isSVC3;
	viewUpdate({
		supported,
		type: 'forceRefreshOnPersist',
		wait: 1000,
		locked,
		doc: contents || NO_PREVIEW,
		docName: name,
		...event.detail
	});
};

const contextMenuHandler = ({ showMenu }={}) => (e) => {
	const terminalDom = document.getElementById('terminal');
	if(!terminalDom.contains(e.target)){ return true; }
	e.preventDefault();

	const listItems = ['TERMINAL', 'seperator', 'todo', 'todo', 'seperator', 'todo', 'todo']
		.map(x => x === 'seperator'
			? 'seperator'
			: { name: x, disabled: true }
		);
	let data;
	try {
		data = {}
	} catch(e) {}

	if(!data){
		console.error('some issue finding data for this context click!')
		return;
	}

	showMenu()({
		x: e.clientX,
		y: e.clientY,
		list: listItems,
		parent: 'Terminal',
		data
	});
	return false;
};

const contextMenuSelectHandler = ({ newFile } = {}) => (e) => {
	const { which, parent, data } = (e.detail || {});
	if(parent !== 'Terminal'){
		//console.log('Terminal ignored a context-select event');
		return;
	}
};


/// -----------------------------------------------------------------------------

function attachEvents({ write, viewUpdate, viewReload, terminalActions }){
	// write('\x1B[2K');
	// write('\rEvent system attached.\n');
	// write(`\n${PROMPT}`);

	const stateBoundViewUpdate = ({ supported, view, type, doc, docName, locked }) => {
		const state = getState();
		let url;
		try{
			url = state.paths
				.find(x => x.name === docName)
				.path
				.replace('/welcome/', '/.welcome/')
				.replace(/^\//, './')
			+ '/::preview::/';
		} catch(e){}

		const viewArgs = { supported, view, type, doc, docName, locked, url };
		if(!locked || type === 'previewSelect') {
			sessionStorage.setItem('preview', JSON.stringify(viewArgs));
		}
		return viewUpdate(viewArgs);
	};

	attach({
		name: 'Terminal',
		eventName: 'viewSelect',
		listener: viewSelectHandler({ viewUpdate: stateBoundViewUpdate })
	});

	attach({
		name: 'Terminal',
		eventName: 'fileSelect',
		listener: fileSelectHandler({
			viewUpdate: stateBoundViewUpdate,
			getCurrentService
		})
	});
	attach({
		name: 'Terminal',
		eventName: 'previewSelect',
		listener: fileSelectHandler({
			viewUpdate: stateBoundViewUpdate,
			getCurrentService
		})
	});
	attach({
		name: 'Terminal',
		eventName: 'fileClose',
		listener: fileSelectHandler({
			viewUpdate: stateBoundViewUpdate,
			getCurrentService
		})
	});
	attach({
		name: 'Terminal',
		eventName: 'termMenuAction',
		listener: terminalActionHandler({
			terminalActions,
			viewUpdate: stateBoundViewUpdate
		})
	});
	attach({
		name: 'Terminal',
		eventName: 'operationDone',
		listener: operationDone({ viewUpdate: stateBoundViewUpdate, viewReload })
	});
	attach({
		name: 'Terminal',
		eventName: 'operations',
		listener: operations({
			viewUpdate: stateBoundViewUpdate,
			getCurrentService
		})
	});
	attach({
		name: 'Terminal',
		eventName: 'contextmenu',
		listener: contextMenuHandler({
			showMenu: () => window.showMenu
		}),
		options: {
			capture: true
		}
	});
	attach({
		name: 'Terminal',
		eventName: 'contextmenu-select',
		listener: contextMenuSelectHandler()
	});

	return (command, callback) => terminalTrigger(write, command, callback);
}

const execTrigger = attachTrigger({
	name: 'Terminal',
	eventName: 'operations',
	type: 'raw'
});
const execCommand = _execCommand(execTrigger);

const connectTrigger = (args) => attachTrigger({ ...args, name: 'Terminal' });

export {
	attachEvents,
	connectTrigger,
	execCommand
};

import { attach, attachTrigger } from '../Listeners.mjs';
import {
	setState, getState,
	getCurrentFile,
	getCurrentService
} from '../state.mjs';


const ChangeHandler = (doc) => {
	const { code, name, id, filename } = doc;
	// TODO: if handler already exists, return it
	const changeThis = (contents, changeObj) => {
		const file = setState({
			name, id, filename,
			code: contents,
			prevCode: code
		});

		const event = new CustomEvent('fileChange', {
			bubbles: true,
			detail: { name, id, file, code: contents }
		});
		document.body.dispatchEvent(event);
	};

	return (editor, changeObj) => {
		//console.log('editor changed');
		//console.log(changeObj);
		changeThis(editor.getValue(), changeObj);
	};
};

// this is really a trigger
const CursorActivityHandler = ({ line, column }) => {
	const event = new CustomEvent('cursorActivity', {
		bubbles: true,
		detail: { line, column }
	});
	document.body.dispatchEvent(event);
}

const contextMenuHandler = ({ showMenu }={}) => (e) => {
	const editorDom = document.querySelector('#editor .CodeMirror');
	if(!editorDom){ return true; }
	if(!editorDom.contains(e.target)){ return true; }
	e.preventDefault();

	const listItems = [
		'Change All Occurences', 'Format Selection', 'Format Document',
		'seperator',
		'Cut', 'Copy', 'Paste',
		'seperator',
		'Command Palette...'
	]
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
		parent: 'Editor',
		data
	});
	return false;
};

const contextMenuSelectHandler = ({ newFile } = {}) => (e) => {
	const { which, parent, data } = (e.detail || {});
	if(parent !== 'Editor'){
		//console.log('Editor ignored a context-select event');
		return;
	}
};

const operationDoneHandler = ({ switchEditor, messageEditor }) => (e) => {
	const { detail } = e;
	const { op, result } = detail;
	if(!detail || !op || ![
		'provider-test',
		'provider-save',
		'provider-add-service'
	].includes(op)){
		return;
	}
	messageEditor({
		op: op + '-done',
		result
	});
};

let firstLoad = true;
const fileSelectHandler = ({ switchEditor }) => async (event) => {
	const { name, next } = event.detail;
	let savedFileName;

	if(firstLoad){
		firstLoad = false;
		savedFileName = sessionStorage.getItem('editorFile');
		if(savedFileName && savedFileName === 'noFileSelected'){
			switchEditor(null, "nothingOpen");
			return;
		}
		if(savedFileName && savedFileName.includes('system::')){
			switchEditor(savedFileName.replace('system::', ''), "systemDoc");
			return;
		}
	}

	if(!savedFileName){
		sessionStorage.setItem('editorFile', next || name);
	}

	const fileName = savedFileName || next || name;
	if(name.includes('system::') || fileName.includes('systemDoc::')){
		switchEditor((savedFileName || name).replace('system::', '').replace('systemDoc::', ''), "systemDoc");
		return;
	}
	const currentService = getCurrentService({ pure: true });
	const fileBody = currentService.code.find(x => x.name === fileName);

	if(!fileBody){
		console.error(`[editor:fileSelect] Current service (${currentService.id}:${currentService.name}) does not contain file: ${fileName}`);
		switchEditor(null, "nothingOpen");
		return;
	}
	switchEditor(fileName, null, fileBody.code);
};

const serviceSwitchListener = ({ switchEditor }) => async (event) => {
	const fileName = getCurrentFile();
	sessionStorage.setItem('editorFile', fileName);
	const currentService = getCurrentService({ pure: true });
	const fileBody = currentService.code.find(x => x.name === fileName);
	if(!fileBody){
		console.error(`[editor:serviceSwitch] Current service (${currentService.id}:${currentService.name}) does not contain file: ${fileName}`);
		switchEditor(null, "nothingOpen");
		return;
	}
	switchEditor(fileName, null, fileBody.code);
};


function attachListener({ switchEditor, messageEditor }){
	const listener = async function (e) {
		if([
			'add-service-folder', 'connect-service-provider', 'open-settings-view', 'open-previous-service'
			].includes(e.type)
		){
			sessionStorage.setItem('editorFile', "systemDoc::" + e.type);
			switchEditor(e.type, "systemDoc");
			return;
		}
		if(e.type === "noServiceSelected"){
			switchEditor(null, "nothingOpen");
			return;
		}
		const { name, next } = e.detail;

		if(e.type === 'fileClose' && next && next.includes('system::')){
			switchEditor(next.replace('system::', ''), "systemDoc");
			return;
		}

		if(e.type === "fileClose" && !next){
			sessionStorage.setItem('editorFile', 'noFileSelected');
			switchEditor(null, "nothingOpen");
			return;
		}
		const currentFile = getCurrentFile();
		if(e.type === "fileClose" && next === currentFile){
			return;
		}

		let savedFileName;
		if(!savedFileName){
			sessionStorage.setItem('editorFile', next || name);
		}
		switchEditor(savedFileName || next || name);
	};

	attach({
		name: 'Editor',
		eventName: 'service-switch-notify',
		listener: serviceSwitchListener({ switchEditor })
	});
	attach({
		name: 'Editor',
		eventName: 'operationDone',
		listener: operationDoneHandler({ switchEditor, messageEditor })
	});
	attach({
		name: 'Editor',
		eventName: 'open-settings-view',
		listener
	});
	attach({
		name: 'Editor',
		eventName: 'add-service-folder',
		listener
	});
	attach({
		name: 'Editor',
		eventName: 'open-previous-service',
		listener
	});
	attach({
		name: 'Editor',
		eventName: 'connect-service-provider',
		listener
	});

	attach({
		name: 'Editor',
		eventName: 'noServiceSelected',
		listener
	});
	attach({
		name: 'Editor',
		eventName: 'fileSelect',
		listener: fileSelectHandler({ switchEditor })
	});
	attach({
		name: 'Editor',
		eventName: 'fileClose',
		listener
	});
	attach({
		name: 'Editor',
		eventName: 'contextmenu',
		listener: contextMenuHandler({
			showMenu: () => window.showMenu
		}),
		options: {
			capture: true
		}
	});
	attach({
		name: 'Editor',
		eventName: 'contextmenu-select',
		listener: contextMenuSelectHandler()
	});
}

const connectTrigger = (args) => attachTrigger({ ...args, name: 'Editor' });

export {
	attachListener, connectTrigger, ChangeHandler, CursorActivityHandler
};

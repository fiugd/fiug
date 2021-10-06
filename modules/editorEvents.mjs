import { attach, attachTrigger } from "./Listeners.mjs";
import {
	setState,
	getState,
	getCurrentFile,
	getCurrentService,
} from "./state.mjs";

const triggers = {
	ui: attachTrigger({
		name: "Editor",
		eventName: "ui",
		type: "raw",
	}),
};

function triggerEvent(type, operation) {
	triggers[type]({
		detail: {
			operation,
			done: () => {},
			body: {},
		},
	});
};

const noFrontSlash = (path) => {
	if(!path) return path;
	if(!path.includes('/')) return path;
	if(path[0] === '/') return path.slice(1);
	return path;
};

const pathNoServiceName = (service, path) => {
	if(!path.includes('/')) return path;
	if(!path.includes(service.name)) return noFrontSlash(path);
	return noFrontSlash(
		noFrontSlash(path).replace(service.name, '')
	);
};

const getFilePath = ({ name="", parent="", path="", next="", nextPath="" }) => {
	const nameWithPathIfPresent = (_path, _name) => _path
		? noFrontSlash(`${_path}/${_name}`)
		: noFrontSlash(_name);
	const fileNameWithPath = next
		? nameWithPathIfPresent(nextPath, next)
		: nameWithPathIfPresent(parent || path, name);
	const service = getCurrentService({ pure: true });
	return pathNoServiceName(service, fileNameWithPath);
};

const ChangeHandler = (doc) => {
	const { code, name, id, filename } = doc;
	const service = getCurrentService({ pure: true });

	// TODO: if handler already exists, return it
	const changeThis = (contents, changeObj) => {
		const file = setState({
			name,
			id,
			filename,
			code: contents,
			prevCode: code,
		});

		//TODO: should be using a trigger for this
		const event = new CustomEvent("fileChange", {
			bubbles: true,
			detail: {
				name, id, filePath: filename, code: contents,
				service: service ? service.name : undefined
			},
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
	const event = new CustomEvent("cursorActivity", {
		bubbles: true,
		detail: { line, column },
	});
	document.body.dispatchEvent(event);
};

const contextMenuHandler = ({ showMenu } = {}) => (e) => {
	const editorDom = document.querySelector("#editor .CodeMirror");
	if (!editorDom) {
		return true;
	}
	if (!editorDom.contains(e.target)) {
		return true;
	}
	e.preventDefault();

	const listItems = [
		//"Change All Occurences",
		//"Format Selection",
		//"Format Document",
		//"seperator",
		"Cut",
		"Copy",
		"Paste",
		"seperator",
		"Command Palette",
	].map((x) => (x === "seperator" ? "seperator" : { name: x, disabled: false }));
	let data;
	try {
		data = {};
	} catch (e) {}

	if (!data) {
		console.error("some issue finding data for this context click!");
		return;
	}

	showMenu()({
		x: e.clientX,
		y: e.clientY,
		list: listItems,
		parent: "Editor",
		data,
	});
	return false;
};

const contextMenuSelectHandler = ({ paste, cutSelected, copySelected } = {}) => (e) => {
	const { which, parent, data } = e.detail || {};
	if (parent !== "Editor") {
		//console.log('Editor ignored a context-select event');
		return;
	}
	const contextCommands = {
		"Cut": cutSelected,
		"Copy": copySelected,
		"Paste": paste,
		"Command Palette": () => triggerEvent("ui", "commandPalette")
	};
	const handler = contextCommands[which];
	if(!handler) return console.error(`Unrecognized context menu command: ${which}`);
	handler({ parent, data });
};

let firstLoad = true;
const fileSelectHandler = ({ switchEditor }) => async (event) => {
	const { name, path, next, nextPath, parent, forceUpdate } = event.detail;
	const { line, column } = event.detail;
	let savedFileName;


	console.log(
		`%c${name}: %ceditor %cfileSelect`,
		'color:#CE9178;',
		'color:#9CDCFE;',
		'color:#DCDCAA;'
	);

	if (firstLoad) {
		firstLoad = false;
		savedFileName = sessionStorage.getItem("editorFile");
		if (savedFileName && savedFileName === "noFileSelected") {
			switchEditor(null, "nothingOpen");
			return;
		}
		if (
			savedFileName &&
			savedFileName.includes("system::") &&
			savedFileName.includes("systemDoc::")
		){
			switchEditor(savedFileName.replace("system::", ""), "systemDoc");
			return;
		}
	}

	if(!name){
		sessionStorage.setItem("editorFile", '');
		switchEditor(null, "nothingOpen");
		return;
	}

	const fileNameWithPath = getFilePath({ name, parent, path, next, nextPath });

	const filePath = savedFileName || fileNameWithPath;

	if (!savedFileName) {
		sessionStorage.setItem("editorFile", filePath);
	}

	if (name.includes("system::") || filePath.includes("systemDoc::")) {
		switchEditor(filePath
				.replace("system::", "")
				.replace("systemDoc::", ""),
			"systemDoc"
		);
		return;
	}

	switchEditor(filePath, null, { line, column, forceUpdate });
};

const operationDoneHandler = ({ switchEditor, messageEditor }) => (e) => {
	const { detail } = e;
	const { op, result } = (detail || {});

	const providerOps = ["provider-test", "provider-save", "provider-add-service"];
	if (providerOps.includes(op)) {
		messageEditor({
			op: op + "-done",
			result,
		});
		return;
	}

	if (op === 'update') {
		const name = result[0]?.state?.selected;
		const fileSelect = fileSelectHandler({ switchEditor });
		fileSelect({ detail: { name, forceUpdate: true } });
		return;
	}
};

const serviceSwitchListener = ({ switchEditor }) => async (event) => {
	const fileName = getCurrentFile();
	sessionStorage.setItem("editorFile", fileName);
	const currentService = getCurrentService({ pure: true });
	const fileBody = currentService.code.find((x) => x.name === fileName);
	if (!fileBody) {
		console.error(
			`[editor:serviceSwitch] Current service (${currentService.id}:${currentService.name}) does not contain file: ${fileName}`
		);
		switchEditor(null, "nothingOpen");
		return;
	}
	switchEditor(fileName, null, fileBody.code);
};

function attachListener({ switchEditor, messageEditor, paste, cutSelected, copySelected }) {
	const listener = async function (e) {
		if (
			[
				"add-service-folder",
				"connect-service-provider",
				"open-settings-view",
				"open-previous-service",
			].includes(e.type)
		) {
			sessionStorage.setItem("editorFile", "systemDoc::" + e.type);
			switchEditor(e.type, "systemDoc");
			return;
		}
		if (e.type === "noServiceSelected") {
			switchEditor(null, "nothingOpen");
			return;
		}
		const { name, parent, path, next, nextPath } = e.detail;

		if (e.type === "fileClose" && next && next.includes("system::")) {
			switchEditor(next.replace("system::", ""), "systemDoc");
			return;
		}

		if (e.type === "fileClose" && !next) {
			sessionStorage.setItem("editorFile", "noFileSelected");
			switchEditor(null, "nothingOpen");
			return;
		}
		const currentFile = getCurrentFile();
		if (e.type === "fileClose" && next === currentFile) {
			return;
		}

		const filePath = getFilePath({ name, parent, path, next, nextPath });

		let savedFileName;
		if (!savedFileName && filePath) {
			sessionStorage.setItem("editorFile", filePath);
		}
		// should include path here if needed
		switchEditor(savedFileName || filePath);
	};

	attach({
		name: "Editor",
		eventName: "service-switch-notify",
		listener: serviceSwitchListener({ switchEditor }),
	});
	attach({
		name: "Editor",
		eventName: "operationDone",
		listener: operationDoneHandler({ switchEditor, messageEditor }),
	});
	attach({
		name: "Editor",
		eventName: "open-settings-view",
		listener,
	});
	attach({
		name: "Editor",
		eventName: "add-service-folder",
		listener,
	});
	attach({
		name: "Editor",
		eventName: "open-previous-service",
		listener,
	});
	attach({
		name: "Editor",
		eventName: "connect-service-provider",
		listener,
	});

	attach({
		name: "Editor",
		eventName: "noServiceSelected",
		listener,
	});
	attach({
		name: "Editor",
		eventName: "fileSelect",
		listener: fileSelectHandler({ switchEditor }),
	});
	attach({
		name: "Editor",
		eventName: "fileClose",
		listener,
	});
	attach({
		name: "Editor",
		eventName: "contextmenu",
		listener: contextMenuHandler({
			showMenu: () => window.showMenu,
		}),
		options: {
			capture: true,
		},
	});
	attach({
		name: "Editor",
		eventName: "contextmenu-select",
		listener: contextMenuSelectHandler({ paste, cutSelected, copySelected }),
	});
}

const connectTrigger = (args) => attachTrigger({ ...args, name: "Editor" });

export { attachListener, connectTrigger, ChangeHandler, CursorActivityHandler };

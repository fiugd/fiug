import { attach } from "./Listeners.mjs";
import { codemirrorModeFromFileType } from "/shared/modules/utilities.mjs";
import ext from "/shared/icons/seti/ext.json.mjs";
import { getDefaultFile } from "./state.mjs";

let statusBarDom;

function getFileType(fileName = "") {
	let type = "default";
	const extension = ((fileName.match(/\.[0-9a-z]+$/i) || [])[0] || "").replace(
		/^\./,
		""
	);
	if (fileName.toLowerCase() === "config") {
		type = "config";
	}
	if (ext[extension]) {
		type = ext[extension];
	}
	if (extension === "bat") {
		type = "bat";
	}
	if (extension === "scratch") {
		type = "markdown";
	}
	if (extension === "bugs") {
		type = "markdown";
	}
	if (extension === "htm" || extension === "html") {
		type = {
			name: "htmlmixed",
			mimeType: "application/x-ejs",
		};
	}
	return type;
}

function friendlyModeName(type, mode){
	if(type.includes && type.includes('sharp')) return type.replace('sharp', '#');
	if('cpp' === type) return 'C++';
	if('ocaml' === type) return { name: 'OCaml' };
	if(['bat', 'cpp', 'lisp', 'raku', 'zig'].includes(type)) return type;
	if(mode.includes && mode.includes('text/x-')) return type;
	return mode;
}

// EVENTS -------------------------------------------------------------

let firstRun = true;
const operationDone = ({
	setLineNumber,
	setColNumber,
	setTabSize,
	setDocType,
}) => (event) => {
	if (firstRun) {
		firstRun = false;
		const savedMode = (() => {
			try {
				return JSON.parse(sessionStorage.getItem("statusbar")).mode;
			} catch (e) {}
		})();
		if (savedMode) {
			setDocType(savedMode);
			setLineNumber(1);
			setColNumber(1);
			return;
		}
	}
	const { detail } = event;
	const { op, id, result } = detail;
	// only care about service read with id
	if (op !== "read" || !id) {
		return;
	}
	//have to figure out what file gets loaded by default (boo!)
	const defaultFile = getDefaultFile(result[0]);
	const fileType = getFileType(defaultFile);
	const mode = codemirrorModeFromFileType(fileType);
	setDocType(friendlyModeName(fileType,mode));
	sessionStorage.setItem(
		"statusbar",
		JSON.stringify({
			mode,
			line: 1,
			col: 1,
		})
	);
	setLineNumber(1);
	setColNumber(1);
};

const fileSelect = ({
	setLineNumber,
	setColNumber,
	setTabSize,
	setDocType,
}) => (event) => {
	const { detail } = event;
	const { name } = detail;
	if (!name) {
		return;
	}
	const fileType = getFileType(name);
	const mode = codemirrorModeFromFileType(fileType);
	setDocType(friendlyModeName(fileType,mode));
	if (!firstRun) {
		sessionStorage.setItem(
			"statusbar",
			JSON.stringify({
				mode,
				line: 1,
				col: 1,
			})
		);
	}
	setLineNumber(1);
	setColNumber(1);
};

const fileClose = ({ setLineNumber, setColNumber, setTabSize, setDocType }) => (
	event
) => {
	//console.log('status bar listen for fileClose');
};

const fileChange = ({
	setLineNumber,
	setColNumber,
	setTabSize,
	setDocType,
}) => (event) => {
	//console.log('status bar listen for fileChange');
};

const cursorActivity = ({ setLineNumber, setColNumber }) => (event) => {
	const { detail } = event;
	const { line, column } = detail;
	setLineNumber(line);
	setColNumber(column);
};

const listeners = {
	operationDone,
	fileSelect,
	fileClose,
	fileChange,
	cursorActivity,
};

function attachListeners({
	setLineNumber,
	setColNumber,
	setTabSize,
	setDocType,
}) {
	Object.keys(listeners).forEach((key) => {
		attach({
			name: "Status Bar",
			eventName: key,
			listener: listeners[key]({
				setLineNumber,
				setColNumber,
				setTabSize,
				setDocType,
			}),
		});
	});
}

export { attachListeners };

import { attach, trigger, attachTrigger } from "./Listeners.mjs";

import { isSupported } from "./Templates.mjs";

import { getState, getCurrentFile, getCurrentService } from "./state.mjs";
import { getDefaultFile } from "./state.mjs";
import { getCurrentFolder } from "./state.mjs";

const clone = x => {
	try{ return JSON.parse(JSON.stringify(x)); }
	catch(e){ return x; }
}
const stripLeadSlash = (path="") => path[0] === '/'
	? path.slice(1)
	: path;
const withFullPaths = (detail) => {
	const newDetail = clone(detail);
	const { name, path, parent, next, nextPath } = newDetail;
	const fullName = (() => {
		if(!(path||parent)) return name;
		if((path||parent).includes(name)) return path || parent;
		if(name.includes((path || parent)+'/')) return name;
		return `${path||parent}/${name}`;
	})();
	const fullNext = (() => {
		if(!(nextPath)) return next;
		if((nextPath).includes(next)) return nextPath;
		if(next.includes(nextPath+'/')) return next;
		return `${nextPath}/${next}`;
	})();
	if(fullName) newDetail.name = fullName;
	if(fullNext) newDetail.next = fullNext;
	newDetail.name && (newDetail.name = stripLeadSlash(newDetail.name));
	newDetail.next && (newDetail.next = stripLeadSlash(newDetail.next));
	return newDetail;
};
const pathNoServiceName = (service, path) => {
	if(!path.includes('/')) return path;
	if(!path.includes(service.name)) return stripLeadSlash(path);
	return stripLeadSlash(
		stripLeadSlash(path).replace(service.name, '')
	);
};
let locked;
let currentFile;
let currentFileName;
let currentView = localStorage.getItem("rightPaneSelected");

let backupForLock = {
	currentFile: "",
	currentFileName: "",
};

const PROMPT = "\x1B[38;5;14m \r∑ \x1B[0m";

const NO_PREVIEW = `
<!-- NO_PREVIEW -->
<!DOCTYPE html>
<html class="dark-enabled">
	<head>
		<meta charset="UTF-8">
		<link rel="stylesheet" href="/colors.css" />
	</head>
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
			<div class="no-preview" title="No preview!">⠝⠕ ⠏⠗⠑⠧⠊⠑⠺</div>
			</pre>
	</body>
</html>
`;

const commands = [
	{
		name: "showCurrentFolder",
		about: "Shows the path of the current folder",
		alias: ["pwd"],
		required: [],
		args: [],
	},
	{
		name: "changeCurrentFolder",
		about: "Switches the current folder",
		alias: ["cd"],
		required: ["folderPath"],
		args: ["folderPath"],
	},
	{
		name: "addFolder",
		about: "Makes a folder in the current folder or parent of choice",
		alias: ["md", "mkdir"],
		required: ["folderName"],
		args: ["folderName", "parent"],
	},
	{
		name: "readFolder",
		about: "Lists the contents of the current folder or parent of choice",
		alias: ["ls", "dir"],
		required: [],
		args: ["parent"],
	},
	{
		name: "deleteFolder",
		about:
			"Delete a folder. Use a folder in current folder or include path in name.",
		alias: ["df"],
		required: ["folderName"],
		args: ["folderName"],
	},
	{
		name: "renameFolder",
		about:
			"Rename folder. Use a folder in current folder or include path in name.",
		alias: ["rf"],
		required: ["oldName", "newName"],
		args: ["oldName", "newName"],
	},
	{
		name: "moveFolder",
		about: "Moves folder to destination",
		alias: ["mv"],
		required: ["target", "destination"],
		args: ["target", "destination"],
	},
	{
		name: "moveFile",
		about: "Moves file to destination",
		alias: ["mf"],
		required: ["target", "destination"],
		args: ["target", "destination"],
	},
];

//NOTE: these are mostly already handled in ../Terminal.mjs
//TODO: migrate to this pattern
const manageOps = ["addFile", "renameFile", "deleteFile", "renameProject"];
const projectOps = [
	"cancel",
	"create",
	"read",
	"update",
	"delete",
	"manage",
	"monitor",
	"persist",
	"fullscreen",
	"help",
];
const eventsHandledAlready = [...manageOps, ...projectOps];

const terminalTrigger = (write, command, callback) => {
	let preventDefault = true;
	const [op, ...args] = command.split(" ");

	if (["help", "?"].includes(op)) {
		preventDefault = true;
		write(
			`\n\nThese might work:\n\n\r   ${[
				...eventsHandledAlready,
				...commands.map((x) => [...x.alias, x.name].join(" | ")),
			]
				.filter((x) => x !== "help")
				.join("\n\r   ")}\n`
		);
		callback && callback();
		return preventDefault;
	}

	if (eventsHandledAlready.includes(op)) {
		preventDefault = false;
		return preventDefault;
	}

	const currentCommand = commands.find((x) => {
		const opMatchesName = op.toLowerCase() === x.name.toLowerCase();
		const opMatchesAlias =
			x.alias.length > 0 &&
			x.alias.map((a) => a.toLowerCase()).includes(op.toLowerCase());
		return opMatchesName || opMatchesAlias;
	});

	if (!currentCommand) {
		write(`\nCommand not found: ${op}\n`);
		callback && callback();
		return preventDefault;
	}

	if (args[0] === "?") {
		preventDefault = true;
		write(`\n\nABOUT: ${currentCommand.about}`);
		write(
			`\nUSAGE: ( ${[...currentCommand.alias, currentCommand.name].join(
				" | "
			)} ) ${currentCommand.args.join(" ") || "{no args}"}`
		);
		write(`\nREQUIRED: ${currentCommand.required.join(", ") || "none"}`);
		write(`\n`);
		callback && callback();
		return preventDefault;
	}

	const eventArgs = {};
	for (var i = 0, len = currentCommand.args.length; i < len; i++) {
		const currentCommandArg = currentCommand.args[i];
		eventArgs[currentCommandArg] = args[i] || null;
	}
	const missingArgs = currentCommand.required
		.map((x) => (eventArgs[x] ? null : x))
		.filter((x) => !!x);

	if (missingArgs.length > 0) {
		preventDefault = true;
		write(`\nMissing arguments: ${missingArgs.join(", ")}\n`);
		callback && callback();
		return preventDefault;
	}

	const cb = (err, res) => {
		if (err) {
			write(`\nERROR: ${err}\n`);
			callback && callback();
			return;
		}
		write(`\n${Array.isArray(res) ? res.join("\n") : res || "Finished."}\n`);
		callback && callback();
	};

	trigger({
		type: "operations",
		detail: { operation: currentCommand.name },
		params: { ...eventArgs, ...{ callback: cb } },
		source: "Terminal",
	});
	return preventDefault;
};





let firstLoad = true;


const contextMenuHandler = ({ showMenu } = {}) => (e) => {
	const terminalDom = document.getElementById("terminal");
	if (!terminalDom.contains(e.target)) {
		return true;
	}
	e.preventDefault();

	const listItems = [
		"TERMINAL",
		"seperator",
		"todo",
		"todo",
		"seperator",
		"todo",
		"todo",
	].map((x) => (x === "seperator" ? "seperator" : { name: x, disabled: true }));
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
		parent: "Terminal",
		data,
	});
	return false;
};

const contextMenuSelectHandler = ({ newFile } = {}) => (e) => {
	const { which, parent, data } = e.detail || {};
	if (parent !== "Terminal") {
		//console.log('Terminal ignored a context-select event');
		return;
	}
};

/// -----------------------------------------------------------------------------

function attachEvents({ write, viewUpdate, viewReload, terminalActions }) {
	attach({
		name: "Terminal",
		eventName: "contextmenu",
		listener: contextMenuHandler({
			showMenu: () => window.showMenu,
		}),
		options: {
			capture: true,
		},
	});
	attach({
		name: "Terminal",
		eventName: "contextmenu-select",
		listener: contextMenuSelectHandler(),
	});

	return (command, callback) => terminalTrigger(write, command, callback);
}

const execTrigger = attachTrigger({
	name: "Terminal",
	eventName: "operations",
	type: "raw",
});

const execCommand = () => {};

const connectTrigger = (args) => attachTrigger({ ...args, name: "Terminal" });

export { attachEvents, connectTrigger, execCommand };

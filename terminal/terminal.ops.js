import { chalk, jsonColors,getCurrentService } from './terminal.utils.js';
import { pather } from '/shared/modules/utilities.mjs';

const state = {
	cwd: undefined,
	service: undefined
};

const mapFileArg = (args) => {
	const { cwd, file } = args
	const target = pather(cwd, file);
	const filename = target.split('/').pop();
	const parent = target.split('/').slice(0,-1).join('/');
	return { ...args, filename, parent };
};
const mapSourceDestArg = (args) => {
	const { cwd, source, dest } = args
	const src = pather(cwd, source);
	const tgt = pather(cwd, dest);
	return { ...args, src, tgt };
};

state.service = await getCurrentService();
state.cwd = state.service + '/';

export const switchService = (service) => {
	state.cwd = service.name;
	state.service = service.name;
};

const commands = [
	{
		name: 'PrintWorkingDir',
		keyword: "pwd",
		description: "Print current working directory.",
		event: "showCurrentFolder",
		mapResponse: (folder) => {
			if(folder.length > 2 && folder.startsWith('~/')){
				state.cwd = folder.slice(2);
				state.service = folder.slice(2);
				return folder.slice(2);
			}
			if(folder.endsWith('/')) return folder.slice(0,-1);
			if(folder.endsWith('/~')) return folder.slice(0,-2);
			if(folder.endsWith('/.')) return folder.slice(0,-2);
			if(folder.endsWith('/..')) return folder.slice(0,-3);
			return folder;
		},
	},
	{
		name: 'ChangeDir',
		keyword: "cd",
		description: "Change current working directory to DIRECTORY (home by default).",
		event: "changeCurrentFolder",
		usage: '[DIRECTORY]',
		args: [
			{ name: 'directory', type: String, defaultOption: true, defaultValue: '~' }
		],
		map: ({ directory }) => ({ folderPath: directory }),
		mapResponse: () => '',
	},
	{
		name: 'MakeDir',
		keyword: "md",
		description: "Create a DIRECTORY if not existing (recursively).",
		event: "addFolder",
		usage: '[DIRECTORY]',
		args: [
			{ name: 'directory', type: String, defaultOption: true, required: true }
		],
		map: ({ directory, cwd }) => {
			const folder = pather(cwd, directory);
			return {
				folderName: folder.split('/').pop(),
				parent: folder.split('/').slice(0,-1).join('/')
			}
		},
		mapResponse: () => '',
	},
	// {
	// 	name: 'List',
	// 	keyword: "ls",
	// 	description: "List contents of a DIRECTORY (current by default).",
	// 	event: "readFolder",
	// 	usage: '[-al] [DIRECTORY]',
	// 	args: [
	// 		{ name: 'directory', type: String, defaultOption: true, defaultValue: '.' },
	// 		{ name: 'all', type: Boolean, alias: 'a' },
	// 		{ name: 'long', type: Boolean, alias: 'l' },
	// 	],
	// 	map: ({ directory, cwd }) => ({ directory: directory || cwd }),
	// 	mapResponse: (res) => {
	// 		return res
	// 			.filter(x => x)
	// 			.sort((a,b) => {
	// 				const bothFolders = a.includes('/') && b.includes('/');
	// 				const bothFiles = !a.includes('/') && !b.includes('/');
	// 				if(bothFolders || bothFiles){
	// 					return a.toLowerCase().localeCompare(b.toLowerCase());
	// 				}
	// 				if(a.includes('/') && !b.includes('/')) return -1;
	// 				if(!a.includes('/') && b.includes('/')) return 1;
	// 			})
	// 			.join('\n') + '\n'
	// 	}
	// },
	{
		name: 'Remove',
		keyword: "rm",
		description: "Remove FILE, or DIRECTORY with --recursive (-r) option.",
		event: ["deleteFolder","deleteFile"],
		eventMap: (args={}) => {
			const {src} = args;
			if(!src) return 'deleteFile';
			if(src.endsWith('/')) return 'deleteFolder';
			if(src.includes('.')) return 'deleteFile';
			return 'deleteFolder';
		},
		usage: '[-rf] [FILE|DIRECTORY]',
		args: [
			{ name: 'file', type: String, defaultOption: true, required: true },
			{ name: 'recursive', type: Boolean, alias: 'r' },
			{ name: 'force', type: Boolean, alias: 'f' },
		],
		map: mapFileArg,
		mapResponse: (res) => '',
	},
	{
		name: 'Move',
		keyword: "mv",
		description: 'Move SOURCE to DESTINATION.',
		event: ["moveFolder", "moveFile"],
		eventMap: (args={}) => {
			const {src} = args;
			if(!src) return 'moveFile';
			if(src.endsWith('/')) return 'moveFolder';
			if(src.includes('.')) return 'moveFile';
			return 'moveFolder';
		},
		usage: '[SOURCE] [DESTINATION]',
		args: [
			{ name: 'source', type: String, required: true },
			{ name: 'dest', type: Boolean, required: true },
		],
		argsGet: ([ source, dest ]) => ({ source, dest }),
		map: mapSourceDestArg,
		mapResponse: (res) => '',
	},
	{
		name: 'Copy',
		keyword: 'cp',
		listenerKeys: [],
		description: 'Copy from [SOURCE] to [DESTINATION]',
		event: ["copyFolder", "copyFile"],
		eventMap: (args={}) => {
			const {src} = args;
			if(!src) return 'copyFile';
			if(src.endsWith('/')) return 'copyFolder';
			if(src.includes('.')) return 'copyFile';
			return 'copyFolder';
		},
		usage: '[SOURCE] [DESTINATION]',
		args: [
			{ name: 'source', type: String, required: true },
			{ name: 'dest', type: Boolean, required: true },
		],
		argsGet: ([ source, dest ]) => ({ source, dest }),
		map: mapSourceDestArg,
		mapResponse: (res) => '',
	},
	{
		name: 'Touch',
		keyword: "touch",
		description: `Official usage: updates timestamp of FILE. Used here: creates a FILE; does not affect timestamp of FILE.`,
		event: "addFile",
		usage: '[FILE]',
		args: [
			{ name: 'file', type: String, defaultOption: true, required: true }
		],
		map: mapFileArg,
		mapResponse: (res) => ''
	},
/*
	{
		name: 'Concat',
		keyword: "cat",
		description: 'Concatenate(print) FILE contents to standard output.',
		event: "readFile",
		usage: '[FILE]',
		args: [
			{ name: 'file', type: String, defaultOption: true, required: true }
		],
		map: (args) => {
			const { filename: file } = mapFileArg(args);
			return { file };
		}
	},
*/
];

const getStatefulHandlers = (state, { changeFolder }) => ({
	showCurrentFolder: {
		response: () => state.cwd,
		update: (res, service) => {
			state.cwd = res;
			state.service = service;
		}
	},
	changeCurrentFolder: {
		response: ({ folderPath }) => changeFolder(state, folderPath)
	}
});

const link = url => chalk.hex('#9cdcfe')(url);

const commandHelp = (command) => `

${chalk.bold('Usage:')} ${command.keyword} ${chalk.hex('#BBB')(command.usage||'')}

${command.description || 'MISSING DESCRIPTION: bug someone to add a description.'}

  -?, --????   ${chalk.hex('#BBB')('TODO')}        TODO: add args description
  -h, --help   ${/* SPACER                */''}    Prints this guide

${chalk.bold('Examples:')}
  TODO: add examples

${chalk.italic(`
Online help: ${link('https://github.com/crosshj/fiug/wiki')}
Report bugs: ${link('https://github.com/crosshj/fiug/issues')}
`)}
`;

const notImplemented = ({ keyword }) => chalk.hex('#ccc')(`\n${keyword}: not implemented\n`);

const readFile = async (args) => {
	const { file, cwd } = args;
	let response, error;
	try {
		response = await (await fetch(`/${cwd}/${file}`)).text();
	} catch(e) {
		error = JSON.stringify(e, null, 2);
	}
	return { response, error };
};

const manualCommands = { readFile };

const changeFolder = (state, folderPath) => {
	if(!state.cwd || !state.service) return;
	let newCwd = state.service.trim()+ '/' + pather(
		state.cwd.replace(state.service.trim(), ''),
		folderPath
	);
	state.cwd = newCwd;
	return newCwd;
};

const withState = (() => {
	const stateFnWrapper = (func) => async (args) => {
		let handler;
		try {
			const handlers = getStatefulHandlers(state, { changeFolder });
			handler = handlers[args.triggerEvent.detail.operation];
			const response = handler.response(args.triggerEvent.detail);
			if(response) return { response };
		} catch(e){}

		const { error, response, service } = await func(args)

		try {
			response.trim() && handler.update(response.trim(), service);
		} catch(e){}

		return { error, response };
	};

	return stateFnWrapper;
})();

async function invokeRaw(args={}, thisCommand){
	thisCommand = thisCommand || this;
	const { event, eventMap, invokeRaw, map: argMapper, comm, mapResponse } = thisCommand;
	const { response: cwd } = event[0] !== 'showCurrentFolder'
		? (await invokeRaw.bind({
				event: ['showCurrentFolder'],
				map: argMapper,
				comm
			})())
		: {};
	const argsPlusExtra = { ...args, cwd };
	const mappedArgs = argMapper
		? argMapper(argsPlusExtra)
		: argsPlusExtra;

	if(Object.keys(manualCommands).includes(event[0])){
		let { error, response } = await manualCommands[event[0]](mappedArgs);
		return { error, response };
	}

	let { error, response } = await withState(comm.execute)({
		triggerEvent: {
			type: 'operations',
			detail: {
				source: 'TerminalWIP',
				operation: eventMap
					? eventMap(mappedArgs)
					: event[0] || event,
				...mappedArgs
			},
		}
	});
	if(response && response.trim){
		response = response.trim();
	}
	if(response && mapResponse){
		response = mapResponse(response);
	}

	try {
		error = response.detail.result.error;
		error.stack = error.stack
			.split('\n')
			.map(x => x.trim());
	} catch(e){}

	return { error, response };
}

async function invoke(args, done){
	this.term.write('\n');
	const { error, response } = await this.invokeRaw(args, this);
	if(error){
		this.term.write(jsonColors({ error })+'\n');
		return done();
	}
	if(response){
		this.term.write(response + '\n');
	}
	//this.term.write(notImplemented(this));
	done();
};

async function exit(){}

const Operation = (config, term, comm) => ({
	...config,
	term,
	comm,
	invoke,
	invokeRaw,
	exit,
	listenerKeys: [],
	args: config.args || [],
	event: Array.isArray(config.event) ? config.event : [config.event],
	required: (config.args || [])
		.filter(x => x.required)
		.map(x => x.name),
	help: () => commandHelp(config),
});

const GetOps = (term, comm) => {
	const opmap = config => Operation(config, term, comm)
	return commands.map(opmap);
};

export default GetOps;
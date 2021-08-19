import packageJson from "/package.json" assert { type: "json" };
import { chalk } from './terminal.utils.js';

import commandLineArgs from 'https://cdn.skypack.dev/command-line-args';
// also consider: https://www.npmjs.com/package/minimist
// https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Shells

const getSupportedCommands = (commands) => {
	const supported = {
		help: commands.help,
		cls: commands.clearTerminal,
		clear: commands.clearTerminal,
	};
	commands.ops.forEach(op => {
		supported[op.keyword] = op;
	});
	return supported;
};

const SYSTEM_NAME = `${packageJson.name} v${packageJson.version}`;

const missingArg = (op, missing) => `
${op}: missing argument${missing.length?'s':''}: ${missing.join(', ')}
Try '${op} --help' for more information.
`;

export const parseArgs = (model, argString) => {
	if(!model?.args) return argString;
	if(argString.includes('-h') || argString.includes('-h')) return { help: true };
	const options = {
		argv: argString.trim().split(' '),
		partial: true
	};
	const result = typeof model.argsGet === 'function'
		? model.argsGet(options.argv)
		: commandLineArgs(model.args, options);

	if(model.args && typeof model.argsGet !== 'function'){
		model.args
			.filter(x => x.default)
			.forEach(x => {
				result[x.name] = typeof result[x.name] !== 'undefined'
					? result[x.name]
					: x.default
			});
	}

	const resultProps = Object.keys(result).sort();
	(model?.args || []).forEach(x => {
		if(!x.defaultValue || result[x.name]) return;
		result[x.name] = x.defaultValue;
	});
	if(!model?.required?.length) return result;

	const argsEqual = resultProps.join('') === model.required.sort().join('');
	const missing = model.required
		.filter(x => !resultProps.includes(x) || !result[x]);
	if(missing.length) return { missing };

	return result;
}

//const writePromptIndicator = () => term.write(chalk.white.bold('∑ '));
const writePromptIndicator = (term) => term.write(chalk.white.bold('$ '));

const writeSysName = async (term, ops) => {
	//TODO
	return term.write(chalk.rgb(60, 180, 190)(SYSTEM_NAME));
};

const writeCurrentFolder = async (term, ops) => {
	const pwd = ops.find(x => x.keyword === 'pwd');
	const { response: cwd } = await pwd.invokeRaw();
	return term.write(chalk.hex('#00FF00')(cwd));
};

const prompt = async (term, ops) => {
	await writeSysName(term, ops);
	term.write(' ');
	await writeCurrentFolder(term, ops);
	term.write(' \r\n');
	writePromptIndicator(term);
};

export default ({ term, ops, setBuffer, getBuffer, setRunning, getRunning, comm }) => {
	const showPrompt = async () => await prompt(term, ops);
	const writeLine = term.write.bind(term);
	const eraseLine = () => {
		//TODO: delete backwards (and up for overflowed lines) until reaching prompt
		term.write('\x1B[2K\r');
	}
	const eraseToPrompt = () => eraseLine() & writePromptIndicator(term);
	const setLine = (replace) => eraseToPrompt() & term.write(replace);

	const history = ops.find(x => x.keyword === "history");
	history.writeLine = writeLine; //NOTE: hate to do this..
	history.setLine = setLine; //NOTE: hate to do this..

	const clearTerminal = (e) => term.clear() & eraseLine();
	const help = (e) => term.write('\n'+
		Object.keys(supportedCommands)
			.filter(x=> !['help', 'cls', 'clear'].includes(x))
			.sort().join('\n') + '\n'
	);
	// TODO: ask if the user meant some other command & provide link to run it
	const unrecognizedCommand = (keyword) => (e) =>
		term.write(`\n${keyword}: command not found\n`)
	const supportedCommands = getSupportedCommands({ help, clearTerminal, ops });

	const enterCommand = async (e) => {
		if(getRunning()) return term.write('\n');
		history.updateBuffer();
		const buffer = getBuffer();
		if(!buffer) return await showPrompt();

		const [,keyword, args] = new RegExp(`^(.+?)(?:\\s|$)(.*)$`)
			.exec(buffer) || [];
		const command = supportedCommands[keyword] || unrecognizedCommand(keyword);

		const done = async () => {
			setRunning(undefined);
			term.write('\n');
			await showPrompt();
		};

		const standardHandler = (e) => {
			setRunning(command);
			const parsedArgs = parseArgs(command, args);
			if(parsedArgs.help){
				const helpCommand = command.help
					? command.help
					: () => {};
				term.write(helpCommand() || '\nHelp unavailable.\n');
				done();
				return;
			}
			if(parsedArgs.missing){
				term.write(missingArg(command.keyword, parsedArgs.missing));
				done();
				return;
			}
			command.invoke(parseArgs(command, args), done);
		};

		const handler = command.invoke ? standardHandler : command;

		history.push(buffer);
		setBuffer('');
		handler && handler();
		if(command.invoke) return;
		done()
	};

	const backspaceCommand = (e) => {
		history.updateBuffer();

		// Do not delete the prompt
		if (term._core.buffer.x <= 2) return;

		setBuffer(getBuffer().slice(0, -1));
		term.write("\b \b");
	};

	const copyKillCommand = async (e) => {
		try {
			const clip = term.getSelection();
			const running = getRunning();
			if(running && !clip){
				await running.exit();
				setRunning(undefined);
				term.write("\n");
				await showPrompt();
				return;
			}
			await navigator.clipboard.writeText((clip+'').trim());
		} catch(e){}
	};

	const pasteCommand = async (e) => {
		try {
			history.updateBuffer();
			const clip = (await navigator.clipboard.readText()).split('\n')[0].trim();
			setBuffer(`${getBuffer()}${clip}`);
			eraseToPrompt();
			term.write(getBuffer());
		} catch(e){}
	};
	
	const selectAll = async (e) => {
		setTimeout(term.selectAll.bind(term), 1);
	};
	
	return {
		clearTerminal, showPrompt, eraseToPrompt, writeLine, selectAll,
		enterCommand, backspaceCommand, copyKillCommand, pasteCommand,
		history
	}
};

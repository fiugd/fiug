import comm from './terminal.comm.js';
import { Git } from './terminal.git.js';
import { History } from './terminal.history.js';
import Keys from './terminal.keys.js';
import Lib from './terminal.lib.js';
import GetOps from './terminal.ops.js';
import GetDynamicOps from './terminal.ops.dynamic.js';
import { chalk } from './terminal.utils.js';
import { Watch } from './terminal.watch.js';
import Xterm from './terminal.xterm.js';

let ops;
const term = Xterm();

//TODO: state
let running = undefined;
let charBuffer = [];
const setBuffer = (str) => { charBuffer = str.split('') };
const getBuffer = () => charBuffer.join('');
const getRunning = () => running;
const setRunning = (target) => running = target;

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

const callWithRetry = async (fn, depth = 0, max) => {
	try {
		return await fn();
	} catch(e) {
		if (depth > 7) throw e;
		await delay(1.3 ** depth * 1000);
		return callWithRetry(fn, depth + 1);
	}
}

setTimeout(async () => {
	try {
		const history = new History({ chalk, setBuffer, getBuffer });
		const coreOps = GetOps(term, comm);
		const pwdCommand = coreOps.find(x => x.keyword === 'pwd') || {};
		const getCwd = async () => {
			const { response: cwd } = await pwdCommand.invokeRaw();
			if(!cwd) throw new Error('cwd not found');
			return cwd;
		};
		const dynamic = await GetDynamicOps(term, comm, getCwd);
		ops = [
			...coreOps,
			history, new Watch(term, comm), Git(term, comm),
			...dynamic,
		];
		const lib = Lib({
			term, ops, setBuffer, getBuffer, setRunning, getRunning, comm
		});
		const { bubbleHandler, keyHandler } = Keys({ lib, getBuffer, setBuffer });
		term._attachHandlers({ bubbleHandler, keyHandler });

		await callWithRetry(getCwd);

		term.write('\n');
		//term.focus();
		lib.showPrompt();
	} catch(e){
		term.write('\n$ ');
	}
}, 1);

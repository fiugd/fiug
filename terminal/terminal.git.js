/*

https://medium.com/@mehulgala77/github-fundamentals-clone-fetch-push-pull-fork-16d79bb16b79
https://googlechrome.github.io/samples/service-worker/post-message/

*/
import GetOps from './terminal.ops.js';
import Diff from 'https://cdn.skypack.dev/diff-lines';
import { chalk, jsonColors } from './terminal.utils.js';

const getStored = (varName) => {
	const stored = sessionStorage.getItem(varName);
	if(stored) return stored;
	const prompted = prompt(varName);
	prompted && sessionStorage.setItem(varName, prompted);
	return prompted;
};
const fetchJSON = (url, opts) => fetch(url, opts).then(x => x.json());
const postJSON = (url, opts={}, body) => fetchJSON(url, {
	method: 'POST',
	body: JSON.stringify(body),
	...opts
});

const link = url => chalk.hex('#9cdcfe')(url)
const [ bold, hex, italic ] = [
	chalk.bold.bind(chalk),
	chalk.hex.bind(chalk),
	chalk.italic.bind(chalk),
];
const commandHelp = (command) => { return `

${bold('Usage:')} ${command.keyword} ${hex('#BBB')(command.usage||'')}

These are common Git COMMANDs which are supported in some form here:

${hex('#BBB')('start a working area')}
   ${bold('clone')}      Copy a remote repository to local

${hex('#BBB')('examine the history and state')}
   ${bold('diff')}       Show local changes per file
   ${bold('status')}     List all files changed locally

${hex('#BBB')('grow, mark and tweak your common history')}
   ${bold('branch')}     List, create, or delete branches
   ${bold('commit')}     Record changes to the repository

${hex('#BBB')('collaborate')}
   ${bold('pull')}       Fetch recent changes from remote
   ${bold('push')}       Update remote with local commits

${italic(`
Online help: ${link('https://github.com/crosshj/fiug/wiki')}
Report bugs: ${link('https://github.com/crosshj/fiug/issues')}
`)}
`; };
const diffPretty = (diff) => {
	const colors = {
		invisible: '#555',
		deleted: '#c96d71',
		added: '#b1e26d',
		special: '#38b8bf',
		normal: '#ddd',
	};
	return diff.split('\n').map((x,i,all) => {
		const invisibles = (str) => str
			.replace(/ /g, chalk.hex(colors.invisible)('·'))
			.replace(/\t/g, chalk.hex(colors.invisible)(' → '));
		const fmtLine = (str) => `${str[0]}  ${invisibles(str).slice(1)}`

		if(x[0] === '-') return chalk.hex(colors.deleted)(fmtLine(x).trim()+'\n');
		if(x[0] === '+') return chalk.hex(colors.added)(fmtLine(x).trim()+'\n');
		if(x.slice(0,2) === '@@') return chalk.hex(colors.special)('...\n');
		return `${chalk.hex(colors.normal)(x)}\n`;
	}).join('');
};
const config = {
	keyword: "git",
	description: "git is version control.",
	event: "",
	usage: '[COMMAND] [args]',
	args: [
		{ name: 'command', type: String, defaultOption: true }
	],
	map: ({ }) => ({ })
};

const _getChanges = async ({ ops }) => {
	const pwdCommand = ops.find(x => x.keyword === 'pwd');
	const { response: cwd = '' } = await pwdCommand.invokeRaw();
	const changesUrl = "/service/change";
	const changesResponse = await fetchJSON(changesUrl
		+"?cwd=" + cwd
	);
	return changesResponse;
};

const notImplemented = (command) => chalk.hex('#ccc')(`\ngit ${command}: not implemented\n`);
const unrecognizedCommand = (command) => `\n${command}: command not found\n`

const diff = async ({ ops }, args) => {
	const { _unknown: files } = args;
	const { changes } = await _getChanges({ ops });

	let filesToShow = changes;
	if(files && Array.isArray(files)){
		filesToShow = [];
		for(let i=0, len=files.length; i<len; i++){
			const file = files[i];
			const foundChange = changes.find(x => x.fileName.includes(file));
			const alreadyAdded = foundChange && filesToShow.find(x => x.fileName === foundChange.fileName)
			if(alreadyAdded) continue;
			filesToShow.push(foundChange);
		}
	}
	const getDiff = (t1, t2) => Diff(t1||'', t2||'', { n_surrounding: 0 });
	return filesToShow
		.filter(x => x && getDiff(x.original, x.value).trim())
		.map(x => {
			return `\n${x.fileName}\n\n${getDiff(x.original, x.value)}\n`
		})
		.join('\n');
};
const status = async ({ ops }) => {
	const changesResponse = await _getChanges({ ops });
	const { changes } = changesResponse;
	if(!changes.length){
		return '\n   no changes\n';
	}
	const changeRender = (c) => {
		const { deleteFile, fileName } = c;
		const changeType = deleteFile
			? 'deleted'
			: 'modified';
		return  '   ' + chalk.bold(`${changeType}: `) + fileName;
	};
	return '\n' + changes.map(changeRender).join('\n') + '\n';
};
const commit = async ({ ops }, args) => {
	const { _unknown } = args;
	const message = _unknown.join(' ')
		.match(/(?:"[^"]*"|^[^"]*$)/)[0]
		.replace(/"/g, "");
	const pwdCommand = ops.find(x => x.keyword === 'pwd');
	const { response: cwd = '' } = await pwdCommand.invokeRaw();
	const commitUrl = '/service/commit';
	const auth = getStored('Github Personal Access Token');
	const { commitResponse } = await postJSON(commitUrl, null, {
		cwd, message, auth
	});
	return chalk.hex('#ccc')('\nCommit SHA: ') + commitResponse + '\n';
};

const clone = async ({}, args) => {
	// do what settings does when it clones a github repo
	return notImplemented('clone');
}
const branch = async ({ term }) => notImplemented('branch');
const push = async ({ term }) => notImplemented('push');
const pull = async ({ term }) => notImplemented('pull');

const commands = { clone, diff, status, branch, commit, push, pull };

async function invokeRaw(_this, args){
	const { command } = args;
	const thisCommand = commands[command];
	if(!thisCommand){
		return { error: unrecognizedCommand(`git ${command}`) }
	}
	return await thisCommand(_this, args);
}
async function invoke(args, done){
	const { term, invokeRaw } = this;
	const { command } = args;
	if(!command){
		term.write(this.help());
		done();
		return
	}
	term.write('\n');
	const response = await invokeRaw(this, args);
	if(response?.error) {
		term.write(response.error);
		return done();
	}
	if(command === 'diff' && response){
		term.write(diffPretty(response));
		return done();
	}
	if(response){
		term.write(response);
	}
	done();
};

async function exit(){}

const Git = (term, comm) => ({
	...config,
	ops: GetOps(term, comm),
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

export { Git };
/*

https://medium.com/@mehulgala77/github-fundamentals-clone-fetch-push-pull-fork-16d79bb16b79
https://wyag.thb.lt/ - write yourself a git
https://medium.com/@urna.hybesis/git-from-scratch-5-steps-guide-8943f19c62b

https://googlechrome.github.io/samples/service-worker/post-message/

*/
import ini from 'https://cdn.skypack.dev/ini';
import Diff from 'https://cdn.skypack.dev/diff-lines';

import GetOps, { switchService } from './terminal.ops.js';
import {
	chalk, jsonColors,
	getCurrentService, addFile, addFolder,
	Spinner
} from './terminal.utils.js';

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
   ${bold('init')}       Create an empty repository

${hex('#BBB')('work on the current change')}
   ${bold('add')}        Add files to commit
   ${bold('rm')}         Remove files from commit

${hex('#BBB')('examine the history and state')}
   ${bold('diff')}       Show local changes per file
   ${bold('status')}     List all files changed locally
   ${bold('log')}        Show commit logs

${hex('#BBB')('grow, mark, and tweak your common history')}
   ${bold('branch')}     List, create, or delete branches
   ${bold('commit')}     Record changes to the repository

${hex('#BBB')('collaborate')}
   ${bold('pull')}       Fetch recent changes from remote
   ${bold('push')}       Update remote with local commits

${hex('#BBB')('other')}
   ${bold('config')}     Get and set repository or global options

${hex('#BBB')('totally non-standard utils')}
   ${bold('list')}       List all cloned repositories
   ${bold('open')}       Load a repository for editing
   ${bold('close')}      Unload a repository

${italic(`
Online help: ${link('https://github.com/crosshj/fiug/wiki')}
Report bugs: ${link('https://github.com/crosshj/fiug/issues')}
`)}
`; };

/*
start a working area (see also: git help tutorial)
   clone      Clone a repository into a new directory
   init       Create an empty Git repository or reinitialize an existing one

work on the current change (see also: git help everyday)
   add        Add file contents to the index
   mv         Move or rename a file, a directory, or a symlink
   reset      Reset current HEAD to the specified state
   rm         Remove files from the working tree and from the index

examine the history and state (see also: git help revisions)
   bisect     Use binary search to find the commit that introduced a bug
   grep       Print lines matching a pattern
   log        Show commit logs
   show       Show various types of objects
   status     Show the working tree status

grow, mark and tweak your common history
   branch     List, create, or delete branches
   checkout   Switch branches or restore working tree files
   commit     Record changes to the repository
   diff       Show changes between commits, commit and working tree, etc
   merge      Join two or more development histories together
   rebase     Reapply commits on top of another base tip
   tag        Create, list, delete or verify a tag object signed with GPG

collaborate (see also: git help workflows)
   fetch      Download objects and refs from another repository
   pull       Fetch from and integrate with another repository or a local branch
   push       Update remote refs along with associated objects

*/

const unknownArgsHelper = (args) => {
	const keyed = {};
	const anon = [];
	for(var i=0, len=args.length; i<len; i++){
		const thisArg = args[i];
		const nextArg = args[i+1];
		if(thisArg.startsWith('--')){
			keyed[thisArg.replace(/^--/, '')] = nextArg || null;
			i++;
			continue;
		}
		if(thisArg.startsWith('-')){
			keyed[thisArg.replace(/^-/, '')] = nextArg || null;
			i++;
			continue;
		}
		anon.push(thisArg);
	}
	return { keyed, anon };
};

const diffPretty = (diff) => {
	const colors = {
		invisible: '#555',
		deleted: '#c96d71',
		added: '#b1e26d',
		special: '#38b8bf',
		normal: '#ddd',
	};
	return (diff||'').split('\n').map((x,i,all) => {
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

const opConfig = {
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

class GitConfig {
	constructor(service, current, comm){
		this.root = location.origin;
		this.service = service;
		this.current = current;
		this.comm = comm;
		this.path = '.git/config';
		this.url = `${this.root}/${this.service.name}/${this.path}`;
	}
	async update(prop, value){
		const {service, current, comm} = this;
		await this.read();
		const propSplit = (prop||'').split('.');
		let cursor = this.config;
		for(var i=0, len=propSplit.length; i<len; i++){
			cursor[propSplit[i]] = i === len-1
				? value
				: cursor[propSplit[i]] || {};
			cursor = cursor[propSplit[i]];
		}
		const { message, result } = await this.save();

		if(current.id === service.id){
			const triggerEvent = {
				type: 'operationDone',
				detail: {
					op: 'update',
					id: this.service.id+'',
					result,
					source: 'Terminal'
				}
			};
			comm.execute({ triggerEvent });
		}

		return message;
	}
	async read(){
		let configText = await fetch(this.url).then(x=> x.ok ? x.text() : undefined);
		configText = (configText||'').split('\n').map(x=>x.trim()).filter(x=>x).join('\n');
		this.config = ini.parse(configText);
	}
	async readProp(prop){
		if(!this.config) await this.read();
		let cursor = this.config;
		const propSplit = (prop||'').split('.');
		if(!propSplit[0].trim()) return cursor;

		for(var i=0, len=propSplit.length; i<len; i++){
			if(!cursor) break;
			cursor = cursor[propSplit[i]];
		}
		return cursor;
	}
	async save(){
		const { config, path } = this;
		const source = ini.encode(config, { whitespace: true });
		const service = this.service;
		console.log(JSON.stringify(config, null, 2)+'\n\n');
		console.log(source);

		let message = `saved config to ${this.url}`;
		let result;
		try {
			const {error:addFolderError} = await addFolder(`.git`, service);
			if(addFolderError){
				message = addFolderError;
				return;
			}
			const {error:addFileError, result: addFileResult} = await addFile(path, source, service);
			if(addFileError) message = addFileError;
			if(addFileResult) result = addFileResult;
		} catch(e){
			console.log(e);
			message = 'error: ' + e.message;
		}
		return { message, result };
	}	
}

const getConfig = async (prop) => {
	const current = await getCurrentService("all");
	const localConfig = new GitConfig(current);
	const globalConfig = new GitConfig({id: 0, name: '~'});
	return {
		local: await localConfig.readProp(prop),
		global: await globalConfig.readProp(prop)
	};
}

const config = async ({ term, comm }, args) => {
	const { _unknown=[] } = args;
	const { keyed, anon } = unknownArgsHelper(_unknown);
	const { local, global } = keyed;

	if(local === undefined && global === undefined){
		return chalk.hex('#ccc')(`
Usage:
  git config [--local or --global] <optional value-pattern>

Examples:
  git config --global user.name "Jimmy Fiug"
  git config --local

`);
	}

	const prop = local || global;
	const value = anon.join(' ').replace(/['"]/g, '').trim();
	const current = await getCurrentService("all");
	const service = local ? current : { name: '~', id: 0 };
	const config = new GitConfig(service, current, comm);

	if(!value){
		const propVal = await config.readProp(prop);
		const out = typeof propVal === 'object'
			? ini.encode(propVal, { whitespace: true }).trim()
			: propVal;
		return `${out}\n`;
	}

	const message = await config.update(prop, value)

	return message + '\n';
};

const diff = async ({ ops }, args) => {
	const { _unknown: files } = args;
	let { changes } = await _getChanges({ ops });
	changes = changes.filter(x => !x.fileName.includes('/.git/'));

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
			if(x.deleteFile)
				return `\n${x.fileName}\n\n${chalk.red('DELETED')}\n`
			return `\n${x.fileName}\n\n${getDiff(x.original, x.value)}\n`
		})
		.join('\n');
};

const status = async ({ ops }) => {
	const changesResponse = await _getChanges({ ops });
	let { changes } = changesResponse;
	changes = changes.filter(x => !x.fileName.includes('/.git/'));
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


const commitUsage = chalk.hex('#ccc')(`
Usage:
  git commit -m <commit message>

Example:
  git commit -m "made some changes to service"

`);
const commit = async ({ ops, term }, args) => {
	const { _unknown } = args;
	const message = (_unknown||[]).join(' ')
		.match(/(?:"[^"]*"|^[^"]*$)/)[0]
		.replace(/"/g, "");

	if(!message.trim())return commitUsage;

	const pwdCommand = ops.find(x => x.keyword === 'pwd');
	const { response: cwd = '' } = await pwdCommand.invokeRaw();
	const commitUrl = '/service/commit';
	
	const authConfig = await getConfig('user.token');
	const token = authConfig.local || authConfig.global;
	const auth = token || getStored('Github Personal Access Token');

	const spin = new Spinner({
		stdOut: term.write.bind(term),
		message: chalk.hex('#ccc')(`Pushing commit`),
		color: '#0FF',
		doneColor: '#0FF',
		doneMsg: 'DONE'
	});
	const commitRequest = postJSON(commitUrl, null, { cwd, message, auth });
	spin.until(commitRequest);

	const shortenShaUrl = (url) => {
		const newHashLength = 6;
		try {
			return [
				...url.split('/').slice(0,-1),
				url.split('/').pop().slice(0, newHashLength)
			].join('/');
		}catch(e){
			console.log(e);
			return url;
		}
	}

	const { commitResponse } = await commitRequest;
	if(commitResponse && commitResponse.error){
		return `ERROR: ${commitResponse.error}`;
	}
	return '\n' +
		chalk.hex('#ccc')('Commit Info: ') +
		chalk.hex('#9cdcfe')(shortenShaUrl(commitResponse)) +
		'\n';
};

const cloneUsage = chalk.hex('#ccc')(`
Usage:
  git clone [-b or --branch] <branch> <repository>

Example:
  git clone -b main crosshj/fiug-welcome

`);
const clone = async ({term}, args) => {
	//git clone --branch <branchname> <remote-repo-url>
	//git clone -b <branchname> <remote-repo-url>
	const { _unknown=[] } = args;
	const { keyed, anon } = unknownArgsHelper(_unknown);
	const branch = keyed.b || keyed.branch;
	const [repo] = anon;
	const cloneUrl = '/service/create/provider';
	
	if(!repo) return cloneUsage;

	const authConfig = await getConfig('user.token');
	const token = authConfig.local || authConfig.global;
	const auth = token || getStored('Github Personal Access Token');
	const bodyObj = {
		providerType:"github-provider",
		operation:"provider-add-service",
		auth, repo, branch,
	};
	const body = JSON.stringify(bodyObj);
	const method = 'POST';

	const cloneMessage = chalk.hex('#ccc')(
		`Cloning ${bodyObj.repo}${
			bodyObj.branch
			? `, ${bodyObj.branch} branch`
			: ''
		}`
	);
	const spin = new Spinner({
		stdOut: term.write.bind(term),
		message: cloneMessage,
		color: '#0FF',
		doneColor: '#0FF',
		doneMsg: 'DONE'
	});
	const cloneRequest = fetch(cloneUrl, { body, method }).then(x=>x.json());
	spin.until(cloneRequest);

	const { result } = await cloneRequest;
	if(result && result.error){
		return `ERROR: ${result.error}\n`;
	}
	return `\n`;
};

const list = async ({ term }, args) => {
	const { result: allServices } = await fetchJSON('/service/read');
	return '\n' + allServices
		.map(x=>x.name + ` (${x.id})`)
		.filter(x => x !== '~ (0)')
		.join('\n') + '\n';
};
const open = async ({ term, comm }, args) => {
	const { _unknown=[] } = args;
	const { keyed, anon } = unknownArgsHelper(_unknown);
	const param = anon.join('');
	const { result: allServices } = await fetchJSON('/service/read');
	const found = allServices.find(x => (x.id+'') === param || x.name === param);
	if(!found) return `could not find repo; unable to open\n`;

	localStorage.setItem('lastService',found.id);
	const { result } = await fetchJSON('/service/read/'+found.id);
	const triggerEvent = {
		type: 'operationDone',
		detail: {
			op: 'update',
			id: found.id+'',
			result,
			source: 'Terminal'
		}
	};
	comm.execute({ triggerEvent });
	switchService(found);
	return '\n';
};
const close = async ({ term, comm, ops }, args) => {
	localStorage.setItem('lastService', '0');
	const { result } = await fetchJSON('/service/read/0');
	const triggerEvent = {
		type: 'operationDone',
		detail: {
			op: 'update',
			id: '0',
			result,
			source: 'Terminal'
		}
	};
	comm.execute({ triggerEvent });
	switchService({ id: 0, name: '~' });
	return '\n';
};

const branch = async ({ term }) => notImplemented('branch');
const push = async ({ term }) => notImplemented('push');
const pull = async ({ term }) => notImplemented('pull');
const init = async ({ term }) => notImplemented('init');
const add = async ({ term }) => notImplemented('add');
const rm = async ({ term }) => notImplemented('rm');
const log = async ({ term }) => notImplemented('log');

const commands = {
	diff,  status, commit, clone, config, list, open, close,
	branch, push, pull, init, add, rm, log //not implemented
};

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
	...opConfig,
	ops: GetOps(term, comm),
	term,
	comm,
	invoke,
	invokeRaw,
	exit,
	listenerKeys: [],
	args: opConfig.args || [],
	event: Array.isArray(opConfig.event) ? opConfig.event : [opConfig.event],
	required: (opConfig.args || [])
		.filter(x => x.required)
		.map(x => x.name),
	help: () => commandHelp(opConfig),
});

export { Git };

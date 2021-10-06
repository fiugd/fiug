import { readDir } from '../terminal.utils.js';

const operation = async (args) => {
	const { cwd, directory, all, long } = args;
	const dir = (new RegExp('^../').test(directory) || new RegExp('^./').test(directory))
		? new URL(`${cwd}/${directory}`, 'file://fake').href
			.replace('file://fake/', '')
		: directory === '.'
			? cwd
			: directory;
	const { response: results } = await readDir(null, dir, cwd);
	return results.map(x => x.name).join('\n'); 
};

export default class List {
	name = 'List';
	keyword = 'ls';
	type = 'plain';
	listenerKeys = [];
	description = 'List contents of a DIRECTORY (current by default).';
	usage = '[-al] [DIRECTORY]';
	args = [
		{ name: 'directory', type: String, defaultOption: true, defaultValue: '.' },
		{ name: 'all', type: Boolean, alias: 'a' },
		{ name: 'long', type: Boolean, alias: 'l' },
	];

	constructor(){
		this.operation = operation;
		this.help = () => usage;
	}
}; 

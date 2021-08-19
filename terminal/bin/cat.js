const description = 'Concatenate(print) FILE contents to standard output.';
const args = [{
	name: 'file', type: String, defaultOption: true, required: true
}];

const operation = async (args) => {
	const { file, cwd } = args;
	const fileContents = await (await fetch(`${location.origin}/${cwd}/${file}`)).text()
	const lastChar = fileContents[fileContents.length-1]
	return lastChar === '\n'
		? fileContents.slice(0, -1)
		: fileContents;
};

export default class Node {
	name = 'Concat';
	keyword = 'cat';
	listenerKeys = [];
	description = description;
	usage = '[FILE]';
	args = args;

	constructor(){
		this.operation = operation;
		this.help = () => usage;
	}
};

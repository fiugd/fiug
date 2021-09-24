const alotOfEvents = [
	'ui', 'fileClose', 'fileSelect', 'operations', 'operationDone', 'contextmenu',
	'contextmenu-select'
];
const history = [
	'watch -e fileSelect',
	`watch -e ${alotOfEvents.join(' ')}`,
	`watch`,
	`git branch`,
	`git pull`,
	`git push`,
	`git clone`,
	`git status`,
	`git diff terminal.git.mjs`,
	`git commit -m "commit me"`,
	`cat terminal/terminal.comm.js`,
	`node --watch terminal/.example.js`,
	`preview zip_project.html`,
	`node --watch test/service-worker.services.test.js`,
	`node service-worker/_build.js`,
	`node shared/vendor/codemirror/update.js`,
	`git config --global user.email johndoe@example.com`,
	`git config --local user.name "John Doe"`,
];

const usage = (chalk) => {
	const link = url => chalk.hex('#9cdcfe')(url)
	return `

${chalk.bold('Usage:')} history ${chalk.hex('#BBB')('')}

Prints history of entered commands.

  -h, --help   ${/* SPACER                */''}    Prints this guide

${chalk.italic(`
Online help: ${link('https://github.com/crosshj/fiug/wiki')}
Report bugs: ${link('https://github.com/crosshj/fiug/issues')}
`)}
	`;
}


export class History {
	keyword = 'history';
	current = -1;
	history = history;
	args = [];
	setLine = undefined;
	writeLine = undefined;

	constructor({ chalk, getBuffer, setBuffer }){
		this.chalk = chalk;
		this.getBuffer = getBuffer;
		this.setBuffer = setBuffer;

		this.help = () => usage(chalk);

		this.next = this.next.bind(this);
		this.prev = this.prev.bind(this);
		this.invoke = this.invoke.bind(this);
		this.push = this.push.bind(this);
		this.updateBuffer = this.updateBuffer.bind(this);
		this.updateLine = this.updateLine.bind(this);
	}

	get currentItem(){
		return [...this.history].reverse()[this.current];
	}

	next(){
		if(this.current < 0) return
		this.current--;
		this.updateLine();
	}

	prev(){
		if(this.current === this.history.length -1) return;
		this.current++;
		this.updateLine();
	}

	invoke(args, done){
		const { chalk, history, writeLine } = this;
		writeLine('\n');
		const EXTRA_PADDING = 3;
		const padding = Math.floor(history.length/10) + EXTRA_PADDING;
		history.slice(0,-1)
			.forEach((h,i) => {
				writeLine(`${chalk.dim((i+1+'').padStart(padding, ' '))}  ${h}\n`)
			})
		done();
	}

	push(command){
		this.history.push(command);
		this.current = -1;
	}

	updateBuffer(){
		const { currentItem, setBuffer } = this;
		if(!currentItem) return;
		setBuffer(currentItem);
		this.current = -1;
	}

	updateLine(){
		const { current, history, setLine, getBuffer } = this;
		if(current === -1) return setLine(getBuffer());
		setLine([...history].reverse()[current]);
	}
}
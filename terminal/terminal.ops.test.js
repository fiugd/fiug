//show-preview

/*

I'm thinking there may be a way to guess if script is not active in worker - will try that

*/

/*
import GetDynamicOps from './terminal.ops.dynamic.js';
import {parseArgs} from './terminal.lib.js';

const term = {
	write: console.log
};
const comm = () => {};
const getCwd = () => 'crosshj/fiug-beta/terminal';
const logger = console.log;
const done = () => console.log('finished');

GetDynamicOps(term, comm, getCwd)
	.then(ops => {
		const thisOp = ops[1];
		const args = parseArgs(thisOp, '.example.js');
		console.log(thisOp)
		thisOp.invoke(args, done);
	});
*/

import comm from './terminal.comm.js';

/*
document.body.innerHTML += `
	<style>body{ margin: 4em 2em; color: #777; font: 20px sans-serif;}</style>
`;


const write = (text) => {
	if(!text || !text.trim()) return;
	const logEl = document.createElement('div');
	logEl.innerHTML = text;
	logEl.className = 'log';
	document.body.append(logEl);
}
*/
/*
(async () => {
	const baseUrl = location.origin+ '/crosshj/fiug-beta/terminal';
	const { default: GetDynamicOps, readDir } = await import(`${baseUrl}/terminal.ops.dynamic.js`);

	const { parseArgs } = await import(`${baseUrl}/terminal.lib.js`);

	const term = { write };

	const getCwd = () => 'crosshj/fiug-beta/terminal';
	const ops = await GetDynamicOps(term, comm, getCwd);

	const logger = console.log;
	const done = () => console.log('finished'); 

	const thisOp = ops.find(x=>x.keyword==="preview");
	const args = parseArgs(thisOp, '../.welcome/1ncubate/zip_project.html');

	await thisOp.invoke(args, done);
})();
*/

/*
(async () => {
	const baseUrl = location.origin+ '/crosshj/fiug-beta/terminal';
	const { default: GetDynamicOps, readDir } = await import(`${baseUrl}/terminal.ops.dynamic.js`);

	const { parseArgs } = await import(`${baseUrl}/terminal.lib.js`);

	const term = { write };

	const getCwd = () => 'crosshj/fiug-beta/terminal';
	const ops = await GetDynamicOps(term, comm, getCwd);

	const logger = console.log;
	const done = () => console.log('finished'); 

	const thisOp = ops.find(x=>x.keyword==="ls");
	const args = parseArgs(thisOp, '-l -a ../.NOTES/releases');

	await thisOp.invoke(args, done); 
})();
*/ 

(async () => {
	const baseUrl = location.origin+ '/crosshj/fiug-beta/terminal';
	const { default: GetOps, readDir } = await import(`${baseUrl}/terminal.ops.js`);

	const { parseArgs } = await import(`${baseUrl}/terminal.lib.js`);

	const term = { write: console.log };

	const getCwd = () => 'crosshj/fiug-beta/terminal';
	const ops = await GetOps(term, comm, getCwd); 

	const logger = console.log;
	const done = () => console.log('finished'); 

	const thisOp = ops.find(x=>x.keyword==="mv");

	const args = parseArgs(thisOp, '.NOTES/foo/foo.wow .NOTES');

	await thisOp.invoke(args, done);
})();
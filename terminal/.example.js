//show-preview
//import { sleep } from './.example_import.js';

if(typeof document !== "undefined"){
	document.body.innerHTML += `
		<style>body{ margin: 2em;color: #777; font: 20px sans-serif; }</style>
		<div>This file is used for testing with "node" keyword.</div>
		<div>See console out.</div>
	`;
}

const these = [
	['one', 5000],
	['two', 1000],
	['three', 300],
];

const delay = (time) => new Promise((resolve)=> setTimeout(() => resolve('done'), time) );

const AsyncTask = async (item) => {
	const [name, time] = item;
	console.log(`start execution ${name}`);
	//throw new Error('error test');
	//sleep(time); //<< will block other threads from starting
	await delay(time); //will allow worker to exit since it's a microtask... sigh
	console.log(`end execution ${name}`);
	await delay(1);
}

const mapTasks = () => these.map(async (item) => await AsyncTask(item));

//console.log('start');
(async () => {
	//await Promise.allSettled(mapTasks());
	//await AsyncTask(these[0]);
	//console.log('done\n');
	
	for(var i=0, len=10; i<len; i++){
		//await delay(600);
		console.log(`${i} - test this`);
	}
})();

import _ from 'lodash';
import { sleep } from './.example_import2.js';

console.log('\n\nlodash test');
console.log('----------------')
console.log('lodash version: ' + _.VERSION);
let words = [
	'sky', 'wood', 'forest', 'falcon',
	'pear', 'ocean', 'universe'
];
console.log(`First element: ${_.first(words)}`);
console.log(`Last element: ${_.last(words)}`);
console.log('----------------\n\n\n');

const these = [
	['one', 3000],
	['two', 2000],
	['three', 1000],
];

const AsyncTask = async (item) => {
	const [name, time] = item;
	console.log(`start: ${name}`);
	await sleep(time);
	console.log(`end: ${name}`);
};

console.log('\nstart');

const asyncTasks = these.map(AsyncTask);
await Promise.all(asyncTasks);

console.log('done');
//throw new Error('woops');

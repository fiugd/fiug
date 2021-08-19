import testlib from "./testlib.js";
const { describe, it, start: TestStart, expect, logJSON, safe } = testlib;

describe('test examples', () => {
	it('example of passing test', (assert) => {
		const add = (one,two) => one+two;
		assert.equal(add(1, 1), 2);
	});
	it.skip('example of skipped test', (assert) => {
	});
	it('example of failing test', (assert) => {
		const add = (one,two) => one+two;
		assert.equal(add(1, 1), 4, `expected ${add(1,1)} to equal 4`);
	});
	it.todo('example of todo test', (assert) => {
	});
});

//TestStart();

let finish;
const donePromise = new Promise((resolve) => { finish = resolve; });
TestStart(finish);
await donePromise;

import testlib from "./testlib.js";
const { describe, it, start: TestStart, expect, logJSON, safe } = testlib;

// tricking ugly module pattern into an import
self.module = { exports: {} };
await import(cwd+'/../modules/service-worker.utils.js');
const utils = module.exports;

describe('utils', ({ beforeEach }) => {
	let tree;
	let code;

	beforeEach(() => {
		tree = {
			one: {
				two: {
					three: {}
				},
				four: {
					'example.jpg': {}
				}
			}
		};
		code = [{
			path: "./one/four/example.jpg"
		},{
			path: "./one/orphan.jpg"
		}];
	});

	it('should flatten a tree', (assert) => {
		const { flattenTree } = utils;
		const treeFlat = flattenTree(tree);
		expect(treeFlat.length, 'length of flat tree').toEqual(2);
	});
	it('should add keep files', async (assert) => {
		const { keepHelper } = utils;
		const allKeptFiles = keepHelper(tree, code);
		const orphanKept = allKeptFiles.find(x => x.includes('orphan'));
		const exampleKept = allKeptFiles.find(x => x.includes('example'));
		const keepCreated = allKeptFiles.find(x => x === '/one/two/three/.keep');
		expect(orphanKept, 'kept orphan file').toEqual(undefined);
		expect(exampleKept, 'kept example file').toBeTruthy();
		expect(keepCreated, 'keep file created').toBeTruthy();
	});
});

if(self instanceof WorkerGlobalScope){
	let finish;
	const donePromise = new Promise((resolve) => { finish = resolve; });
	TestStart(finish);
	await donePromise;
}

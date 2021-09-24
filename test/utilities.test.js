import testlib from "./testlib.js";
const { describe, it, start: TestStart, expect, logJSON, safe } = testlib;
import { pather } from '../shared/modules/utilities.mjs';

describe('path helper', () => {

	it('handles ./ , clean cwd', (assert) => {
		const cwd = '/one/two/three/';
		const path = './foo/bar';
		const opts = {};
		const result = pather(null, path);
		expect(result).toEqual('foo/bar');
	});

	it('handles ./ , clean cwd', (assert) => {
		const cwd = '/one/two/three/';
		const path = './';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/three');
	});

	it('handles foo , child at parent', (assert) => {
		const cwd = 'one/two/three';
		const path = 'foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/three/foo');
	});

	it('handles ./foo , child at parent', (assert) => {
		const cwd = 'one/two/three';
		const path = 'foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/three/foo');
	});

	it('handles ~/foo , child at root', (assert) => {
		const cwd = 'one/two/three';
		const path = '~/foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('foo');
	});

	it('handles /foo , child at root', (assert) => {
		const cwd = 'one/two/three';
		const path = '/foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('foo');
	});
	
	it('handles foo//bar , extraneous slash', (assert) => {
		const cwd = 'one/two';
		const path = 'foo//bar';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/foo/bar');
	});

	it('handles ../../foo , navigate up parents', (assert) => {
		const cwd = 'one/two/three';
		const path = '../../foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/foo');
	});

	it('handles ./.././foo , extraneous ./', (assert) => {
		const cwd = 'one/two/three';
		const path = './.././foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/foo');
	});

	it('handles ../../../../../foo , up past root', (assert) => {
		const cwd = 'one/two/three';
		const path = '../../../../../foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('foo');
	});

	it('handles cwd with trailing slash', (assert) => {
		const cwd = 'one/two/three/';
		const path = 'foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/three/foo');
	});

	it('handles cwd with leading slash', (assert) => {
		const cwd = '/one/two';
		const path = 'foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/foo');
	});

	it('handles cwd with extraneous slash', (assert) => {
		const cwd = 'one//two';
		const path = 'foo';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('one/two/foo');
	});

	it('handles cwd blank', (assert) => {
		const cwd = '';
		const path = 'foo/bar';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('foo/bar');
	});

	it('handles cwd is /', (assert) => {
		const cwd = '/';
		const path = 'foo/bar';
		const opts = {};
		const result = pather(cwd, path);
		expect(result).toEqual('foo/bar');
	});

});

if(self instanceof WorkerGlobalScope){
	let finish;
	const donePromise = new Promise((resolve) => { finish = resolve; });
	TestStart(finish);
	await donePromise;
}

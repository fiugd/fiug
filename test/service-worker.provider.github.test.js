import testlib from "./testlib.js";
const { describe, it, start: TestStart, expect, logJSON, safe } = testlib;

import { ServiceMock } from "./mocks/services.js";
import { GithubMock } from "./mocks/github.js";

// tricking ugly module pattern into an import
self.module = { exports: {} };
await import(cwd+'/../modules/service-worker.provider.github.js');
const { GithubProvider } = module.exports;
await import(cwd+'/../modules/service-worker.utils.js');
const utils = module.exports;

let fetchContents;
let app;
let mock = ServiceMock({ utils });
let githubMock = GithubMock();
const { storage } = mock.deps;

describe('commits', ({ beforeEach }) => {
	let provider, fetchMock;

	beforeEach(async () => {
		githubMock.reset();
		fetchMock = githubMock.fetchJSON;
		provider = await new GithubProvider({ storage, fetchContents, app, utils });
		provider.fetchJSON = fetchMock;
	});

	it('golden path commit', async (assert) => {
		const payload = {
			message: 'commit message',
			auth: 'commit auth',
			cwd: 'fake/source'
		};
		const params = {};
		mock.changes["fake/source/toDelete.xxx"] = {
			type: 'update',
			value: 'file to delete from source - WITH CHANGES!!',
			service: mock.services[3002]
		};

		const results = await provider.createCommit(payload, params);
		expect(JSON.parse(results).commitResponse, 'commit url').toEqual('https://fake.commit.url');
	});

	it('should not commit /.git/ folder', async (assert) => {
		const payload = {
			message: 'commit message',
			auth: 'commit auth',
			cwd: 'fake/source'
		};
		const params = {};
		mock.services[3002].tree.fake['.git'] = {
			config: {}
		};
		mock.changes["fake/.git/config"] = {
			type: 'update',
			value: 'this file should not be checked in',
			service: mock.services[3002]
		};
		const results = await provider.createCommit(payload, params);
		expect(JSON.parse(results).commitResponse.error, 'commit error').toBeTruthy();
	});

	it('should not commit /.git/ folder, but should commit others', async (assert) => {
		const payload = {
			message: 'commit message',
			auth: 'commit auth',
			cwd: 'fake/source'
		};
		const params = {};
		mock.services[3002].tree.fake['.git'] = {
			config: {}
		};
		mock.changes["fake/.git/config"] = {
			type: 'update',
			value: 'this file should not be checked in',
			service: mock.services[3002]
		};
		mock.changes["fake/source/addedWithCommit"] = {
			type: 'update',
			value: 'this file should be checked in',
			service: mock.services[3002]
		};
		const results = await provider.createCommit(payload, params);
		expect(JSON.parse(results).commitResponse, 'commit url').toEqual('https://fake.commit.url');
	});
});

if(self instanceof WorkerGlobalScope){
	let finish;
	const donePromise = new Promise((resolve) => { finish = resolve; });
	TestStart(finish);
	await donePromise;
}

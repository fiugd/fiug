import testlib from "./testlib.js";
import { ServiceMock } from "./mocks/services.js";
const { describe, it, start: TestStart, expect, logJSON, safe } = testlib;

// tricking ugly module pattern into an import
self.module = { exports: {} };
await import(cwd+'/../modules/service-worker.services.js');
const { ServicesManager } = module.exports;
await import(cwd+'/../modules/service-worker.utils.js');
const utils = module.exports;

let mock;
let manager;

describe('update service', ({ beforeEach }) => {
	const newServiceName = 'fake/foo';

	beforeEach(() => {
		mock = ServiceMock({ utils });
		manager = new ServicesManager(mock.deps);
		mock.setService(3002, (svc) => {
			svc.tree[newServiceName] = svc.tree.fake;
			delete svc.tree.fake;
			svc.name = newServiceName;
			svc.repo = newServiceName;
			return svc;
		});
		mock.setFiles((files) => {
			Object.entries(files)
				.forEach(([k,v]) => {
					delete files[k];
					files[k.replace('./fake/', `${newServiceName}/`)] = v;
				});
		});
	});

	it('should add file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'addFile',
				target: 'target/addedFile.xxx',
				source: 'this file was added'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}
		assert.custom(errors);
		const addFileChange = mock.changes[`${newServiceName}/target/addedFile.xxx`] || {};
		expect(!addFileChange.deleteFile).toBeTruthy();

		const resultShowsFileAdded = safe(() => result.result[0].tree[newServiceName].target['addedFile.xxx']);
		expect(resultShowsFileAdded).toBeTruthy();

	});
	it('should delete file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'deleteFile',
				source: 'source/toDelete.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const sourceFileRemoved = mock.calls
			.find(({ fileSet={} }) => fileSet.key === `${newServiceName}/source/toDelete.xxx`);
		expect(sourceFileRemoved === undefined, 'source file removed').toBeTruthy();

		const deleteFileChange = mock.changes[`${newServiceName}/source/toDelete.xxx`] || {};
		expect(deleteFileChange.deleteFile, 'deleted file change').toBeTruthy();

		const resultShowsFileDelete = safe(() => result.result[0].tree[newServiceName].source['toDelete.xxx']) || 'does not exist';
		expect(resultShowsFileDelete === 'does not exist', 'deleted file').toBeTruthy();
	});
	it('should copy file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'copyFile',
				target: 'target/toCopyCopied.xxx',
				source: 'source/toCopy.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}
		errors.length && assert.custom(errors);

		//const sourceFileAdded = mock.calls
		//	.find(({ fileSet={} }) => fileSet.key === `${newServiceName}/target/toCopyCopied.xxx`);
		//expect(sourceFileAdded).toBeTruthy();

		const copyFileAdd = mock.changes[`${newServiceName}/target/toCopyCopied.xxx`] || {};
		expect(!copyFileAdd.deleteFile).toBeTruthy();

		const copyFileRemove = mock.changes[`${newServiceName}/target/toCopy.xxx`];
		expect(!copyFileRemove).toBeTruthy();
	});
	it('should move file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'moveFile',
				target: 'target/', 
				source: 'source/toMove.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			errors.push(e);
		}
		errors.length && assert.custom(errors);

		//const sourceFileRemoved = mock.calls
		//	.find(({ fileRemove={} }) => fileRemove.key === `${newServiceName}/source/toMove.xxx`);
		//expect(sourceFileRemoved, 'source file removed').toBeTruthy();

		const deleteFileChange = mock.changes[`${newServiceName}/source/toMove.xxx`];
		expect(deleteFileChange && deleteFileChange.deleteFile, `delete file change`).toBeTruthy();

		const addFileChange = mock.changes[`${newServiceName}/target/toMove.xxx`];
		expect(addFileChange && !addFileChange.deleteFile, `add file change`).toBeTruthy();
	});
	it('should rename file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		const sourceFileContents = mock.files[newServiceName+'/source/toRename.xxx'];
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'renameFile',
				target: 'target/toRename.xxx',
				source: 'source/toRename.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}
		errors.length && assert.custom(errors);

		//const callToSetFile = mock.calls.find(x => x.fileSet).fileSet;
		//expect(callToSetFile.value, "renamed file contents").toEqual(sourceFileContents);

		//const renameFilePath = `${newServiceName}/source/toRename.xxx`;
		//const sourceFileRemoved = mock.calls.find(x => x.fileRemove?.key === renameFilePath);
		//expect(sourceFileRemoved, 'source file removed').toBeTruthy();

		const deleteFileChange = mock.changes[`${newServiceName}/source/toRename.xxx`];
		expect(deleteFileChange && deleteFileChange.deleteFile, `delete file change`).toBeTruthy();

		const addFileChange = mock.changes[`${newServiceName}/target/toRename.xxx`];
		expect(addFileChange && !addFileChange.deleteFile, `add file change`).toBeTruthy();

	});

	it('should add folder', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'addFolder',
				target: 'target/newFolder',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch({ message, stack }){
			errors.push({ message, stack });
		}
		assert.custom(errors);

		const tree = safe(() => result.result[0].tree[newServiceName]);
		expect(tree.target.newFolder).toBeTruthy();
	});
	it('should delete folder', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'deleteFolder',
				source: 'target',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch({ message, stack }){
			errors.push({ message, stack });
		}
		assert.custom(errors);

		const tree = safe(() => result.result[0].tree[newServiceName]);
		const files = safe(() => result.result[0].code);
		const deletedChildren = files.filter(x => x.path.startsWith(`/${newServiceName}/target/`));

		const deleteFileChange = mock.changes[newServiceName + '/target/sibling.xxx'] || {};
		expect(deleteFileChange,'deleteFileChange').toBeTruthy();
		expect(deleteFileChange.deleteFile,'change.deleteFile').toBeTruthy();

		expect(!tree.target, 'deleted target in tree').toBeTruthy();
		expect(deletedChildren.length, 'deleted children files length').toEqual(0);
	});
	it('should copy folder', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'copyFolder',
				source: 'source',
				target: 'target/source'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch({ message, stack }){
			errors.push({ message, stack });
		}
		assert.custom(errors);

		const tree = safe(() => result.result[0].tree[newServiceName]);
		const files = safe(() => result.result[0].code);

		const copiedSourceFiles = files.filter(x => x.path.startsWith(`/${newServiceName}/source/`));
		const copiedTargetFiles = files.filter(x => x.path.startsWith(`/${newServiceName}/target/source/`));
		assert.deepEqual(
			Object.keys(copiedSourceFiles).sort(),
			Object.keys(copiedTargetFiles).sort()
		);
		assert.deepEqual(
			Object.keys(tree.target.source).sort(),
			Object.keys(tree.source).sort()
		);
	});
	it('should move folder', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		const originalSourceFileLength = Object.keys(mock.files)
			.filter(x => x.startsWith(`${newServiceName}/source/`))
			.filter(x => !x.includes('.keep'))
			.length;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'moveFolder',
				source: 'source',
				target: 'target/source'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch({ message, stack }){
			errors.push({ message, stack });
		}
		assert.custom(errors);

		const tree = safe(() => result.result[0].tree[newServiceName]);
		const files = safe(() => result.result[0].code);
		const sourceFiles = files.filter(x => x.path.startsWith(`${newServiceName}/source/`));
		const movedFiles = files.filter(x => x.path.startsWith(`${newServiceName}/target/source/`));

		expect(tree.source, 'source folder in tree').toEqual(undefined);
		expect(tree.target.source, 'source folder in target in tree').toBeTruthy();
		
		expect(sourceFiles.length, 'source files length').toEqual(0);
		expect(movedFiles.length, 'moved files length').toEqual(originalSourceFileLength);
	});
	it('should rename folder', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		const originalSourceFileLength = Object.keys(mock.files)
			.filter(x => x.startsWith(`${newServiceName}/source/`))
			.filter(x => !x.includes('.keep'))
			.length;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'renameFolder',
				source: 'source',
				target: 'sourceRenamed'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch({ message, stack }){
			errors.push({ message, stack });
		}
		assert.custom(errors);

		const tree = safe(() => result.result[0].tree[newServiceName]);
		const files = safe(() => result.result[0].code);
		const sourceFiles = files.filter(x => x.path.startsWith(`${newServiceName}/source/`));
		const childFiles = files.filter(x => x.path.startsWith(`${newServiceName}/sourceRenamed/`));

		expect(tree.source, 'source folder in tree').toEqual(undefined);
		expect(tree.sourceRenamed, 'source renamed folder in tree').toBeTruthy();

		expect(sourceFiles.length, 'source files length').toEqual(0);
		expect(childFiles.length, 'renamed child files length').toEqual(originalSourceFileLength);
	});

	it('should create .keep file for empty folder', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'deleteFile',
				source: 'target/sibling.xxx'
			},
		});
		const originalFiles = Object.keys(mock.files);
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch({ message, stack }){
			errors.push({ message, stack });
		}
		assert.custom(errors);

		const tree = safe(() => result.result[0].tree[newServiceName]);
		const files = safe(() => result.result[0].code);

		const keepFile = files.find(x => x.path === `${newServiceName}/target/.keep`);
		expect(keepFile).toBeTruthy();
		expect(tree.target['.keep']).toBeTruthy();
		expect(mock.changes[newServiceName+'/target/.keep'], "keep file changes").toBeTruthy();
		
		assert.deepEqual(
			originalFiles.sort(),
			Object.keys(mock.files).sort(),
			'files should remain unchanged'
		);
	});
	it('should remove .keep file for filled folder', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setBody({
			name: newServiceName,
			operation: {
				name: 'addFile',
				target: 'target/.keep'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error) errors.push(result.error);
		} catch({ message, stack }){
			errors.push({ message, stack });
		}
		assert.custom(errors);

		const tree = safe(() => result.result[0].tree[newServiceName]);
		const files = safe(() => result.result[0].code);

		const addedKeepFile = files.find(x => x.path === `/${newServiceName}/target/.keep`)
		expect(addedKeepFile, 'added keep file').toEqual(undefined);
		expect(tree.target['.keep']).toEqual(undefined);
		expect(mock.changes[newServiceName+'/target/.keep'], "added keep file changes").toEqual(undefined);

		const preExistingKeepFile = files.find(x => x.path === `./${newServiceName}/source/.keep`);
		expect(preExistingKeepFile).toEqual(undefined);
		expect(tree.source['.keep']).toEqual(undefined);
		expect(mock.changes[newServiceName+'/source/.keep'].deleteFile, 'delete pre-existing keep file').toBeTruthy();
	});

});

describe('update service with changes', ({ beforeEach }) => {
	beforeEach(() => {
		mock = ServiceMock({ utils });
		manager = new ServicesManager(mock.deps);
		mock.setService(3002, (svc) => {
			delete svc.tree.fake.source['.keep'];
			return svc;
		});
		mock.setFiles((files) => {
			Object.entries(files)
				.forEach(([k,v]) => {
					delete files[k];
					files[k.replace('./fake/', `fake/`)] = v;
				});
			delete files["fake/source/.keep"];
		});
	});

	it('should delete a changed but pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toDelete.xxx"] = {
			type: 'update',
			value: 'file to delete from source - WITH CHANGES!!',
			service: {}
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'deleteFile',
				source: 'source/toDelete.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const sourceFileRemoved = mock.calls
			.find(({ fileSet={} }) => fileSet.key === `fake/source/toDelete.xxx`);
		expect(sourceFileRemoved === undefined, 'source file removed').toBeTruthy();

		const deleteFileChange = mock.changes[`fake/source/toDelete.xxx`] || {};
		expect(deleteFileChange.deleteFile, 'deleted file change').toBeTruthy();

		const resultShowsFileDelete = safe(() => result.result[0].tree[newServiceName]
			.source['toDelete.xxx']) || 'does not exist';
		expect(resultShowsFileDelete === 'does not exist', 'deleted file').toBeTruthy();
	});
	it('should delete a changed but not pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toDeleteWasAdded.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: {}
		};
		mock.setService(3002, (svc) => {
			svc.tree.fake.source['toDeleteWasAdded.xxx'] = {};
			return svc;
		});
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'deleteFile', 
				source: 'source/toDeleteWasAdded.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const sourceFileRemoved = mock.calls
			.find(({ fileSet={} }) => fileSet.key === `fake/source/toDeleteWasAdded.xxx`);
		expect(sourceFileRemoved === undefined, 'source file removed').toBeTruthy();

		const deleteFileChange = mock.changes[`fake/source/toDeleteWasAdded.xxx`];
		expect(deleteFileChange ? 'change exists' : 'no change').toEqual('no change');

		const resultShowsFileDelete = safe(() => result.result[0].tree[newServiceName]
			.source['toDelete.xxx']) || 'does not exist';
		expect(resultShowsFileDelete === 'does not exist', 'deleted file').toBeTruthy();

		const changesRemoveCall = mock.calls.find(x => x.changesRemove);
		expect(changesRemoveCall, 'changes remove change call').toBeTruthy();
	});

	it('should copy a changed but pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toCopy.xxx"] = {
			type: 'update',
			value: 'copied - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'copyFile',
				target: 'target/toCopyCopied.xxx',
				source: 'source/toCopy.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const copyFileAdd = mock.changes[`fake/target/toCopyCopied.xxx`] || {};
		expect(copyFileAdd.value, 'copied file value').toEqual('copied - WITH CHANGES!!');
		expect(!copyFileAdd.deleteFile).toBeTruthy();

		const copyFileRemove = mock.changes[`fake/source/toCopy.xxx`];
		expect(!copyFileRemove.deleteFile).toBeTruthy();
	});
	it('should copy a changed but not pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setService(3002, (svc) => {
			svc.tree.fake.source['toCopyWasAdded.xxx'] = {};
			return svc;
		});
		mock.changes["fake/source/toCopyWasAdded.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'copyFile', 
				source: 'source/toCopyWasAdded.xxx',
				target: 'target/toCopyCopied.xxx',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const copyFileAdd = mock.changes[`fake/target/toCopyCopied.xxx`] || {};
		expect(copyFileAdd.value, 'copied file value').toEqual('file recently added - WITH CHANGES!!');
		expect(!copyFileAdd.deleteFile).toBeTruthy();

		const copyFileRemove = mock.changes[`fake/target/toCopy.xxx`];
		expect(!copyFileRemove).toBeTruthy();

		const expectedChanges = [
			"source/toCopyWasAdded.xxx",
			"target/toCopyCopied.xxx"
		];
		expect(''+result.result[0].state.changed, 'result state changed').toEqual(''+expectedChanges);
	});

	it('should move a changed but pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toMove.xxx"] = {
			type: 'update',
			value: 'to move - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFile',
				target: 'target/toMove.xxx',
				source: 'source/toMove.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const moveFileAdd = mock.changes[`fake/target/toMove.xxx`] || {};
		expect(moveFileAdd.value, 'moved file value').toEqual('to move - WITH CHANGES!!');
		expect(!moveFileAdd.deleteFile).toBeTruthy();

		const sourceFileRemove = mock.changes[`fake/source/toMove.xxx`];
		expect(sourceFileRemove).toBeTruthy();
	});
	it('should move a changed but not pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setService(3002, (svc) => {
			svc.tree.fake.source['toMoveWasAdded.xxx'] = {};
			return svc;
		});
		mock.changes["fake/source/toMoveWasAdded.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFile', 
				source: 'source/toMoveWasAdded.xxx',
				target: 'target/toMoveMoved.xxx',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const moveFileAdd = mock.changes[`fake/target/toMoveMoved.xxx`] || {};
		expect(moveFileAdd.value, 'copied file value')
			.toEqual('file recently added - WITH CHANGES!!');
		expect(!moveFileAdd.deleteFile).toBeTruthy();

		const sourceFileRemove = mock.changes['source/toMoveWasAdded.xxx'];
		expect(!sourceFileRemove).toBeTruthy();

		const expectedChanges = [
			"target/toMoveMoved.xxx"
		];
		expect(''+result.result[0].state.changed, 'result state changed')
			.toEqual(''+expectedChanges);
	});

	it('should rename a changed but pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toRename.xxx"] = {
			type: 'update',
			value: 'to rename - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'renameFile',
				target: 'target/toRename.xxx',
				source: 'source/toRename.xxx'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const moveFileAdd = mock.changes[`fake/target/toRename.xxx`] || {};
		expect(moveFileAdd.value, 'rename file value').toEqual('to rename - WITH CHANGES!!');
		expect(!moveFileAdd.deleteFile).toBeTruthy();

		const sourceFileRemove = mock.changes[`fake/source/toRename.xxx`];
		expect(sourceFileRemove, 'source rename file change').toBeTruthy();
	});
	it('should rename a changed but not pre-existing file', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setService(3002, (svc) => {
			svc.tree.fake.source['toRenameWasAdded.xxx'] = {};
			return svc;
		});
		mock.changes["fake/source/toRenameWasAdded.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFile', 
				source: 'source/toRenameWasAdded.xxx',
				target: 'target/toRenameWasAddedRenamed.xxx',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const moveFileAdd = mock.changes[`fake/target/toRenameWasAddedRenamed.xxx`] || {};
		expect(moveFileAdd.value, 'copied file value')
			.toEqual('file recently added - WITH CHANGES!!');
		expect(!moveFileAdd.deleteFile).toBeTruthy();

		const sourceFileRemove = mock.changes[`source/toRenameWasAdded.xxx`];
		expect(!sourceFileRemove).toBeTruthy();

		const expectedChanges = [
			"target/toRenameWasAddedRenamed.xxx"
		];
		expect(''+result.result[0].state.changed, 'result state changed')
			.toEqual(''+expectedChanges);
	});


	it('should delete folder with child changed but pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toDelete.xxx"] = {
			type: 'update',
			value: 'file to delete from source - WITH CHANGES!!',
			service: {}
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'deleteFolder',
				source: 'source'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const sourceFileRemoved = mock.calls
			.find(({ fileSet={} }) => fileSet.key === `fake/source/toDelete.xxx`);
		expect(sourceFileRemoved === undefined, 'source file removed').toBeTruthy();

		const deleteFileChange = mock.changes[`fake/source/toDelete.xxx`] || {};
		expect(deleteFileChange.deleteFile, 'deleted file change').toBeTruthy();

		const resultShowsFileDelete = safe(() => result.result[0].tree[newServiceName]
			.source['toDelete.xxx']) || 'does not exist';
		expect(resultShowsFileDelete === 'does not exist', 'deleted file').toBeTruthy();
	});
	it('should delete folder with child pre-existing and deleted', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toDelete.xxx"] = {
			deleteFile: true,
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'deleteFolder',
				source: 'source',
				target: 'target/source',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const deletedFileCopied = mock.changes[`fake/target/source/toCopy.xxx`];
		expect(!deletedFileCopied).toBeTruthy();
	});
	it('should delete folder with child changed but not pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/target/toDeleteWasAdded.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: {}
		};
		mock.setService(3002, (svc) => {
			svc.tree.fake.target['toDeleteWasAdded.xxx'] = {};
			return svc;
		});
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'deleteFolder',
				source: 'target'
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const sourceFileRemoved = mock.calls
			.find(({ fileSet={} }) => fileSet.key === `fake/target/toDeleteWasAdded.xxx`);
		expect(sourceFileRemoved === undefined, 'source file removed').toBeTruthy();

		const resultShowsFileDelete = safe(() => result.result[0].tree[newServiceName]
			.source['toDelete.xxx']) || 'does not exist';
		expect(resultShowsFileDelete === 'does not exist', 'deleted file').toBeTruthy();

		const deleteFileChange = mock.changes[`fake/target/toDeleteWasAdded.xxx`];
		expect(deleteFileChange ? 'change exists' : 'no change').toEqual('no change');

		const changesRemoveCall = mock.calls.find(x => x.changesRemove);
		expect(changesRemoveCall, 'changes remove change call').toBeTruthy();
	});

	it('should copy folder with child changed but pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toCopy.xxx"] = {
			type: 'update',
			value: 'copied - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'copyFolder',
				source: 'source',
				target: 'target/source',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const copyFileAdd = mock.changes[`fake/target/source/toCopy.xxx`] || {};
		expect(copyFileAdd.value, 'copied file value').toEqual('copied - WITH CHANGES!!');
		expect(!copyFileAdd.deleteFile).toBeTruthy();

		const copyFileRemove = mock.changes[`fake/source/toCopy.xxx`];
		expect(!copyFileRemove.deleteFile).toBeTruthy();
	});
	it('should copy folder with child pre-existing and deleted', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		delete mock.services["3002"].tree.fake.source['toCopy.xxx'];
		mock.changes["fake/source/toCopy.xxx"] = {
			deleteFile: true,
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'copyFolder',
				source: 'source',
				target: 'target/source',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const deletedFileCopied = mock.changes[`fake/target/source/toCopy.xxx`];
		expect(!deletedFileCopied).toBeTruthy();
	});
	it('should copy folder with child changed but not pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setService(3002, (svc) => {
			svc.tree.fake.source['toCopyWasAdded.xxx'] = {};
			return svc;
		});
		mock.changes["fake/source/toCopyWasAdded.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'copyFolder',
				source: 'source',
				target: 'target/source',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const copyFileAdd = mock.changes[`fake/target/source/toCopyWasAdded.xxx`] || {};
		expect(copyFileAdd.value, 'copied file value')
			.toEqual('file recently added - WITH CHANGES!!');
		expect(!copyFileAdd.deleteFile).toBeTruthy();

		const copyFileRemove = mock.changes[`fake/source/toCopyWasAdded.xxx`];
		expect(!copyFileRemove.deleteFile).toBeTruthy();

		const expectedChanges = [
			"source/toCopyWasAdded.xxx",
			"target/source/toMove.xxx",
			"target/source/toRename.xxx",
			"target/source/toDelete.xxx",
			"target/source/toCopy.xxx",
			"target/source/toCopyWasAdded.xxx"
		];
		expect(''+result.result[0].state.changed, 'result state changed').toEqual(''+expectedChanges);
	});

	it('should move folder with child changed but pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toMove.xxx"] = {
			type: 'update',
			value: 'moved - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFolder',
				source: 'source',
				target: 'target/source',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const movedFileAdd = mock.changes[`fake/target/source/toMove.xxx`] || {};
		expect(movedFileAdd.value, 'moved file value').toEqual('moved - WITH CHANGES!!');
		expect(!movedFileAdd.deleteFile, 'move file add').toBeTruthy();

		const sourceFileRemove = mock.changes[`fake/source/toCopy.xxx`];
		expect(sourceFileRemove.deleteFile, 'removed source file').toBeTruthy();
	});
	it('should move folder with child pre-existing and deleted', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toMove.xxx"] = {
			deleteFile: true,
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFolder',
				source: 'source',
				target: 'target/source',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const deletedFileCopied = mock.changes[`fake/target/source/toMove.xxx`];
		expect(!deletedFileCopied).toBeTruthy();
	});
	it('should move folder with child changed but not pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setService(3002, (svc) => {
			svc.tree.fake.source['changedFile.xxx'] = {};
			return svc;
		});
		mock.changes["fake/source/changedFile.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFolder',
				source: 'source',
				target: 'target/source',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const copyFileAdd = mock.changes[`fake/target/source/changedFile.xxx`] || {};
		expect(copyFileAdd.value, 'copied file value')
			.toEqual('file recently added - WITH CHANGES!!');
		expect(copyFileAdd && !copyFileAdd.deleteFile).toBeTruthy();
		
		const originalFile = mock.changes[`fake/source/toCopyWasAdded.xxx`];
		expect(!originalFile, 'original file changes').toBeTruthy();
	});
	
	it('should rename folder with child changed but pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toMove.xxx"] = {
			type: 'update',
			value: 'moved - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'renameFolder',
				source: 'source',
				target: 'renamed',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const movedFileAdd = mock.changes[`fake/renamed/toMove.xxx`] || {};
		expect(movedFileAdd.value, 'moved file value').toEqual('moved - WITH CHANGES!!');
		expect(!movedFileAdd.deleteFile, 'move file add').toBeTruthy();

		const sourceFileRemove = mock.changes[`fake/source/toCopy.xxx`];
		expect(sourceFileRemove.deleteFile, 'removed source file').toBeTruthy();
	});
	it('should rename folder with child pre-existing and deleted', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.changes["fake/source/toMove.xxx"] = {
			deleteFile: true,
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFolder',
				source: 'source',
				target: 'renamed',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const deletedFileCopied = mock.changes[`fake/renamed/toMove.xxx`];
		expect(!deletedFileCopied).toBeTruthy();
	});
	it('should rename folder with child changed but not pre-existing', async (assert) => {
		const { serviceUpdate } = manager.handlers;
		mock.setService(3002, (svc) => {
			svc.tree.fake.source['changedFile.xxx'] = {};
			return svc;
		});
		mock.changes["fake/source/changedFile.xxx"] = {
			type: 'update',
			value: 'file recently added - WITH CHANGES!!',
			service: mock.services['3002']
		};
		mock.setBody({
			name: 'fake',
			operation: {
				name: 'moveFolder',
				source: 'source',
				target: 'renamed',
			},
		});
		const errors = [];
		let result;
		try {
			result = await serviceUpdate(mock.params, mock.event);
			result = JSON.parse(result);
			if(result.error){
				errors.push({
					message: result.error.message,
					stack: result.error.stack
				});
			}
		} catch(e){
			const { message, stack } = e;
			errors.push({ message, stack });
		}

		errors.length && assert.custom(errors);

		const copyFileAdd = mock.changes[`fake/renamed/changedFile.xxx`] || {};
		expect(copyFileAdd.value, 'copied file value')
			.toEqual('file recently added - WITH CHANGES!!');
		expect(copyFileAdd && !copyFileAdd.deleteFile).toBeTruthy();
		
		const originalFile = mock.changes[`fake/source/toCopyWasAdded.xxx`];
		expect(!originalFile, 'original file changes').toBeTruthy();

	});
});

describe('create service', ({ beforeEach }) => {
	beforeEach(() => {
		mock = ServiceMock({ utils });
		manager = new ServicesManager(mock.deps);
	});

	it.todo('should use provider when indicated', async (assert) => {});
	it.todo('should register service handler', async (assert) => {});
	it.todo('should deliver default service', async (assert) => {});
});

describe('change service', ({ beforeEach }) => {
	beforeEach(() => {
		mock = ServiceMock({ utils });
		manager = new ServicesManager(mock.deps);
	});

	it.todo('should save changes to files within service', async (assert) => {});
	it.todo('should use provider when applicable', async (assert) => {});
	it.todo('should trigger template update when necessary', async (assert) => {});
	it.todo('should indicate type of change', async (assert) => {});

	it.todo('should be doing things that update service is doing?', async (assert) => {});

	it.todo('should return a list of current changes', async (assert) => {});
});

describe('delete service', ({ beforeEach }) => {
	beforeEach(() => {
		mock = ServiceMock({ utils });
		manager = new ServicesManager(mock.deps);
	});

	it.todo('should delete a service', async (assert) => {});
	it.todo('should remove files when service is deleted', async (assert) => {});
});

describe('special folders', ({ beforeEach }) => {
	const newServiceName = 'fake/foo';

	beforeEach(() => {
		mock = ServiceMock({ utils });
		manager = new ServicesManager(mock.deps);
			mock.setService(3002, (svc) => {
			svc.tree[newServiceName] = svc.tree.fake;
			delete svc.tree.fake;
			svc.name = newServiceName;
			svc.repo = newServiceName;
			return svc;
		});
		mock.setFiles((files) => {
			Object.entries(files)
				.forEach(([k,v]) => {
					delete files[k];
					files[k.replace('./fake/', `${newServiceName}/`)] = v;
				});
		});
	});

	it.only('should not check in files in .git folder', async (assert) => {
		expect(true, 'bogus test condition').toEqual(false);
	});
	it.todo('should not check in .gitignore files', async (assert) => {
		//https://www.npmjs.com/package/parse-gitignore
	});
});

if(self instanceof WorkerGlobalScope){
	let finish;
	const donePromise = new Promise((resolve) => { finish = resolve; });
	TestStart(finish);
	await donePromise;
}

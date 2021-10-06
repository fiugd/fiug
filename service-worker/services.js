const ServicesManager = (() => {
	const useNew = true;

	const stringify = o => JSON.stringify(o,null,2);
	const clone = o => {
		if(!o) return;
		try {
			return JSON.parse(stringify(o));
		} catch(e){
			return;
		}
	};
	const unique = (a) => [...new Set(a)];
	function objectPath(obj, path) {
		var result = obj;
		try{
			var props = path.split('/');
			props.every(function propsEveryCb(prop) {
				if(prop === '.') return true;
				if (typeof result[prop] === 'undefined') {
					result = undefined;
					return false;
				}
				result = result[prop];
				return true;
			});
			return result;
		} catch(e) {
			return;
		}
	}
	const logJSON = x => console.log(JSON.stringify(x, null, 2));
	const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
	const stripFrontDotSlash = (x) => x.replace(/^\.\//, '');

	const handleServiceCreate = ({ app, storage, providers }) => async (
		params,
		event
	) => {
		const servicesStore = storage.stores.services;
		const filesStore = storage.stores.files;

		// event.request.arrayBuffer()
		// event.request.blob()
		// event.request.json()
		// event.request.text()
		// event.request.formData()
		const { id } = params;

		if (id === "provider") return await providers.createServiceHandler(event);

		const { name } = (await event.request.json()) || {};

		if (!id) return stringify({ params, event, error: "id required for service create!" });
		if (!name) return stringify({ params, event, error: "name required for service create!" });

		console.log("/service/create/:id? triggered");
		//return stringify({ params, event });

		// create the service in store 
		await servicesStore.setItem(id + "", {
			name,
			id,
			tree: {
				[name]: {
					".templates": {
						"json.html": {},
					},
					"package.json": {},
				},
			},
		});
		filesStore.setItem(`./${name}/package.json`, {
			main: "package.json",
			comment: "this is an example package.json",
		});
		filesStore.setItem(
			`./${name}/.templates/json.html`,
			`
				<html>
						<p>basic json template output</p>
						<pre>{{template_value}}</pre>
				</html>
				`
		);

		// make service available from service worker (via handler)
		await app.addServiceHandler({ name, msg: "served from fresh baked" });

		// return current service
		const services = storage.defaultServices();

		return stringify({
			result: {
				services: [services.filter((x) => Number(x.id) === 777)],
			}
		});
	};

	const handleServiceChange = ({ storage, utils, templates }) => async (
		params,
		event
	) => {
		const servicesStore = storage.stores.services;
		const filesStore = storage.stores.files;
		const changesStore = storage.stores.changes;
		let jsonData;
		try {
			const clonedRequest = event.request.clone();
			jsonData = await clonedRequest.json();
		} catch (e) {}

		let fileData;
		try {
			if (!jsonData) {
				const formData = await event.request.formData();
				jsonData = JSON.parse(formData.get("json"));
				fileData = formData.get("file");
			}
		} catch (e) {}

		try {
			let { path, code, command, service: serviceName } = jsonData;
			if (fileData) {
				code = fileData || "";
			}

			const service = await servicesStore.iterate((value, key) => {
				if (value.name === serviceName) return value;
				return;
			});

			// github services (and default service) don't store files with ./ prepended
			// and also this should be done through provider...
			// also, would expect to not change the file, instead add a change in changes table
			// ^^ and restore that on read
			if(service.type === 'github' && `${path.slice(0,2)}` === './'){
				path = path.slice(2);
			}
			if(service.type === 'default' && `${path.slice(0,2)}` === './'){
				path = path.slice(2);
			}

			await changesStore.setItem(path, {
				type: 'update',
				value: code,
				service: (() => {
					const { tree, ...rest } = service;
					return rest;
				})()
			});

			if (service && command === "upsert") {
				service.tree = utils.treeInsertFile(path, service.tree);
				await servicesStore.setItem(service.id + "", service);
			}

			if(path.includes('/.templates/')){
				await templates.refresh();
			}

			const metaData = () => ""; //TODO
			return stringify({
				result: {
					path,
					code: fileData ? metaData(fileData) : code,
				},
			});
		} catch (error) {
			return stringify({ error });
		}
	};

	const handleServiceGetChanges = ({ storage, utils, templates }) => async (
		params,
		event,
		query
	) => {
		const { flattenObject } = utils;

		const servicesStore = storage.stores.services;
		const filesStore = storage.stores.files;
		const changesStore = storage.stores.changes;

		const { cwd } = query;

		let service;
		cwd && await servicesStore.iterate((value, key) => {
			const { tree } = value;
			const flattened = flattenObject(tree);
			if(flattened.includes(cwd)){
				service = value.name;
				return true;
			}
		});

		const changes = [];
		const changesKeys = await changesStore.keys();
		for(let i=0, len=changesKeys.length; i<len; i++){
			const key = changesKeys[i];
			const value = await changesStore.getItem(key);
			const parent = value?.service?.name;
			if(!parent) continue;
			if(service && parent !== service) continue;

			changes.push({
				fileName: key,
				...value,
				original: await filesStore.getItem(key)
			});
		}

		try {
			return stringify({
				changes,
				cwd,
			});
		} catch (error) {
			return stringify({ error });
		}
	};

	//smoking this right now
	//https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d
	//https://medium.com/javascript-scene/functors-categories-61e031bac53f#.4hqndcx22
	const _operationsUpdater = (() => {

		const getBody = (operation) => {
			const convertStoreObject = (code={}) => {
				const entries = Object.entries(code);
				entries.forEach(([k,v]) => {
					if(k.slice(2) === './') return;
					if(k[0] === '/'){
						delete code[k];
						code['.'+k] = v;
						return;
					}
					delete code[k];
					code['./'+k] = v;
				});
				return code;
			};
			return {
				...operation,
				service: operation.service.name,
				tree: clone(operation.service.tree) || {},
				code: convertStoreObject(operation.code),
				changes: convertStoreObject(operation.changes),
				filesToAdd: [],
				filesToDelete: []
			};
		}
		const adjustMoveTarget = (operation) => {
			const isMove = operation.name.includes('move') || operation.name.includes('copy');
			if(!isMove) return operation;
			let { target, source } = operation;
			const isFolder = operation.name.includes('Folder');
			//if(isFolder && !target.endsWith('/')) target += '/';
			if(target.endsWith('/')){
				target += source.split('/').pop();
			}
			return { ...operation, target };
		};
		const adjustRenameTarget = (operation) => {
			const isRename = operation.name.includes('rename');
			if(!isRename) return operation;
			let target = operation.target;
			if(!operation.target.includes('/') && operation.source.includes('/')){
				target = [
					...operation.source.split('/').slice(0,-1),
					target
				].join('/');
			}
			return { ...operation, target };
		};
		const addChildrenToTarget = (operation) => {
			const isFile = operation.name.includes('File');
			if(isFile) return operation;
			const sourcePath = `./${operation.service}/${operation.source}`;
			const targetPath = `./${operation.service}/${operation.target}`;
			const children = unique([
				...Object.keys(operation.code),
				...Object.keys(operation.changes)
			])
				.filter(x => x.startsWith(sourcePath+'/'));
			const childrenMappedToTarget = children.map(child => {
				const childRelative = child.split(operation.source).pop();
				return `${targetPath}${childRelative}`;
			});
			const filesToAdd = [
				...operation.filesToAdd,
				...childrenMappedToTarget
			];
			children.forEach((c, i) => {
				operation.code[childrenMappedToTarget[i]] = async (store) => await store.getItem(c);
			});
			return { ...operation, filesToAdd };
		};
		const addTargetToTree = (operation) => {
			const {service,source,target,tree} = operation;
			const sourceValue = objectPath(tree[service], source) || {};

			const targetSplit = target.split('/');
			const targetKey = targetSplit.length === 1
				? targetSplit[0]
				: targetSplit.slice(-1).join('/');
			const targetParentPath = targetSplit.length === 1
				? ''
				: targetSplit.slice(0,-1).join('/');
			const targetParent = targetSplit.length === 1
				? tree[service]
				: objectPath(tree[service], targetParentPath);

			targetParent[targetKey] = sourceValue;

			return { ...operation, tree };
		};
		const addTargetToFiles = (operation) => {
			const isFile = operation.name.includes('File');
			if(!isFile) return operation;
			const path = `./${operation.service}/${operation.target}`;
			const update = `./${operation.service}/${operation.source}`;
			const fileGetter = operation.name === 'addFile'
				? async (store) => operation.source || ''
				: async (store) => await store.getItem(update);
			operation.code[path] = fileGetter;
			const filesToAdd = [ ...operation.filesToAdd, path ];
			return { ...operation, filesToAdd };
		};
		const deleteChildrenFromSource = (operation) => {
			const isFile = operation.name.includes('File');
			if(isFile) return operation;
			const sourcePath = `./${operation.service}/${operation.source}`;
			const children =unique([
				...Object.keys(operation.code),
				...Object.keys(operation.changes)
			])
				.filter(x => x.startsWith(sourcePath+'/'));
			const filesToDelete = [
				...operation.filesToDelete,
				...children
			];
			children.forEach(c => {
				delete operation.code[c]
			})
			return { ...operation, filesToDelete };
		};
		const deleteSourceFromTree = (operation) => {
			const {service,source,tree} = operation;
			const sourceSplit = source.split('/');
			const sourceKey = sourceSplit.length === 1
				? sourceSplit[0]
				: sourceSplit.slice(-1).join('/');
			const sourceParentPath = sourceSplit.length === 1
				? ''
				: sourceSplit.slice(0,-1).join('/');
			const sourceParent = sourceSplit.length === 1
				? tree[service]
				: objectPath(tree[service], sourceParentPath);
			delete sourceParent[sourceKey];
			return operation;
		};
		const deleteSourceFromFiles = (operation) => {
			const isFile = operation.name.includes('File');
			if(!isFile) return operation;
			const path = `./${operation.service}/${operation.source}`;
			delete operation.code[`./${operation.service}/${operation.source}`];
			const filesToDelete = [
				...operation.filesToDelete,
				path
			];
			return { ...operation, filesToDelete };
		};
		const keepHelper = (operation) => {
			let { filesToAdd, filesToDelete } = operation;
			const { tree, code, utils, service, changes } = operation;
			const mapCodeForHelper = () => {
				const changesFiles = Object.entries(changes)
					.map(([path,value]) => ({
						name: path.split('/').pop(),
						path
					}));
				const codeFiles = Object.entries(code)
					.map(([path,value]) => ({
						name: path.split('/').pop(),
						path
					}));
				return [...codeFiles, ...changesFiles];
			};
			const keepFilesFromHelper = utils
				.keepHelper(tree, mapCodeForHelper())
				.filter(x => x.includes('/.keep'))
				.map(x => '.'+x);

			keepFilesFromHelper.forEach(k => {
				const parentPath = k.split('/').slice(0,-1).join('/').replace(service+'/', '');
				const parentInTree = objectPath(tree[service], parentPath) || {};
				if(!parentInTree) return;
				parentInTree['.keep'] = {};
				code[k] = ' ';
				filesToAdd.push(k);
				filesToDelete = filesToDelete.filter(x => x !== k);
			});
			const keepFilesInCode = Object.keys(operation.code)
				.filter(x => x.includes('/.keep'));

			keepFilesInCode.forEach(k => {
				const parentPath = k.split('/').slice(0,-1).join('/').replace(service+'/', '');
				const parentInTree = objectPath(tree[service], parentPath) || {};
				const parentKeys = Object.keys(parentInTree).filter(x => x !== '.keep');
				if(parentKeys.length === 0) return;
				delete parentInTree['.keep'];
				delete code[k];
				const keepIsAdded = filesToAdd.find(x => x === k);
				if(!keepIsAdded) filesToDelete.push(k);
				filesToAdd = filesToAdd.filter(x => x !== k);
			});
			return { ...operation, filesToAdd, filesToDelete, code, tree };
		};

		const addSourceToTarget = pipe(
			addChildrenToTarget,
			addTargetToTree,
			addTargetToFiles
		);
		const deleteSource = pipe(
			deleteChildrenFromSource,
			deleteSourceFromTree,
			deleteSourceFromFiles
		);
		const init = (...fns) => pipe(
			getBody,
			adjustMoveTarget,
			adjustRenameTarget,
			...fns,
			keepHelper
		);
		const add    = init( addSourceToTarget );
		const copy   = init( addSourceToTarget );
		const move   = init( addSourceToTarget, deleteSource );
		const rename = init( addSourceToTarget, deleteSource );
		const remove = init( deleteSource );

		const operations = {
			addFile: add,
			addFolder: add,
			moveFile: move,
			moveFolder: move,
			copyFile: copy,
			copyFolder: copy,
			renameFile: rename,
			renameFolder: rename,
			deleteFile: remove,
			deleteFolder: remove
		};

		return operation => (service, code, utils, changes) =>
			operations[operation.name]({
				...operation, service, code, utils, changes
			});

	})();

	const handleServiceUpdate = ({ storage, providers, utils }) => async (
		params,
		event
	) => {
		const servicesStore = storage.stores.services;
		const filesStore = storage.stores.files;
		const changesStore = storage.stores.changes;
		const editorStore = storage.stores.editor;

		try {
			const { id } = params;
			const body = await event.request.json();
			const { name, operation } = body;

			const isMoveOrRename = operation?.name?.includes('rename') || operation?.name?.includes('move');
			const isCopy = operation?.name?.includes('copy')

			const operationsUpdater = _operationsUpdater(operation);
			let update;

			if(useNew && operationsUpdater){
				const _service = await servicesStore.getItem(id + "");
				const fileKeys = (await filesStore.keys())
					.filter(key =>
						key.startsWith(`./${_service.name}/`) ||
						key.startsWith(`${_service.name}/`)
					);
				const changeKeys = (await changesStore.keys())
					.filter(key =>
						key.startsWith(`./${_service.name}/`) ||
						key.startsWith(`${_service.name}/`)
					);
				const _code = fileKeys
					.reduce((all, key) => ({
						...all,
						[key]: ''
					}), {});
				const _changed = changeKeys
					.reduce((all, key) => ({
						...all,
						[key]: ''
					}), {});

				update = operationsUpdater(_service, _code, utils, _changed);

				const getItem = (target, update) => async (key) => {
					let formattedKey = key;
					if(key.slice(0,2) === './' && _service.type === 'github'){
						formattedKey = key.slice(2);
					}
					if(key.slice(0,1) === '/' && _service.type === 'github'){
						formattedKey = key.slice(1);
					}
					const changed = await changesStore.getItem(formattedKey);
					if(changed && changed.type === "update") return changed.value;

					if(changed && changed.deleteFile){
						update.filesToAdd = update.filesToAdd.filter(x => x!==target);
						let parent = objectPath(update.tree, target.split('/').slice(0,-1).join('/'));
						delete parent[target.split('/').pop()]
						return '';
					}

					const file = await filesStore.getItem(formattedKey);
					return file;
				};
				for(var key in update.code){
					if(typeof update.code[key] !== 'function') continue;
					update.code[key] = await update.code[key]({ getItem: getItem(key, update) });
				}
			}
			if(update){
				body.code = Object.entries(update.code)
					.map(([path,value]) => ({
						name: path.split('/').pop(),
						path: path.replace(/^\.\//, ''),
						update: value
					}));
				body.tree = update.tree;
			}
			if(!update && (isMoveOrRename || isCopy) ){
				const service = await servicesStore.getItem(id + "");

				const filesFromService = (await filesStore.keys())
					//.filter(key => key.startsWith(`${service.name}/`));
					.filter(key => key.startsWith(`./${service.name}/`));	

				body.code = [];
				for(var i=0, len=filesFromService.length; i < len; i++){
					const key = filesFromService[i];
					const filename = operation.target.endsWith('/')
						? operation.source.split('/').pop()
						: '';
					const update = await filesStore.getItem(key);
					const renameKey = (key, force) => {
						if(!isMoveOrRename && !force) return key;
						return key
							.replace(
								//`${service.name}/${operation.source}`,
								//`${service.name}/${operation.target}`
								`./${service.name}/${operation.source}`,
								`./${service.name}/${operation.target}${filename}`
							);
					};
					const copyFile = () => {
						if(!key.includes(`./${service.name}/${operation.source}`)) return;
						const copiedFile = {
							name: operation.target.split('/').pop(),
							update,
							path: renameKey(key, 'force')
								.replace(/^\./, '')
						};
						body.code.push(copiedFile);
					};
					body.code.push({
						name: key.split('/').pop(),
						update,
						path: renameKey(key)
							.replace(/^\./, '')
					});
					isCopy && copyFile();
				}

				body.tree = service.tree;
				const getPosInTree = (path, tree) => ({
					parent: path.split('/')
						.slice(0, -1)
						.reduce((all, one) => {
							all[one] = all[one] || {};
							return all[one]
						}, body.tree),
					param: path.split('/').pop()
				});
				const sourcePos = getPosInTree(`${service.name}/${operation.source}`, body.tree);
				const targetPos = getPosInTree(`${service.name}/${operation.target}`, body.tree);
				targetPos.parent[targetPos.param || sourcePos.param] = sourcePos.parent[sourcePos.param];

				if(isMoveOrRename){
					delete sourcePos.parent[sourcePos.param];
				}
			}

			//console.log(JSON.stringify(body.code, null, 2));
			//console.log(JSON.stringify(body.tree, null, 2));

			const parsedCode =
				!Array.isArray(body.code) && utils.safe(() => JSON.parse(body.code));
			if (parsedCode && parsedCode.tree) {
				body.tree = parsedCode.tree;
				body.code = parsedCode.files;
			}

			const preExistingService =
				(await servicesStore.getItem(id + "")) || {};

			const service = {
				...preExistingService,
				...{
					name,
					tree: body.tree,
				},
			};

			if (!service.name) {
				console.error("cannot set meta store item without name");
				return;
			}
			await servicesStore.setItem(id + "", service);

			const { filesToAdd, filesToDelete } = await (async () => {
				if(update && update.filesToAdd && update.filesToDelete) return update;

				const filesFromUpdateTree = utils
					.keepHelper(body.tree, body.code)
					//.map(x => x.startsWith('/') ? x.slice(1) : x);
					.map(x => `.${x}`);

				const filesInStore = (await filesStore.keys())
					.filter(key => key.startsWith(`./${service.name}/`));

				const filesToDelete = filesInStore
					.filter(file => !filesFromUpdateTree.includes(file));

				const filesToAdd = filesFromUpdateTree
					.filter(file => !filesInStore.includes(file));

				return { filesToAdd, filesToDelete };
			})();

			// TODO: binary files
			const binaryFiles = [];

			for (let i = 0, len = filesToAdd.length; i < len; i++) {
				const path = ['github', 'default'].includes(service.type)
					? stripFrontDotSlash(filesToAdd[i])
					: filesToAdd[i];
				const fileUpdate = body.code.find(x =>
					`.${x.path}` === path ||
					x.path === `/${path}` ||
					x.path === path
				);
				const parent = service;
				let fileUpdateCode;
				if(fileUpdate?.update){
					fileUpdateCode = fileUpdate.update;
					delete fileUpdate.update;
				}
				const code = fileUpdateCode || ''; //TODO: if not in update, default for file
				//await providers.fileChange({ path: filesToAdd[i], code, parent });

				await changesStore.setItem(path, {
					type: 'update',
					value: code,
					service: (() => {
						const { tree, ...rest } = service;
						return rest;
					})()
				});
				await editorStore.removeItem('/' + path);

				//TODO: I think this is a problem, not sure...
				//files get written with blank string and dot in front of name
				//await filesStore.setItem(path, code);
			}

			for (let i = 0, len = filesToDelete.length; i < len; i++) {
				const parent = service;
				const path = service.type === 'github'
					? stripFrontDotSlash(filesToDelete[i])
					: filesToDelete[i];
				const existingFile = await filesStore.getItem(path);

				if(existingFile !== null){
					await changesStore.setItem(path, {
						deleteFile: true,
						service: (() => {
							const { tree, ...rest } = service;
							return rest;
						})()
					});
					//await providers.fileChange({ path: filesToDelete[i], parent, deleteFile: true });
				} else {
					await changesStore.removeItem(path);
					//await providers.removeChange({ path: filesToDelete[i], parent });
				}
			}

			/*

			this looks like it would:
				erase all changes for this service
				put those changes in file store

			this is not exactly the desired behavior in current iteration...

			const changedFiles = (await changesStore.keys())
				//.filter(key => key.startsWith(`${service.name}/`));
				.filter(key => key.startsWith(`./${service.name}/`));
			for(let i = 0, len=changedFiles.length; i < len; i++){
				const parent = service;
				const path = changedFiles[i];
				const { type, value: code } = await changesStore.getItem(path);
				if(type !== 'update') continue;
				await providers.fileChange({ path, code, parent });
				await changesStore.removeItem(path);
				await filesStore.setItem(path, code);
			}

			*/

			const changed = (await changesStore.keys())
					.filter(x => x.startsWith(`${service.name}`))
					.map(x => x.split(service.name+'/')[1]);
			const opened = (await changesStore.getItem(`state-${service.name}-opened`)) || [];
			const selected = (opened.find(x => x.order === 0)||{}).name || '';

			/*
				TODO:
				addFile - select the file and show it opened
				removeFile - remove from opened / selected
				etc..
				similar thing with treeState
			*/

			return stringify({
				result: [{
					id: service.id,
					name: service.name,
					code: body.code.map(({ name, path }) => ({ name, path })),
					tree: body.tree,
					state: { opened, selected, changed },
					treeState: {
						expand: (await changesStore.getItem(`tree-${service.name}-expanded`)) || [],
						select: selected,
						changed,
						new: []
					}
				}]
			});
		} catch (error) {
			console.error(error);
			const { stack, message } = error;
			return stringify({ error: { message, stack } });
		}
	};

	const handleServiceDelete = () => (params, event) => {
		console.log("/service/delete/:id? triggered");
		return stringify({ params, event });
	};

	class ServicesManager {
		constructor({ app, storage, providers, templates, utils }) {
			this.app = app;
			this.storage = storage;
			this.providers = providers;
			this.templates = templates;
			this.utils = utils;

			this.handlers = {
				serviceCreate: handleServiceCreate(this),
				serviceChange: handleServiceChange(this),
				serviceGetChanges: handleServiceGetChanges(this),
				serviceUpdate: handleServiceUpdate(this),
				serviceDelete: handleServiceDelete(this),
			};
		}
	}
	return ServicesManager;
})();

export {
	ServicesManager,
};

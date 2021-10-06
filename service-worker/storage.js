import { RootService } from './root.js';

const StorageManager = (() => {
	const getStores = () => {
		var driver = [
			localforage.INDEXEDDB,
			localforage.WEBSQL,
			localforage.LOCALSTORAGE,
		];
		const files = localforage.createInstance({
			driver,
			name: "service-worker",
			version: 1.0,
			storeName: "files",
			description: "permanent state of contents of files across projects",
		});
		const services = localforage.createInstance({
			driver,
			name: "service-worker",
			version: 1.0,
			storeName: "services",
			description: "services directory stucture, type, etc",
		});
		const providers = localforage.createInstance({
			driver,
			name: "service-worker",
			version: 1.0,
			storeName: "providers",
			description: "connects services to outside world",
		});

		const changes = localforage.createInstance({
			driver,
			name: "service-worker",
			version: 1.0,
			storeName: "changes",
			description: "keep track of changes not pushed to provider",
		});

		const handlers = localforage.createInstance({
			driver,
			name: "service-worker",
			version: 1.0,
			storeName: "handlers",
			description: "used after app has booted when service worker is updated",
		});

		const editor = localforage.createInstance({
			driver,
			name: 'editorState',
			version: 1.0,
			storeName: 'editor',
			description: 'scroll and cursor position, history, selection'
		});

		return {
			editor,
			files,
			services,
			providers,
			changes,
			handlers,
		};
	};

	const defaultCode = (_name) => [];

	const defaultTree = (_name) => ({
		[_name]: {
			"index.js": {},
			"package.json": {},
			"react-example.jsx": {},
		},
	});

	const defaultServices = () => [];

	const dummyService = (_id, _name) => ({
		id: _id + "",
		name: _name,
		code: defaultCode(_name),
		tree: defaultTree(_name),
	});

	async function getCodeFromStorageUsingTree(tree, fileStore, serviceName) {
		const flattenTree = this.utils.flattenTree;
		// returns array of  { name: filename, code: path, path }
		const files = flattenTree(tree);

		const allFilesFromService = {};
		const fileStoreKeys = await fileStore.keys();
		for(const key of fileStoreKeys){
			if (!key.startsWith(`./${serviceName}/`)) continue;
			allFilesFromService[key] = { key, untracked: true};
		}

		for (let index = 0; index < files.length; index++) {
			const file = files[index];
			let storedFile = allFilesFromService["." + file.path];
			storedFile && (storedFile.untracked = false);
		}

		const untracked = Object.entries(allFilesFromService)
			.map(([, value]) => value)
			.filter((x) => x.untracked === true)
			.map((x) => ({
				...x,
				name: x.key.split("/").pop(),
				path: x.key,
			}));

		return [...files, ...untracked]; // aka code array
	}

	class FileSearch {
		path;
		term;
		lines;

		currentLine;
		currentColumn;

		constructor(fileStore) {
			this.fileStore = fileStore;
		}
		async load(path) {
			this.path = path;
			const file = await this.fileStore.getItem(path);
			if (typeof file !== "string") {
				this.done = true;
				return;
			}
			this.lines = file.split("\n").map((x) => x.toLowerCase());
			this.reset();
		}
		reset() {
			this.currentLine = 0;
			this.currentColumn = 0;
			this.done = false;
		}
		next(term) {
			if (this.done) return -1;
			if (!this.lines || !this.path) return -1;

			if (term.toLowerCase() !== this.term) {
				this.term = term.toLowerCase();
				this.reset();
			}
			while (true) {
				const oldIndex = this.currentColumn;
				const newIndex = (this.lines[this.currentLine] || "").indexOf(
					this.term,
					this.currentColumn
				);
				if (newIndex === -1) {
					this.currentColumn = 0;
					this.currentLine++;
					if (this.currentLine > this.lines.length - 1) {
						this.done = true;
						return -1;
					}
					continue;
				}
				this.currentColumn = newIndex + 1;
				return {
					file: this.path,
					line: this.currentLine,
					column: this.currentColumn - 1,
					text: this.lines[this.currentLine]
						// TODO: break on previous word seperator
						.slice(
							oldIndex === 0
								? Math.max(0, newIndex - 30)
								: oldIndex + this.term.length - 1,
							Math.max(newIndex + 30 + this.term.length)
						)
						.trim(),
				};
			}
		}
	}

	class ServiceSearch {
		MAX_RESULTS = 10000;
		encoder = new TextEncoder();
		timer;
		stream;
		async init({ term, include = "./", /*exclude,*/ fileStore }) {
			this.timer = {
				t1: performance.now(),
			};
			const cache = {};
			await fileStore.iterate((value, key) => {
				const isIncluded = key.startsWith(include) ||
					`./${key}`.startsWith(include);
				if (!isIncluded) return;
				cache[key] = value;
			});
			const fileStoreCache = {
				getItem: async (key) => cache[key],
			};
			const fileSearch = new FileSearch(fileStoreCache);
			let count = 0;
			let currentFileIndex = -1;

			const files = Object.keys(cache);

			//console.log(`init: ${performance.now() - this.timer.t1} ms`)

			const thisEncoder = this.encoder;
			let streamResultCount = 0;
			this.stream = new ReadableStream({
				start(controller) {},

				// if it has search term, queue up search results per occurence
				// if not, search files until one is found with search term in it
				// when done with all files, close controller
				async pull(controller) {
					while (true) {
						try {
							const result = fileSearch.next(term);
							const doneReading =
								streamResultCount >= this.MAX_RESULTS ||
								(result === -1 && currentFileIndex === files.length - 1);
							if (doneReading) {
								controller.close();
								return;
							}
							if (result === -1) {
								await fileSearch.load(files[++currentFileIndex]);
								continue;
							}
							streamResultCount++;
							controller.enqueue(
								thisEncoder.encode(JSON.stringify(result) + "\n")
							);
						} catch (e) {
							console.log(e);
							controller.close();
							return;
						}
					}
				},
			});
		}
		// does this ever need to be awaited?
		async search(handler) {
			const reader = this.stream.getReader();
			let ct = 0;
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				handler(value);
				ct++;
				if (ct === this.MAX_RESULTS) break;
			}
			this.timer.t2 = performance.now();

			// should this be returned or passed to handler?
			// or should this be avoided and result totals passed with each stream item?
			handler({
				summary: {
					timer: this.timer.t2 - this.timer.t1,
					count: ct,
				},
			});
		}
	}

	async function getFileContents({
		filename,
		filesStore,
		cache,
		storagePath,
		fetchFileContents,
	}) {
		const cachedFile = await filesStore.getItem(filename);
		let contents;

		// https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
		if (cachedFile && cache !== "reload") {
			return cachedFile;
		}
		contents = await fetchFileContents(filename);
		if (storagePath) {
			filesStore.setItem(
				"." + storagePath.replace("/welcome/", "/.welcome/"),
				contents
			);
		} else {
			filesStore.setItem(filename, contents);
		}

		return contents;
	}

	//TODO: this is intense, but save a more granular approach for future
	async function fileSystemTricks({
		result,
		filesStore,
		cache,
		servicesStore,
		fetchFileContents,
	}) {
		const { safe, flattenTree } = this.utils;

		if (!safe(() => result.result[0].code.find)) {
			const parsed = JSON.parse(result.result[0].code);
			result.result[0].code = parsed.files;
			result.result[0].tree = parsed.tree;
			console.log("will weird things ever stop happening?");
			return;
		}
		const serviceJSONFile = result.result[0].code.find(
			(item) => item.name === "service.json"
		);
		if (serviceJSONFile && !serviceJSONFile.code) {
			//console.log('service.json without code');
			const filename = `./.${result.result[0].name}/service.json`;
			serviceJSONFile.code = await getFileContents({
				filename,
				filesStore,
				cache,
				fetchFileContents,
			});
		}
		if (serviceJSONFile) {
			//console.log('service.json without tree');
			let serviceJSON = JSON.parse(serviceJSONFile.code);
			if (!serviceJSON.tree) {
				const filename = `./${serviceJSON.path}/service.json`;
				serviceJSONFile.code = await getFileContents({
					filename,
					filesStore,
					cache,
					fetchFileContents,
				});
				serviceJSON = JSON.parse(serviceJSONFile.code);
			}
			result.result[0].code = serviceJSON.files;
			result.result[0].tree = {
				[result.result[0].name]: serviceJSON.tree,
			};
		}
		const len = safe(() => result.result[0].code.length);
		const flat = flattenTree(safe(() => result.result[0].tree));

		for (var i = 0; i < len; i++) {
			const item = result.result[0].code[i];
			if (!item.code && item.path) {
				const filename = "./" + item.path;
				const storagePath = (flat.find((x) => x.name === item.name) || {}).path;
				item.code = await getFileContents({
					filename,
					filesStore,
					cache,
					storagePath,
					fetchFileContents,
				});
			}
		}

		if (!result.result[0].name) {
			console.error("cannot set services store item without name");
			return;
		}
		await servicesStore.setItem(result.result[0].id + "", {
			name: result.result[0].name,
			id: result.result[0].id,
			tree: result.result[0].tree,
		});
	}

	/* TODO:
		file get runs slower here versus previous version
		is this the problem? potential issues
		local forage has to JSON.parse change store items to get the value
		changes store has to be queried before file store can be checked
		file store is huge because of policy of pulling all repo items
	*/
	function cacheFn(fn, ttl) {
		const cache = {}

		const apply = (target, thisArg, args) => {
			const key = target.name;
			cache[key] = cache[key] || {}
			const argsKey = args.toString()
			const cachedItem = cache[key][argsKey];
			if (cachedItem) return cachedItem;

			cache[key][argsKey] = target.apply(thisArg, args);
			setTimeout(() => {
				delete cache[key][argsKey];
			}, ttl);
			return cache[key][argsKey];
		};

		return new Proxy(fn, { apply });
	}

	let changeCache, fileCache, servicesCache;
	let cacheTTL = 250;
	let serviesCacheTTL = 500;
	async function getFile(path){
		const changesStore = this.stores.changes;
		const filesStore = this.stores.files;
		const servicesStore = this.stores.services;
		const { fetchFileContents } = this.utils;

		const getAllServices = async () => {
			const keys = await servicesStore.keys();
			let services = [];
			for(let i=0, len=keys.length; i<len; i++){
				const thisService = await servicesStore.getItem(keys[i]);
				services.push(thisService);
			}
			return services;
		};

		changeCache = changeCache || cacheFn(changesStore.getItem.bind(changesStore), cacheTTL);
		fileCache = fileCache || cacheFn(filesStore.getItem.bind(filesStore), cacheTTL);
		servicesCache = servicesCache || cacheFn(getAllServices, serviesCacheTTL);

		let t0 = performance.now();
		const perfNow = () => {
			const d = performance.now() - t0;
			t0 = performance.now();
			return d.toFixed(3);
		};

		const changes = await changeCache(path);
		console.log(`changes store: ${perfNow()}ms (${path})`);
		if(changes && changes.type === 'update'){
			return changes.value;
		}

		let file = await fileCache(path);
		console.log(`file store: ${perfNow()}ms (${path})`);

		if(file && file.includes && file.includes('##PLACEHOLDER##')){
			const services = await servicesCache();
			services.sort((a,b) => b.name.length - a.name.length);

			let serviceFile;
			let thisService = {};
			for(let i=0, len=services.length; i<len; i++){
				thisService = services[i];
				if(thisService.type !== 'github' || !thisService.git || !thisService.git.tree) continue;
				if(!path.startsWith(thisService.name)) continue;
				serviceFile = thisService.git.tree
					.find(x => path === `${thisService.name}/${x.path}`);
				if(serviceFile) break;
			}
			if(!serviceFile) return file;

			const getFileContents = async ({ path }) => {
				try {
					const contentUrl = 'https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{path}'
						.replace('{path}', path)
						.replace('{owner}', thisService.owner)
						.replace('{repo}', thisService.repo)
						.replace('{sha}', thisService.git.sha);
					const contents = await fetchFileContents(contentUrl);
					return contents;
				} catch(e){
					console.error(e);
					return;
				}
			};

			file = await getFileContents(serviceFile);
			if(file) filesStore.setItem(path, file);
		}

		return file;
	}

	const handleServiceSearch = (fileStore) => async (params, event) => {
		const serviceSearch = new ServiceSearch();
		await serviceSearch.init({ ...params, fileStore });
		return serviceSearch.stream;
	};

	const handleServiceRead = (
		servicesStore, filesStore, fetchFileContents, changesStore
	) => {
		const stores = {
			files: filesStore,
			services: servicesStore,
			changes: changesStore
		};
		return async function (params, event) {
			//also, what if not "file service"?
			//also, what if "offline"?

			//THIS ENDPOINT SHOULD BE (but is not now) AS DUMB AS:
			// - if id passed, return that id from DB
			// - if no id passed (or * passed), return all services from DB
			const cacheHeader = event.request.headers.get("x-cache");

			const defaults = defaultServices();

			//if not id, return all services
			const noValidId = (Number(params.id) !== 0 && !params.id);
			if (noValidId || params.id === "*") {
				const savedServices = [];
				await servicesStore.iterate((value, key) => {
					savedServices.push(value);
				});

				for (var i = 0, len = savedServices.length; i < len; i++) {
					const service = savedServices[i];
					const code = await this.getCodeFromStorageUsingTree(
						service.tree,
						filesStore,
						service.name
					);
					service.code = code;
				}
				//console.log({ defaults, savedServices });

				const allServices = [...defaults, ...savedServices]
					.sort((a, b) => Number(a.id) - Number(b.id))
					.map((x) => ({ id: x.id, name: x.name }));

				return JSON.stringify({
					result: this.utils.unique(allServices, (x) => Number(x.id)),
				}, null, 2);
			}

			const addTreeState = async (service) => {
				const changed = (await changesStore.keys())
					.filter(x => x.startsWith(`${service.name}`))
					.map(x => x.split(service.name+'/')[1]);
				const opened = (await changesStore.getItem(`state-${service.name}-opened`)) || [];
				const selected = (opened.find(x => x.order === 0)||{}).name || '';
				service.state = { opened, selected, changed };

				service.treeState = {
					expand: (await changesStore.getItem(`tree-${service.name}-expanded`)) || [],
					select: selected,
					changed,
					new: [], //TODO: from changes store
				};
			};

			// if id, return that service
			// (currently doesn't do anything since app uses localStorage version of this)
			await filesStore.setItem("lastService", params.id);

			let foundService = await servicesStore.getItem(params.id);

			if(!foundService && [0, '0'].includes(params.id)){
				const root = new RootService(stores);
				foundService = await root.init();
			}

			if (foundService) {
				foundService.code = await this.getCodeFromStorageUsingTree(
					foundService.tree,
					filesStore,
					foundService.name
				);
				await addTreeState(foundService);
				return JSON.stringify({
					result: [foundService],
				}, null, 2);
			}

			//TODO (AND WARNING): get this from store instead!!!
			// currently will only return fake/default services
			const lsServices = defaultServices() || [];
			const result = {
				result:
					params.id === "*" || !params.id
						? lsServices
						: lsServices.filter((x) => Number(x.id) === Number(params.id)),
			};
			await this.fileSystemTricks({
				result,
				filesStore,
				servicesStore,
				cache: cacheHeader,
				fetchFileContents,
			});

			result.forEach(addTreeState);
			return JSON.stringify(result, null, 2);
		};
	};

	class StorageManager {
		stores = getStores();
		defaultServices = defaultServices;
		getCodeFromStorageUsingTree = getCodeFromStorageUsingTree.bind(this);
		fileSystemTricks = fileSystemTricks.bind(this);
		getFile = getFile.bind(this);

		constructor({ utils }) {
			this.utils = utils;
			this.handlers = {
				serviceSearch: handleServiceSearch(this.stores.files),
				serviceRead: handleServiceRead(
					this.stores.services,
					this.stores.files,
					utils.fetchFileContents,
					this.stores.changes
				).bind(this),
			};
		}
	}
	return StorageManager;
})();


export {
	StorageManager,
};

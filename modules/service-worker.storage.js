(() => {

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

		return {
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

	async function getCodeFromStorageUsingTree(tree, store, serviceName) {
		const flattenTree = this.utils.flattenTree;
		// flatten the tree (include path)
		// pass back array of  { name: filename, code: path, path }
		const files = flattenTree(tree);

		const allFilesFromService = {};
		await store.iterate((value, key) => {
			if (key.startsWith(`./${serviceName}/`)) {
				allFilesFromService[key] = {
					key,
					code: value,
					untracked: true,
				};
			}
		});

		// UI should call network(sw) for file
		// BUT for now, will bundle entire filesystem with its contents
		for (let index = 0; index < files.length; index++) {
			const file = files[index];
			let storedFile = allFilesFromService["." + file.path];
			file.code = storedFile ? storedFile.code : "";
			storedFile && (storedFile.untracked = false);

			// OMG, live it up in text-only world... for now (templates code expects text format)
			file.code = file.size
				? null
				: file.code;
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
				if (!key.startsWith(include)) return;
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

	const handleServiceSearch = (fileStore) => async (params, event) => {
		const serviceSearch = new ServiceSearch();
		await serviceSearch.init({ ...params, fileStore });
		return serviceSearch.stream;
	};

	const handleServiceRead = (servicesStore, filesStore, fetchFileContents, ui) =>
		async function (params, event) {
			//also, what if not "file service"?
			//also, what if "offline"?

			//THIS ENDPOINT SHOULD BE (but is not now) AS DUMB AS:
			// - if id passed, return that id from DB
			// - if no id passed (or * passed), return all services from DB
			const cacheHeader = event.request.headers.get("x-cache");

			if (Number(params.id) === 0) return await ui.read();

			const defaults = defaultServices();

			//if not id, return all services
			if (!params.id || params.id === "*") {
				//TODO: include Fuig Service here, too!!!
				const savedServices = [];
				await servicesStore.iterate((value, key) => {
					savedServices.push(value);
				});

				//TODO: may not want to return all code!!!
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

				return JSON.stringify(
					{
						result: this.utils.unique(allServices, (x) => Number(x.id)),
					},
					null,
					2
				);
			}

			// if id, return that service
			// (currently doesn't do anything since app uses localStorage version of this)
			await filesStore.setItem("lastService", params.id);

			const foundService = await servicesStore.getItem(params.id);

			if (foundService) {
				foundService.code = await this.getCodeFromStorageUsingTree(
					foundService.tree,
					filesStore,
					foundService.name
				);
				return JSON.stringify(
					{
						result: [foundService],
					},
					null,
					2
				);
			}

			//TODO (AND WANRING): get this from store instead!!!
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
			return JSON.stringify(result, null, 2);
		};

	class StorageManager {
		stores = getStores();
		defaultServices = defaultServices;
		getCodeFromStorageUsingTree = getCodeFromStorageUsingTree.bind(this);
		fileSystemTricks = fileSystemTricks.bind(this);

		constructor({ utils, ui }) {
			this.utils = utils;
			this.handlers = {
				serviceSearch: handleServiceSearch(this.stores.files),
				serviceRead: handleServiceRead(
					this.stores.services,
					this.stores.files,
					utils.fetchFileContents,
					ui
				).bind(this),
			};
		}
	}

	module.exports = {
		StorageManager,
	};
})();

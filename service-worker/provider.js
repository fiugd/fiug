const ProviderManager = (() => {
	const stringify = o => JSON.stringify(o,null,2);

	async function _fetchFileContents(url, opts) {
		const storeAsBlob = [
			"image/",
			"audio/",
			"video/",
			"wasm",
			"application/zip",
			'application/octet-stream'
		];
		const storeAsBlobBlacklist = ["image/svg", "image/x-portable-pixmap"];
		const fileNameBlacklist = [
			".ts", // mistaken as video/mp2t
		].map(x => new RegExp(`${x}\$`.replace(/\./, '\.')));

		const fetched = await fetch(url, opts);
		const contentType = fetched.headers.get("Content-Type");

		let _contents =
			storeAsBlob.find((x) => contentType.includes(x)) &&
			!storeAsBlobBlacklist.find((x) => contentType.includes(x)) &&
			!fileNameBlacklist.find((x) => x.test(url))
				? await fetched.blob()
				: await fetched.text();
		return _contents;
	}

	const bbpTest = () => () => 'not implemented'; //handleProviderTest
	const bbpCreate = () => () => 'not implemented'; //handleProviderCreate
	const bbpRead = () => () => 'not implemented'; //handleProviderRead
	const bbpUpdate = () => () => 'not implemented'; //handleProviderUpdate
	const bbpDelete = () => () => 'not implemented'; //handleProviderDelete

	const bbpServiceCreate = () => () => 'not implemented';
	const bbpServiceRead = () => () => 'not implemented';
	const bbpServiceUpdate = () => () => 'not implemented';
	const bbpServiceDelete = () => () => 'not implemented';

	const bbpFileCreate = () => () => 'not implemented';
	const bbpFileRead = () => () => 'not implemented';
	const bbpFileUpdate = () => () => 'not implemented'; //providerFileChange
	const bbpFileDelete = () => () => 'not implemented'; //providerFileChange

	class BasicBartokProvider {
		constructor ({ key, storage }) {
			return new Promise((resolve, reject) => {
				try {
					this.key = key;
					this.storage = storage;

					//MAYBE: read provider storage provider
					//MAYBE: read service storage for list of this provider's services

					this.test = bbpTest(this);
					this.create = bbpCreate(this);
					this.read = bbpRead(this);
					this.update = bbpDelete(this);
					this.delete = bbpDelete(this);

					// most of this is handled in services logic
					this.services = {};
					//providerCreateServiceHandler (creates service based on this.files.read)
					this.services.create = bbpServiceCreate(this);
					this.services.read = bbpServiceRead(this);
					//providerCreateServiceHandler (updates service based on this.files.read)
					this.services.update = bbpServiceUpdate(this);
					this.services.delete = bbpServiceDelete(this);

					this.files = {};
					//providerFileChange (called from services.handleServiceUpdate)
					this.files.create = bbpServiceCreate(this);
					//providerCreateServiceHandler (reads files from provider into service)
					//creates/updates service files based on this read
					this.files.read = bbpServiceRead(this);
					//providerFileChange (called from services.handleServiceUpdate)
					//providerUpdateServiceJson (this is really a this.files.update for service.json)
					this.files.update = bbpServiceUpdate(this);
					//providerFileChange (called from services.handleServiceUpdate)
					this.files.delete = bbpServiceDelete(this);

					resolve(this);
				} catch(error) {
					reject(error);
				}
			});
		}
	}

	const handleProviderTest = ({ github}) => async (params, event) => {
		// in the future, will cycle through ALL providers and return repsonse from one
		const githubResponse = github && await github.handler('test', { params, event });
		if(githubResponse) return githubResponse;

		const body = await event.request.json();
		const { providerType, providerUrl, providerAccessToken } = body;
		const isSupported = ["basic-bartok-provider", "github-provider"].includes(
			providerType
		);
		if (!isSupported) stringify({ error: `Unsupported provider type: ${providerType}` });
		if (providerType === "github-provider")  stringify({ success: true, todo: "test user's access token" });

		const fileUrl = (providerUrl + "/file/").replace("//file/", "/file/");
		const treeUrl = (providerUrl + "/tree/").replace("//tree/", "/tree/");
		try {
			const baseRes = await fetch(providerUrl);
			if (baseRes.status !== 200) return stringify({ error: `Failed to connect to provider at: ${providerUrl}` });
		} catch (e) {
			return stringify({ error: `Failed to connect to provider at: ${providerUrl}` });
		}
		try {
			const fileRes = await fetch(fileUrl);
			if (fileRes.status !== 200) return stringify({ error: `Failed to connect to provider at: ${fileUrl}` });
		} catch (e) {
			return stringify({ error: `Failed to connect to provider at: ${fileUrl}` });
		}
		try {
			const treeRes = await fetch(treeUrl);
			if (treeRes.status !== 200) return stringify({ error: `Failed to connect to provider at: ${treeUrl}` });
		} catch (e) {
			return stringify({ error: `Failed to connect to provider at: ${treeUrl}` });
		}
		return stringify({ success: true });
	};

	const handleProviderCreate = ({ create, github }) => async (params, event) => {
		// in the future, will cycle through ALL providers and return repsonse from one
		const githubResponse = github && await github.handler('create', { params, event });
		if(githubResponse) return githubResponse;

		try {
			const body = await event.request.json();
			const { providerType, providerUrl } = body;
			const isSupported = ["basic-bartok-provider"].includes(providerType);
			if (!isSupported) stringify({ error: `Unsupported provider type: ${providerType}` });
			const provider = await create({
				id: providerUrl,
				url: providerUrl,
			});
			return stringify({ success: true, provider });
		} catch (error) {
			return stringify({ error });
		}
	};

	const handleProviderRead = () => async (params, event) => {
		console.error(
			"not implemented: provider read.  Should return one or all saved provider details."
		);
		return stringify({ error: "not implemented" });
	};

	const handleProviderUpdate = () => async (params, event) => {
		console.error(
			"not implemented: provider update.  Should update provider details."
		);
		return stringify({ error: "not implemented" });
	};

	const handleProviderDelete = () => async (params, event) => {
		console.error(
			"not implemented: provider delete.  Should delete saved provider."
		);
		return stringify({ error: "not implemented" });
	};

	const handleCreateCommit = ({ github }) => async (params, event) => {
		const githubResponse = github && await github.handler('createCommit', { params, event });
		if(githubResponse) return githubResponse;
		return stringify({ error: "commits are only implemented for github repos" });
	};

	// servicesCreate
	async function _providerCreateServiceHandler(event) {
		const servicesStore = this.stores.services;
		const filesStore = this.stores.files;

		// in the future, will cycle through ALL providers and return repsonse from one
		const githubResponse = this.github && await this.github.handler('servicesCreate', { event });
		if(githubResponse) return githubResponse;

		try {
			const body = await event.request.json();
			let { providerType, providerUrl, providerAccessToken, repoName } = body;

			/*
				reminder:
					- providers create services that have provider attribute
					- services act like servers within service worker
					- for github this is a two step process because file system is not handling target selection as with bartok servers

				if github provider and no accessToken
					- reject
				if github provider and repoName
					- read repository list for logged in user (providerAccessToken
					- return to UI for selection
				if both of these
					- recursively read tree
					- add files as you go (with file contents or sync|read-one-by-one later?)
					- create service using repository name
			*/

			const isSupported = ["basic-bartok-provider"].includes(providerType);
			if (!isSupported) return stringify({ error: `Unsupported provider type: ${providerType}` });
			const provider = await this.read(providerUrl);
			if (!provider) return stringify({ error: `Provider does not exist: ${providerUrl}` });

			// TODO: treeUrl, fileUrl aka provider.getTree should be on provider at this point
			// maybe even provider.supported should be there
			const treeUrl = (providerUrl + "/tree/").replace("//tree/", "/tree/");
			const fileUrl = (providerUrl + "/file/").replace("//file/", "/file/");
			const allServices = [];
			await servicesStore.iterate((value, key) => {
				allServices.push(value);
			});

			const baseRes = await fetch(treeUrl);
			if (baseRes.status !== 200) return stringify({ error: `Failed to connect to provider at: ${providerUrl}` });
			const {
				files: providerFiles,
				root: providerRoot,
				tree: providerTree,
			} = await baseRes.json();
			const providerRootName = providerRoot.split("/").pop();

			const foundService = allServices.find((x) => x.name === providerRootName);
			const id = foundService
				? foundService.id
				: allServices.reduce((all, one) => {
						return Number(one.id) >= all ? Number(one.id) + 1 : all;
					}, 1);

			const service = {
				name: providerRootName,
				id,
				providerRoot,
				providerUrl,
				tree: providerTree,
			};
			if (!service.name) {
				console.error("cannot set services store item without service name");
				return;
			}
			await servicesStore.setItem(id + "", service);
			service.code = [];
			for (let f = 0; f < providerFiles.length; f++) {
				const filePath = providerFiles[f];
				const fileContents = await this.utils.fetchFileContents(
					`${fileUrl}${providerRoot}/${filePath}`
				);
				filesStore.setItem(
					`./${providerRootName}/${filePath}`,
					fileContents
				);
				service.code.push({
					name: filePath.split("/").pop(),
					path: `./${providerRootName}/${filePath}`,
					code: typeof fileContents === "string" ? fileContents : "",
				});
			}
			await this.providerUpdateServiceJson({ service, servicesStore, filesStore });

			await this.app.addServiceHandler({
				name: providerRootName,
				msg: "served from fresh baked",
			});
			return stringify({ result: { services: [service] } });
		} catch (error) {
			console.error(error);
			return stringify({ error });
		}
	}
	// servicesRead
	// servicesUpdate
	const _providerUpdateServiceJson = async function({ service, servicesStore, filesStore, }) {
		// in the future, will cycle through ALL providers and return repsonse from one
		const githubResponse = this.github && await this.github.handler('servicesUpdate', { service });
		if(githubResponse) return githubResponse;

		const serviceJsonFile = service.code.find((x) =>
			x.path.includes("/service.json")
		);
		if (!serviceJsonFile) return;
		const serviceJson = JSON.parse(serviceJsonFile.code);

		const { code, ...serviceOther } = service;
		const { providerUrl, providerRoot } = service;

		serviceJson.tree = service.tree[service.name];
		serviceJson.files = service.code
			.map((x) => ({
				name: x.name,
				path: x.path.replace("./", ""),
			}))
			.sort((a, b) => {
				if (a.name.toLowerCase() > b.name.toLowerCase()) {
					return 1;
				}
				if (a.name.toLowerCase() < b.name.toLowerCase()) {
					return -1;
				}
				return 0;
			});
		const pathWithoutParent = serviceJsonFile.path.replace(
			"./" + service.name,
			""
		);
		const filePostUrl = `${providerUrl}file/${providerRoot}${pathWithoutParent}`;

		serviceJsonFile.code = stringify(serviceJson);
		if (!serviceOther.name) {
			console.error("cannot set services store item without service name");
			return;
		}
		await servicesStore.setItem(service.id + "", serviceOther);
		await filesStore.setItem(serviceJsonFile.path, serviceJsonFile.code);
		await fetch(filePostUrl, {
			method: "post",
			body: serviceJsonFile.code,
		});
	};
	// servicesDelete

	// filesCreate
	// filesRead
	// filesUpdate
	async function _providerFileChange(args) {
		let { path, code, parent:service, deleteFile } = args;

		// in the future, will cycle through ALL providers and return repsonse from one
		const githubResponse = this.github && await this.github.handler('filesUpdate', args);
		if(githubResponse) return githubResponse;

		service = service ||
			(await this.stores.services.iterate((value, key) => {
				if (value.name === service || value.name === service.name) {
					return value;
				}
			}));
		if (!service || !service.providerUrl)
			throw new Error(
				"file not saved to provider: service not associated with a provider"
			);
		const { providerUrl, providerRoot } = service;
		const pathWithoutParent = path.replace("./" + service.name, "");
		const filePostUrl = `${providerUrl}file/${providerRoot}${pathWithoutParent}`;

		const filePostRes = await this.utils.fetchJSON(filePostUrl, {
			method: deleteFile ? "DELETE" : "POST",
			body: deleteFile ? undefined : code,
		});
		if (filePostRes.error) throw new Error(filePostRes.error);
		return filePostRes;
	}
	// filesDelete

	class ProviderManager {
		constructor({ app, storage, utils, GithubProvider }) {
			return new Promise(async (resolve) => {
				try {
					this.app = app;
					this.storage = storage;
					this.utils = utils;
					this.fetchContents = _fetchFileContents.bind(this);

					// I kinda don't like either of these (or thier usage)
					this.store = storage.stores.providers;
					this.stores = storage.stores;

					this.github = await new GithubProvider(this);

					this.handlers = {
						testHandler: handleProviderTest(this),
						createHandler: handleProviderCreate(this),
						readHandler: handleProviderRead(this),
						updateHandler: handleProviderUpdate(this),
						deleteHandler: handleProviderDelete(this),

						createCommit: handleCreateCommit(this),
					};

					// servicesCreate
					this.createServiceHandler = _providerCreateServiceHandler.bind(this);
					// servicesRead
					// servicesUpdate
					this.providerUpdateServiceJson = _providerUpdateServiceJson.bind(this);
					// servicesDelete

					// filesCreate
					// filesRead
					// filesUpdate
					this.fileChange = _providerFileChange.bind(this);
					// filesDelete

					resolve(this);
				} catch(error) {
					reject(error);
				}
			});
		}

		create = async (provider) => {
			return await this.store.setItem(provider.id + "", provider);
		};

		read = async (id) => {
			if (!id) {
				return await this.store.keys();
			}
			return await this.store.getItem(id);
		};

		update = async (id, updates) => {
			const provider = await this.read(id);
			if (updates.id && updates.id !== id) {
				await this.delete(id);
			}
			return await this.store.setItem((updates.id || provider.id) + "", {
				...provider,
				...updates,
			});
		};

		delete = async (id) => {
			return await this.store.removeItem(id);
		};
	}

	return ProviderManager;
})();

export {
	ProviderManager,
};


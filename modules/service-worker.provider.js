(() => {
	async function providerFileChange({ path, code, parent, deleteFile }) {
		const foundParent =
			parent ||
			(await this.stores.services.iterate((value, key) => {
				if (value.name === parent || value.name === parent.name) {
					return value;
				}
			}));
		if (!foundParent || !foundParent.providerUrl)
			throw new Error(
				"file not saved to provider: service not associated with a provider"
			);
		const { providerUrl, providerRoot } = foundParent;
		const pathWithoutParent = path.replace("./" + foundParent.name, "");
		const filePostUrl = `${providerUrl}file/${providerRoot}${pathWithoutParent}`;

		const filePostRes = await this.utils.fetchJSON(filePostUrl, {
			method: deleteFile ? "DELETE" : "POST",
			body: deleteFile ? undefined : code,
		});
		if (filePostRes.error) throw new Error(filePostRes.error);
		return filePostRes;
	}

	const handleProviderTest = () => async (params, event) => {
		try {
			const body = await event.request.json();
			const { providerType, providerUrl, providerAccessToken } = body;
			const isSupported = ["basic-bartok-provider", "github-provider"].includes(
				providerType
			);
			if (!isSupported) {
				return JSON.stringify(
					{
						error: `Unsupported provider type: ${providerType}`,
					},
					null,
					2
				);
			}
			if (providerType === "github-provider") {
				return JSON.stringify({
					success: true,
					todo: "test user's access token",
				});
			}
			const fileUrl = (providerUrl + "/file/").replace("//file/", "/file/");
			const treeUrl = (providerUrl + "/tree/").replace("//tree/", "/tree/");
			try {
				const baseRes = await fetch(providerUrl);
				if (baseRes.status !== 200) {
					return JSON.stringify(
						{
							error: `Failed to connect to provider at: ${providerUrl}`,
						},
						null,
						2
					);
				}
			} catch (e) {
				return JSON.stringify(
					{
						error: `Failed to connect to provider at: ${providerUrl}`,
					},
					null,
					2
				);
			}
			try {
				const fileRes = await fetch(fileUrl);
				if (fileRes.status !== 200) {
					return JSON.stringify(
						{
							error: `Failed to connect to provider at: ${fileUrl}`,
						},
						null,
						2
					);
				}
			} catch (e) {
				return JSON.stringify(
					{
						error: `Failed to connect to provider at: ${fileUrl}`,
					},
					null,
					2
				);
			}
			try {
				const treeRes = await fetch(treeUrl);
				if (treeRes.status !== 200) {
					return JSON.stringify(
						{
							error: `Failed to connect to provider at: ${treeUrl}`,
						},
						null,
						2
					);
				}
			} catch (e) {
				return JSON.stringify(
					{
						error: `Failed to connect to provider at: ${treeUrl}`,
					},
					null,
					2
				);
			}
			return JSON.stringify(
				{
					success: true,
				},
				null,
				2
			);
		} catch (e) {
			return JSON.stringify(
				{
					error: e,
				},
				null,
				2
			);
		}
	};

	const handleProviderCreate = ({ create }) => async (params, event) => {
		try {
			const body = await event.request.json();
			const { providerType, providerUrl } = body;
			const isSupported = ["basic-bartok-provider"].includes(providerType);
			if (!isSupported) {
				return JSON.stringify(
					{
						error: `Unsupported provider type: ${providerType}`,
					},
					null,
					2
				);
			}
			const provider = await create({
				id: providerUrl,
				url: providerUrl,
			});
			return JSON.stringify(
				{
					success: true,
					provider,
				},
				null,
				2
			);
		} catch (e) {
			return JSON.stringify(
				{
					error: e,
				},
				null,
				2
			);
		}
	};

	const handleProviderRead = () => async (params, event) => {
		console.error(
			"not implemented: provider read.  Should return one or all saved provider details."
		);
		return JSON.stringify({
			error:
				"not implemented: provider read.  Should return one or all saved provider details.",
		});
	};

	const handleProviderUpdate = () => async (params, event) => {
		console.error(
			"not implemented: provider update.  Should update provider details."
		);
		return JSON.stringify({
			error:
				"not implemented: provider update.  Should update provider details.",
		});
	};

	const handleProviderDelete = () => async (params, event) => {
		console.error(
			"not implemented: provider delete.  Should delete saved provider."
		);
		return JSON.stringify({
			error: "not implemented: provider delete.  Should delete saved provider.",
		});
	};

	const providerUpdateServiceJson = async ({
		service,
		servicesStore,
		fileStore,
	}) => {
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

		serviceJsonFile.code = JSON.stringify(serviceJson, null, 2);
		if (!serviceOther.name) {
			console.error("cannot set services store item without service name");
			return;
		}
		await servicesStore.setItem(service.id + "", serviceOther);
		await fileStore.setItem(serviceJsonFile.path, serviceJsonFile.code);
		await fetch(filePostUrl, {
			method: "post",
			body: serviceJsonFile.code,
		});
	};

	async function providerCreateServiceHandler(event) {
		console.warn("providerCreateServiceHandler");
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
			if (!isSupported) {
				return JSON.stringify({
					error: `Unsupported provider type: ${providerType}`,
				});
			}
			const provider = await this.read(providerUrl);
			if (!provider) {
				return JSON.stringify({
					error: `Provider does not exist: ${providerUrl}`,
				});
			}
			// TODO: treeUrl, fileUrl aka provider.getTree should be on provider at this point
			// maybe even provider.supported should be there
			const treeUrl = (providerUrl + "/tree/").replace("//tree/", "/tree/");
			const fileUrl = (providerUrl + "/file/").replace("//file/", "/file/");
			const allServices = [];
			await this.stores.services.iterate((value, key) => {
				allServices.push(value);
			});

			const baseRes = await fetch(treeUrl);
			if (baseRes.status !== 200) {
				return JSON.stringify({
					error: `Failed to connect to provider at: ${providerUrl}`,
				});
			}
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
			await this.stores.services.setItem(id + "", service);
			service.code = [];
			for (let f = 0; f < providerFiles.length; f++) {
				const filePath = providerFiles[f];
				const fileContents = await this.utils.fetchFileContents(
					`${fileUrl}${providerRoot}/${filePath}`
				);
				this.stores.files.setItem(
					`./${providerRootName}/${filePath}`,
					fileContents
				);
				service.code.push({
					name: filePath.split("/").pop(),
					path: `./${providerRootName}/${filePath}`,
					code: typeof fileContents === "string" ? fileContents : "",
				});
			}
			await providerUpdateServiceJson({
				service,
				servicesStore: this.stores.services,
				fileStore: this.stores.files,
			});

			await this.app.addServiceHandler({
				name: providerRootName,
				msg: "served from fresh baked",
			});
			return JSON.stringify(
				{
					result: {
						services: [service],
					},
				},
				null,
				2
			);
		} catch (e) {
			console.error(e);
			return JSON.stringify(
				{
					error: e,
				},
				null,
				2
			);
		}
	}

	class ProviderManager {
		constructor({ app, storage, utils }) {
			this.app = app;
			this.store = storage.stores.providers;

			this.stores = storage.stores;
			this.utils = utils;
			this.handlers = {
				testHandler: handleProviderTest(this),
				createHandler: handleProviderCreate(this),
				readHandler: handleProviderRead(this),
				updateHandler: handleProviderUpdate(this),
				deleteHandler: handleProviderDelete(this),
			};
			// related to services that are hosted by provider
			this.createServiceHandler = providerCreateServiceHandler.bind(this);
			this.fileChange = providerFileChange.bind(this);
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

	module.exports = {
		ProviderManager,
	};
})();

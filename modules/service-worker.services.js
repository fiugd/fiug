(() => {
	const stringify = o => JSON.stringify(o,null,2);

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

	const handleServiceChange = ({ storage, ui, utils }) => async (
		params,
		event
	) => {
		const servicesStore = storage.stores.services;
		const filesStore = storage.stores.files;
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
			let { path, code, command, service } = jsonData;
			if (fileData) {
				code = fileData || "";
			}

			if (service && service === ui.name)
				return ui.change({ path, code, command, service });

			await filesStore.setItem(path, code);

			if (command === "upsert") {
				const serviceToUpdate = await servicesStore.iterate((value, key) => {
					if (value.name === service) return value;
					return;
				});
				serviceToUpdate.tree = utils.treeInsertFile(path, serviceToUpdate.tree);
				await servicesStore.setItem(serviceToUpdate.id + "", serviceToUpdate);
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

	const handleServiceUpdate = ({ storage, providers, ui, utils }) => async (
		params,
		event
	) => {
		const servicesStore = storage.stores.services;
		const filesStore = storage.stores.files;

		try {
			const { id } = params;
			const body = await event.request.json();
			const { name } = body;

			const parsedCode =
				!Array.isArray(body.code) && utils.safe(() => JSON.parse(body.code));
			if (parsedCode && parsedCode.tree) {
				body.tree = parsedCode.tree;
				body.code = parsedCode.files;
			}

			if (id === ui.id || id === ui.id.toString())
				return ui.update({ service: body });

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

			const storageFiles = await storage.getCodeFromStorageUsingTree(
				body.tree,
				filesStore,
				service.name
			);
			const updateAsStore = utils.getCodeAsStorage(
				body.tree,
				body.code,
				service.name
			);

			const allServiceFiles = [];
			await filesStore.iterate((value, key) => {
				if (
					new RegExp(
						name === "welcome" ? "^./.welcome/" : "^./" + name + "/"
					).test(key)
				) {
					const path = key
						.replace("./", "/")
						.replace("/.welcome/", "/welcome/");
					allServiceFiles.push({ key, value, path });
				}
			});

			const filesToUpdate = [];
			const filesToDelete = [];
			const binaryFiles = [];

			// update or create all files in update
			for (let i = 0; i < updateAsStore.length; i++) {
				const file = updateAsStore[i];
				const storageFile = storageFiles.find((x) => x.path === file.key);
				// if(file.key.includes('/.keep')){
				//     continue;
				// }
				if (file && (!storageFile || !storageFile.code)) {
					filesToUpdate.push(file);
					continue;
				}
				if (typeof storageFile.code !== "string") {
					binaryFiles.push(file);
					continue;
				}
				if (file.value && file.value.code === storageFile.code) {
					continue;
				}
				filesToUpdate.push(file);
			}

			// TODO: binary files
			//console.warn(`may need to update binary files!`);
			//console.log(binaryFiles.map((x) => x.key));

			// delete any storage files that are not in service
			for (let i = 0; i < allServiceFiles.length; i++) {
				const serviceFile = allServiceFiles[i];
				if (serviceFile.key.includes("/.keep")) {
					continue;
				}
				const found = updateAsStore.find(
					(x) => x.key === serviceFile.path || "." + x.key === serviceFile.key
				);
				if (found) continue;
				filesToDelete.push(serviceFile.key);
			}

			// update files
			for (let i = 0; i < filesToUpdate.length; i++) {
				const update = filesToUpdate[i];
				let code;
				try {
					code = update.value.code.code;
				} catch (e) {}
				try {
					code = code || update.value.code;
				} catch (e) {}
				try {
					code = code || "\n\n";
				} catch (e) {}

				await filesStore.setItem(
					"." + update.key.replace("/welcome/", "/.welcome/"),
					code
				);
				await providers.fileChange({
					path: "." + update.key,
					code,
					parent: service,
				});
			}
			// delete files
			for (let i = 0; i < filesToDelete.length; i++) {
				const key = filesToDelete[i];
				await filesStore.removeItem(key);
				await providers.fileChange({
					path: key,
					parent: service,
					deleteFile: true,
				});
			}

			return stringify({ result: [body] });
		} catch (error) {
			console.error(error);
			return stringify({ error });
		}
	};

	const handleServiceDelete = () => (params, event) => {
		console.log("/service/delete/:id? triggered");
		return stringify({ params, event });
	};

	class ServicesManager {
		constructor({ app, storage, providers, ui, utils }) {
			this.app = app;
			this.storage = storage;
			this.providers = providers;
			this.ui = ui;
			this.utils = utils;

			this.handlers = {
				serviceCreate: handleServiceCreate(this),
				serviceChange: handleServiceChange(this),
				serviceUpdate: handleServiceUpdate(this),
				serviceDelete: handleServiceDelete(this),
			};
		}
	}

	module.exports = {
		ServicesManager,
	};
})();

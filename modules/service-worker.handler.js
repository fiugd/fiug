const require = (url) => {
	self.module = { exports: {} };
	importScripts(url.replace("./", "./modules/"));
	const { exports } = self.module;
	delete self.module;
	return exports;
};

(async () => {
	const swHandlers = self.handlers;

	const utils = require("./service-worker.utils.js");
	utils.initMimeTypes();

	const { StorageManager } = require("./service-worker.storage.js");
	const { Router } = require("./service-worker.router.js");
	const { UIManager } = require("./service-worker.ui.js");
	const { ProviderManager } = require("./service-worker.provider.js");
	const { GithubProvider } = require("./service-worker.provider.github.js");

	const { ServicesManager } = require("./service-worker.services.js");
	const { TemplateEngine } = require("./service-worker.templates.js");

	//TODO: ideally, would not allow generic access of storage, instead access Manager methods
	const ui = new UIManager("fiug"); // ui manager is a special kind of storage
	const storage = new StorageManager({ utils, ui });
	ui.init(storage.stores.handlers, storage.stores.changes);

	const templates = new TemplateEngine({ storage });

	const app = new Router({ storage, templates, swHandlers });
	const providers = await new ProviderManager({
		app, storage, utils, GithubProvider
	});
	const services = new ServicesManager({
		app, storage, providers, ui, utils, templates
	});

	app.get("/service/search/", storage.handlers.serviceSearch); // move handler to services
	app.get("/service/read/:id?", storage.handlers.serviceRead); // move handler to services
	app.post("/service/create/:id?", services.handlers.serviceCreate);
	app.get("/service/change", services.handlers.serviceGetChanges);
	app.post("/service/change", services.handlers.serviceChange);

	app.post("/service/commit", providers.handlers.createCommit);

	app.post("/service/update/:id?", services.handlers.serviceUpdate);
	app.post("/service/provider/delete/:id?", services.handlers.serviceDelete);

	app.post("/service/provider/test/:id?", providers.handlers.testHandler);
	app.post("/service/provider/create", providers.handlers.createHandler);
	app.post("/service/provider/read/:id?", providers.handlers.readHandler);
	app.post("/service/provider/update/:id?", providers.handlers.updateHandler);
	app.post("/service/provider/delete/:id?", providers.handlers.deleteHandler);

	app.get("/manage/:id?", utils.notImplementedHandler);
	app.get("/monitor/:id?", utils.notImplementedHandler);
	app.get("/persist/:id?", utils.notImplementedHandler);

	self.handler = async (event) => {
		//console.warn('Service Request Handler - usage');
		//console.log(event.request.url);

		try {
			const splitPath = event.request.url
				.replace(location.origin, "")
				.split("/");
			if (splitPath.includes("::preview::") && splitPath.includes(ui.name)) {
				return new Response(templates.NO_PREVIEW, {
					headers: { "Content-Type": "text/html" },
				});
			}
		} catch (e) {}

		const serviceAPIMatch = await app.find(event.request);

		const res = serviceAPIMatch
			? await serviceAPIMatch.exec(event)
			: "no match in service request listener!";
		let response;

		// if(res && res.type){ //most likely a blob
		//     response = new Response(res, {headers:{'Content-Type': res.type }});
		//     return response;
		// }

		if (event.request.url.includes("/::preview::/")) {
			response = new Response(utils.addBase(res), {
				headers: { "Content-Type": "text/html" },
			});
			return response;
		}

		let { contentType } = utils.getMime(event.request.url) || {};
		if (!contentType && serviceAPIMatch && !res?.type) {
			({ contentType } = utils.getMime(".json"));
		}

		if (contentType) {
			response = new Response(res, {
				headers: { "Content-Type": contentType || res.type },
			});
			return response;
		}

		return new Response(res);

		// should be able to interact with instantiated services as well,
		// ie. all '.welcome' files should be available
		// each instantiated service should have its own store
	};
})();

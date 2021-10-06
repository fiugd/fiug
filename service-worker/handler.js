import utils from "./utils.js";

import { StorageManager } from "./storage.js";
import { Router } from "./router.js";
import { ProviderManager } from "./provider.js";
import { GithubProvider } from "./provider.github.js";
import { ServicesManager } from "./services.js";
import { TemplateEngine } from "./templates.js";
import { WorkerRewrite } from "./worker.rewrite.js";

const init = async ({ cacheName }) => {
	const swHandlers = self.handlers;
	await utils.initMimeTypes();

	const storage = new StorageManager({ utils });
	const templates = new TemplateEngine({ storage });

	const app = new Router({ storage, templates, swHandlers });
	const providers = await new ProviderManager({
		app, storage, utils, GithubProvider
	});
	const services = new ServicesManager({
		app, storage, providers, utils, templates
	});
	const workerRewrite = new WorkerRewrite({ storage });

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
	
	app.get("/!/:path?", workerRewrite.handlers.get);

	return async (event) => {
		const serviceAPIMatch = await app.find(event.request);

		const res = serviceAPIMatch
			? await serviceAPIMatch.exec(event)
			: "no match in service request listener!";
		let response;

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
	};
};

export default { init };


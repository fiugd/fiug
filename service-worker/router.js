const Router = (() => {
	// FOR NOW: instead of importing path-to-regex
	// go here https://forbeslindesay.github.io/express-route-tester/
	// enter path expression; include regex for base path, eg. (.*)/.welcome/:path?
	// get the regex and add it to this
	// DEPRECATE pathToRegex? - it's of little value, maybe, or maybe it should be moved elsewhere?
	const pathToRegex = {
		"/service/create/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/create(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/read/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/read(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/update/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/update(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/change": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/change(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/commit": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/commit(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/delete/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/delete(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/provider/test/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/provider\/test(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/provider/create": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/provider\/create(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/provider/read/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/provider\/read(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/provider/update/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/provider\/update(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/service/provider/delete/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/service\/provider\/delete(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/manage/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/manage(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/monitor/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/monitor(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/persist/:id?": (() => {
			const regex = new RegExp(
				/^((?:.*))\/persist(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i
			);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					id: regex.exec(url)[2],
				}),
			};
		})(),
		"/.welcome/:path?": (() => {
			// NOTE: this is actually the regex for (.*)/.welcome/(.*)
			const regex = new RegExp(/^((?:.*))\/\.welcome\/((?:.*))(?:\/(?=$))?$/i);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					path: (regex.exec(url)[2] || "").split("?")[0],
					query: (regex.exec(url)[2] || "").split("?")[1],
				}),
			};
		})(),
		"/service/search/": (() => {
			const safeUrl = (u) => (u[u.length - 1] === "/" ? u : u + "/");
			const regex = new RegExp(/^((?:.*))\/service\/search\/.*$/i);
			return {
				match: (url) => regex.test(safeUrl(url)),
				params: (url, urlFull) =>
					Object.fromEntries(
						urlFull
							.split("?")
							.pop()
							.split("&")
							.map((x) => x.split("="))
					),
			};
		})(),
		// worker rewriter
		"/!/:path?": (() => {
			// NOTE: this is actually the regex for (.*)/!/(.*)
			const regex = new RegExp(/^((?:.*))\/\!\/((?:.*))(?:\/(?=$))?$/i);
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					path: (regex.exec(url)[2] || "").split("?")[0],
					query: (regex.exec(url)[2] || "").split("?")[1],
				}),
			};
		})(),
	};

	const _generic = ({ _handlers }) => (method) => (pathString, handler) => {
		const path = pathToRegex[pathString];

		const genericPath = (pathString) => {
			const name = pathString.replace("/:path?", "").replace("/", "");
			const regex = new RegExp(`^((?:.*))\/${name}\/((?:.*))(?:\/(?=$))?$`, "i");
			return {
				match: (url) => regex.test(url),
				params: (url) => ({
					path: (regex.exec(url)[2] || "").split("?")[0],
					query: (regex.exec(url)[2] || "").split("?")[1],
				}),
			};
		};

		let alternatePath;
		if (!path) {
			alternatePath = genericPath(pathString);
			//console.log({ alternatePath });
		}
		const foundHandler = _handlers.find(
			(x) => x.pathString === pathString && x.method === method
		);
		if (foundHandler) {
			//console.log(`Overwriting handler for ${method} : ${pathString}`);
			foundHandler.handler = handler;
			return;
		}
		_handlers.push({
			...(path || alternatePath),
			pathString,
			method,
			handler,
		});
	};

	const _expressHandler = ({ templates, storage }) => {
		const { getFile } = storage;

		//bind to base, ie. when a service is added
		return async (base, msg) => {
			await templates.refresh();

			//handle individual network request
			return async (params, event) => {
				const { path, query } = params;
				const cleanPath = decodeURI(path.replace("/::preview::/", ""));
				const previewMode = path.includes("/::preview::/");
				const templateUrl = path.includes(".templates/");

				const filename = previewMode
					? cleanPath.split("/").pop()
					: path.split("/").pop();
				let xformedFile;

				// if headers.event-requestor is 'editor-state': let getFile know so it can track
				// try {
				// 	const xRequestor = event.request.headers.get('x-requestor');
				// 	console.log(xRequestor === 'editor-state'
				// 		? 'TODO: keep track of files when they are got by editor!'
				// 		: ''
				// 	 );
				// } catch(e){
				// 	console.error(e);
				// }
				const file = await getFile(`${base}/${cleanPath}`)
					|| await getFile(`./${base}/${cleanPath}`);

				let fileJSONString;
				try {
					if (typeof file !== "string") {
						fileJSONString = file ? JSON.stringify(file, null, 2) : "";
					} else {
						fileJSONString = file;
					}
				} catch (e) {}

				if (previewMode) {
					xformedFile = templates.convert(filename, fileJSONString);
				}

				if (previewMode && !xformedFile) {
					return templates.NO_PREVIEW;
				}

				// most likely a blob
				if (file && file.type && file.size) {
					//xformedFile because there may be a template for blob type file
					return xformedFile || file;
				}

				//TODO: need to know file type so that it can be returned properly
				return xformedFile || fileJSONString || file;
			};
		};
	};

	const _addServiceHandler = ({ storage, expressHandler, generic, swHandlers }) => async function ({ name, msg }) {
		const handlersStore = storage.stores.handlers;
		const route = `^/${name}/(.*)`;
		const handlerName = "./modules/service-worker.handler.js";
		const foundHandler = swHandlers.find((x) => x.handlerName === handlerName);
		const type = foundHandler ? foundHandler.type : 'fetch';
		const handler = foundHandler ? foundHandler.handler : 'route-handler';
		const handlerText = foundHandler ? foundHandler.handlerText : 'service-worker-handler';
		const foundExactHandler = foundHandler && swHandlers.find(
			(x) => x.handlerName === handlerName && x.routePattern === route
		);

		if (foundExactHandler) {
			//console.log(`sw handler was already installed for ${foundExactHandler.routePattern} (boot)`);
		} else {
			swHandlers.push({
				type,
				routePattern: route,
				route: new RegExp(route),
				handler,
				handlerName,
				handlerText,
			});
			// question: if handler is found in SW state, should store be updated?
			await handlersStore.setItem(route, { type, route, handlerName, handlerText });
		}

		// question: if handler is found in SW state, should service-worker.handler state be updated?
		const expHandler = await expressHandler(name, msg);
		generic("get")(`/${name}/:path?`, expHandler);
		// ^^^ this should add handler to express _handlers
	};

	const _restorePrevious = ({ storage, addServiceHandler }) => async () => {
		const servicesStore = storage.stores.services;

		const restoreToExpress = [];
		await servicesStore.iterate((value, key) => {
			let { name } = value;
			restoreToExpress.push({ name });
		});
		for (let i = 0, len = restoreToExpress.length; i < len; i++) {
			const { name } = restoreToExpress[i];
			await addServiceHandler({ name, msg: "served from reconstituted" });
		}
		// TODO: should also add routes/paths/handlers to SW which have been created but are not there already
		// could run in to problems with this ^^^ because those may be in the process of being added
	};

	const _find = ({ _handlers, restorePrevious }) => async (request) => {
		const { url, method } = request;
		const query = (() => {
			try {
				return Object.fromEntries([ ...(new URL(url)).searchParams ]);
			} catch(e){
				return {};
			}
		})();

		let found = _handlers.find((x) => {
			return method.toLowerCase() === x.method && x.match(url.split('?')[0]);
		});
		if (!found) {
			await restorePrevious();
			found = _handlers.find((x) => {
				return method.toLowerCase() === x.method && x.match(url.split('?')[0]);
			});

			if (!found) {
				return;
			}
		}

		return {
			exec: async (event) => {
				return await found.handler(
					found.params(url.split('?')[0], url),
					event,
					query
				);
			},
		};
	};

	class Router {
		_handlers=[];

		constructor({ storage, templates, swHandlers }){
			this.swHandlers = swHandlers;

			this.storage = storage;
			this.templates = templates;

			this.generic = _generic(this);
			this.get = this.generic("get");
			this.post = this.generic("post");

			this.expressHandler = _expressHandler(this);
			this.addServiceHandler = _addServiceHandler(this);
			this.restorePrevious = _restorePrevious(this);
			this.find = _find(this);

			this.restorePrevious();
		}
	}

	return Router;
})();

export { Router };

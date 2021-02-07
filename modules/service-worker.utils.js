(() => {
	let mimeTypes;
	const xfrmMimes = (() => {
		let cache;
		return (m = {}) => {
			if(!Object.entries(m).length){
				return cache || [];
			}
			cache = cache ||
				Object.entries(m).map(([contentType, rest]) => ({
					contentType,
					extensions: [],
					...rest,
				}));
			return cache;
		};
	})();
	const getMime = (filename) =>
		xfrmMimes(mimeTypes).find((m) =>
			m.extensions.includes(filename.split(".").pop())
		);
	// this call may not finish before mimetypes is used
	const initMimeTypes = async () => {
		mimeTypes = await fetchJSON("https://cdn.jsdelivr.net/npm/mime-db@1.45.0/db.json");
	};

	const safe = (fn) => {
		try {
			return fn();
		} catch (e) {
			console.error("possible issue: " + fn.toString());
			return;
		}
	};

	const flattenTree = (tree) => {
		const results = [];
		const recurse = (branch, parent = "/") => {
			const leaves = Object.keys(branch);
			leaves.map((key) => {
				const children = Object.keys(branch[key]);
				if (!children || !children.length) {
					results.push({
						name: key,
						code: parent + key,
						path: parent + key,
					});
				} else {
					if (!branch[key]) {
						debugger;
					}
					recurse(branch[key], `${parent}${key}/`);
				}
			});
		};
		recurse(tree);
		return results;
	};

	// this makes a service from UI look like files got from storage
	function getCodeAsStorage(tree, files, serviceName) {
		const flat = flattenTree(tree);
		for (let index = 0; index < flat.length; index++) {
			const file = flat[index];
			flat[index] = {
				key: file.path,
				value: files.find((x) => x.name === file.path.split("/").pop()),
			};
		}
		const untracked = files
			.filter((x) => x.untracked)
			.map((file, i) => ({
				key: `/${serviceName}/${file.name}`,
				value: {
					code: file.code,
					name: file.name,
					path: `/${serviceName}/`,
				},
			}));
		return [...flat, ...untracked];
	}

	const treeInsertFile = (path, tree) => {
		const splitPath = path.split("/").filter((x) => !!x && x !== ".");
		const newTree = JSON.parse(JSON.stringify(tree));
		let currentPointer = newTree;
		splitPath.forEach((x) => {
			currentPointer[x] = currentPointer[x] || {};
			currentPointer = currentPointer[x];
		});
		return newTree;
	};

	const unique = (array, fn) => {
		const result = [];
		const map = new Map();
		for (const item of array) {
			if (map.has(fn(item))) continue;
			map.set(fn(item), true);
			result.push(item);
		}
		return result;
	};

	const fetchJSON = async (url, opts) => await (await fetch(url, opts)).json();

	//TODO: ??? move to provider since fetching is a provider thing
	async function fetchFileContents(filename) {
		const storeAsBlob = [
			"image/",
			"audio/",
			"video/",
			"wasm",
			"application/zip",
		];
		const storeAsBlobBlacklist = ["image/svg", "image/x-portable-pixmap"];
		const fileNameBlacklist = [
			".ts", // mistaken as video/mp2t
		];
		const fetched = await fetch(filename);
		const contentType = fetched.headers.get("Content-Type");

		let _contents =
			storeAsBlob.find((x) => contentType.includes(x)) &&
			!storeAsBlobBlacklist.find((x) => contentType.includes(x)) &&
			!fileNameBlacklist.find((x) => filename.includes(x))
				? await fetched.blob()
				: await fetched.text();
		return _contents;
	}

	const notImplementedHandler = async (params, event) => {
		console.log("handler not implemented");
		return JSON.stringify({ params, event, error: "not implemented" }, null, 2);
	};

	module.exports = {
		fetchJSON,
		flattenTree,
		getCodeAsStorage,
		getMime,
		initMimeTypes,
		notImplementedHandler,
		safe,
		treeInsertFile,
		unique,

		// ugh
		fetchFileContents,
	};
})();

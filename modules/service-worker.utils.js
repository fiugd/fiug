/*

this is used by Editor (I think)
needs to be deprecated!!!

*/

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

	// this flattens tree files, not structure
	const flattenTree = (tree) => {
		const results = [];
		const queue = [];
		const recurse = (branch, parent = "/") => {
			Object.keys(branch)
				.filter(x => {
					const o=branch[x];
					return !!o && typeof o === "object" && !Array.isArray(o);
				})
				.forEach((key) => {
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
						queue.push(() => recurse(branch[key], `${parent}${key}/`));
					}
				});
		};
		queue.push(() => recurse(tree));
		while(queue.length > 0) queue.shift()();
		return results;
	};

	// this flattens tree structure
	// thanks: https://lowrey.me/getting-all-paths-of-an-javascript-object/
	const flattenObject = (root) =>  {
		let paths = [];
		let nodes = [{
			obj: root,
			path: []
		}];
		while (nodes.length > 0) {
			const n = nodes.pop();
			Object.keys(n.obj)
				.forEach(k => {
					const obj = n.obj[k];
					if (typeof obj !== 'object') return;
					const path = n.path.concat(k);
					paths.push(path);
					nodes.unshift({ obj, path });
				});
		}
		return paths.map(x => x.join('/'));
	};

	const keepHelper = (tree, code) => {
		const treeFlat = flattenTree(tree).map(x => x.path.replace('/.keep', ''));
		const treeFiles = code
			.map(x => x.path)
			.filter(x => !x.includes('/.keep'))
			.map(x => {
				if(x[0] === '/') return x;
				if(x.slice(0,2) === './') return x.replace(/^\.\//, '/');
				return '/' + x;
			});
		const addKeepFiles = treeFlat.reduce((all, one, i, array) => {
			const found = array.filter((x) => x !== one && x.startsWith(one));
			if(found.length === 0 && !treeFiles.includes(one)) all.push(one);
			return all;
		}, []);

		return treeFlat.map(
			x => addKeepFiles.includes(x)
				? x + '/.keep'
				: treeFiles.includes(x)
					? x
					: undefined
		).filter(x => !!x);
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
			flat[index].value.path = flat[index].value.path || file.path;
			flat[index].value.code = flat[index].value.code || file.code;
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

	// unused: convert from base64 string to blob
	 const base64toBlob = (base64) => {
		const binary = atob(base64);
		var array = new Uint8Array(binary.length)
		for(var i = 0; i < binary.length; i++ ){
			 array[i] = binary.charCodeAt(i);
		}
		return new Blob([array], { type: "image/png" });
	};

	// TODO: pattern part of fetchFileContents like this
	 const Storeable = (path, content) => {
		const storeAsBlob = path.endsWith('png');
		if(storeAsBlob) return base64toBlob(content);
		return atob(content);
	 };

	//TODO: ??? move to provider since fetching is a provider thing
	async function fetchFileContents(filename, opts) {
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
		const fetched = await fetch(filename, opts);

		//getting content type like this because can't trust server's CT headers
		const mime = getMime(filename) || {};
		const contentType = mime.contentType || fetched.headers.get("Content-Type");

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

	function addBase(html, href="../../", target="_blank"){
		try {
			const baseHref = html.includes('<base')
				? ''
				: `\n<base href="${href}" target="${target}">\n`;
			if(!html.includes('<html>')){
				html = '<html>\n' + html + '\n</html>'
			}
			html = html.replace('<html>', html.includes('<head>')
				? '<html>'
				: '<html>\n\n<head></head>\n'
			);
			html = html.replace('<head>', `<head>${baseHref}`)
			return html;
		} catch(e){
			return html;
		}
	}

	module.exports = {
		addBase,
		fetchJSON,
		flattenTree,
		flattenObject,
		keepHelper,
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

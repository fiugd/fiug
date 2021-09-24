/*!
	fiug service-worker
	Version v0.4.4
	Build Date 2021-09-22T20:41:53.758Z
	https://github.com/crosshj/fiug
	(c) 2011-2012 Harrison Cross.
*/
const utils = (() => {
    let mimeTypes;
    const xfrmMimes = (() => {
        let cache;
        return (m = {}) => Object.entries(m).length ? (cache = cache || Object.entries(m).map((([contentType, rest]) => ({
            contentType: contentType,
            extensions: [],
            ...rest
        }))), cache) : cache || [];
    })(), getMime = filename => xfrmMimes(mimeTypes).find((m => m.extensions.includes(filename.split(".").pop()))), flattenTree = tree => {
        const results = [], queue = [], recurse = (branch, parent = "/") => {
            Object.keys(branch).filter((x => {
                const o = branch[x];
                return !!o && "object" == typeof o && !Array.isArray(o);
            })).forEach((key => {
                const children = Object.keys(branch[key]);
                children && children.length ? (branch[key], queue.push((() => recurse(branch[key], `${parent}${key}/`)))) : results.push({
                    name: key,
                    code: parent + key,
                    path: parent + key
                });
            }));
        };
        for (queue.push((() => recurse(tree))); queue.length > 0; ) queue.shift()();
        return results;
    };
    const fetchJSON = async (url, opts) => await (await fetch(url, opts)).json();
    return {
        addBase: function(html, href = "../../", target = "_blank") {
            try {
                const baseHref = html.includes("<base") ? "" : `\n<base href="${href}" target="${target}">\n`;
                return html.includes("<html>") || (html = "<html>\n" + html + "\n</html>"), html = (html = html.replace("<html>", html.includes("<head>") ? "<html>" : "<html>\n\n<head></head>\n")).replace("<head>", `<head>${baseHref}`);
            } catch (e) {
                return html;
            }
        },
        fetchJSON: fetchJSON,
        flattenTree: flattenTree,
        flattenObject: root => {
            let paths = [], nodes = [ {
                obj: root,
                path: []
            } ];
            for (;nodes.length > 0; ) {
                const n = nodes.pop();
                Object.keys(n.obj).forEach((k => {
                    const obj = n.obj[k];
                    if ("object" != typeof obj) return;
                    const path = n.path.concat(k);
                    paths.push(path), nodes.unshift({
                        obj: obj,
                        path: path
                    });
                }));
            }
            return paths.map((x => x.join("/")));
        },
        keepHelper: (tree, code) => {
            const treeFlat = flattenTree(tree).map((x => x.path.replace("/.keep", ""))), treeFiles = code.map((x => x.path)).filter((x => !x.includes("/.keep"))).map((x => "/" === x[0] ? x : "./" === x.slice(0, 2) ? x.replace(/^\.\//, "/") : "/" + x)), addKeepFiles = treeFlat.reduce(((all, one, i, array) => (0 !== array.filter((x => x !== one && x.startsWith(one))).length || treeFiles.includes(one) || all.push(one), 
            all)), []);
            return treeFlat.map((x => addKeepFiles.includes(x) ? x + "/.keep" : treeFiles.includes(x) ? x : void 0)).filter((x => !!x));
        },
        getCodeAsStorage: function(tree, files, serviceName) {
            const flat = flattenTree(tree);
            for (let index = 0; index < flat.length; index++) {
                const file = flat[index];
                flat[index] = {
                    key: file.path,
                    value: files.find((x => x.name === file.path.split("/").pop()))
                }, flat[index].value.path = flat[index].value.path || file.path, flat[index].value.code = flat[index].value.code || file.code;
            }
            const untracked = files.filter((x => x.untracked)).map(((file, i) => ({
                key: `/${serviceName}/${file.name}`,
                value: {
                    code: file.code,
                    name: file.name,
                    path: `/${serviceName}/`
                }
            })));
            return [ ...flat, ...untracked ];
        },
        getMime: getMime,
        initMimeTypes: async () => {
            mimeTypes = await fetchJSON("https://cdn.jsdelivr.net/npm/mime-db@1.45.0/db.json");
        },
        notImplementedHandler: async (params, event) => (console.log("handler not implemented"), 
        JSON.stringify({
            params: params,
            event: event,
            error: "not implemented"
        }, null, 2)),
        safe: fn => {
            try {
                return fn();
            } catch (e) {
                return void console.error("possible issue: " + fn.toString());
            }
        },
        treeInsertFile: (path, tree) => {
            const splitPath = path.split("/").filter((x => !!x && "." !== x)), newTree = JSON.parse(JSON.stringify(tree));
            let currentPointer = newTree;
            return splitPath.forEach((x => {
                currentPointer[x] = currentPointer[x] || {}, currentPointer = currentPointer[x];
            })), newTree;
        },
        unique: (array, fn) => {
            const result = [], map = new Map;
            for (const item of array) map.has(fn(item)) || (map.set(fn(item), !0), result.push(item));
            return result;
        },
        fetchFileContents: async function(filename, opts) {
            const fetched = await fetch(filename, opts), contentType = (getMime(filename) || {}).contentType || fetched.headers.get("Content-Type");
            return ![ "image/", "audio/", "video/", "wasm", "application/zip" ].find((x => contentType.includes(x))) || [ "image/svg", "image/x-portable-pixmap" ].find((x => contentType.includes(x))) || [ ".ts" ].find((x => filename.includes(x))) ? await fetched.text() : await fetched.blob();
        }
    };
})(), initRootService = async ({stores: stores}) => {
    const {services: services, files: files, changes: changes} = stores, service = {
        name: "~",
        id: 0,
        type: "default",
        tree: {
            "~": {
                ".git": {
                    config: {}
                },
                ".profile": {},
                "settings.json": {},
                "welcome.md": {}
            }
        }
    };
    return await services.setItem("0", service), await files.setItem("~/.git/config", "\n"), 
    await files.setItem("~/settings.json", "{}"), await files.setItem("~/.profile", '\n# configure prompt here\n# https://phoenixnap.com/kb/change-bash-prompt-linux\n# http://bashrcgenerator.com/\n\n# in the future, parse this and use for prompt\nexport PS1="[\\033[38;5;14m]h[$(tput sgr0)] [$(tput sgr0)][\\033[38;5;2m]W[$(tput sgr0)]\n\\$ [$(tput sgr0)]"' + "\n\n".trim() + "\n"), 
    await files.setItem("~/welcome.md", '\nWelcome to fiug!\n================\n\nTry out the terminal on the right.\n\n#### configure git:\n`git config --global user.name john`\n`git config --global user.email johndoe@example.com`\n`git config --global user.token {your github token}`\n\n#### clone a repo:\n`git clone crosshj/fiug-welcome`\n\n#### list all cloned repos:\n`git list`\n\n#### open/close a repo in editor:\n`git open crosshj/fiug-welcome`\n`git close`\n\n#### view names of changed files:\n`git status`\n\n#### view changes:\n`git diff`\n\n#### view changes in a specific file:\n`git diff README.md`\n\n#### create and push a commit to github:\n`git commit -m "message about changes"`\n\n#### download all templates (for preview):\n`git clone crosshj/fiug-plugins`\n\n#### preview files:\n`preview`\n\n#### preview a specific file:\n`preview README.md`\n\n#### quit preview\n1. click preview pane\n2. press Control\n3. click quit\n\n'.trim() + "\n"), 
    await changes.setItem(`state-${service.name}-opened`, [ {
        name: "welcome.md",
        order: 0
    } ]), service;
};

class RootService {
    constructor(stores) {
        this.stores = stores, this.init = () => initRootService(this);
    }
}

const StorageManager = (() => {
    const defaultServices = () => [];
    async function getCodeFromStorageUsingTree(tree, fileStore, serviceName) {
        const files = (0, this.utils.flattenTree)(tree), allFilesFromService = {}, fileStoreKeys = await fileStore.keys();
        for (const key of fileStoreKeys) key.startsWith(`./${serviceName}/`) && (allFilesFromService[key] = {
            key: key,
            untracked: !0
        });
        for (let index = 0; index < files.length; index++) {
            let storedFile = allFilesFromService["." + files[index].path];
            storedFile && (storedFile.untracked = !1);
        }
        const untracked = Object.entries(allFilesFromService).map((([, value]) => value)).filter((x => !0 === x.untracked)).map((x => ({
            ...x,
            name: x.key.split("/").pop(),
            path: x.key
        })));
        return [ ...files, ...untracked ];
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
            "string" == typeof file ? (this.lines = file.split("\n").map((x => x.toLowerCase())), 
            this.reset()) : this.done = !0;
        }
        reset() {
            this.currentLine = 0, this.currentColumn = 0, this.done = !1;
        }
        next(term) {
            if (this.done) return -1;
            if (!this.lines || !this.path) return -1;
            for (term.toLowerCase() !== this.term && (this.term = term.toLowerCase(), this.reset()); ;) {
                const oldIndex = this.currentColumn, newIndex = (this.lines[this.currentLine] || "").indexOf(this.term, this.currentColumn);
                if (-1 !== newIndex) return this.currentColumn = newIndex + 1, {
                    file: this.path,
                    line: this.currentLine,
                    column: this.currentColumn - 1,
                    text: this.lines[this.currentLine].slice(0 === oldIndex ? Math.max(0, newIndex - 30) : oldIndex + this.term.length - 1, Math.max(newIndex + 30 + this.term.length)).trim()
                };
                if (this.currentColumn = 0, this.currentLine++, this.currentLine > this.lines.length - 1) return this.done = !0, 
                -1;
            }
        }
    }
    class ServiceSearch {
        MAX_RESULTS=1e4;
        encoder=new TextEncoder;
        timer;
        stream;
        async init({term: term, include: include = "./", fileStore: fileStore}) {
            this.timer = {
                t1: performance.now()
            };
            const cache = {};
            await fileStore.iterate(((value, key) => {
                (key.startsWith(include) || `./${key}`.startsWith(include)) && (cache[key] = value);
            }));
            const fileSearch = new FileSearch({
                getItem: async key => cache[key]
            });
            let currentFileIndex = -1;
            const files = Object.keys(cache), thisEncoder = this.encoder;
            let streamResultCount = 0;
            this.stream = new ReadableStream({
                start(controller) {},
                async pull(controller) {
                    for (;;) try {
                        const result = fileSearch.next(term);
                        if (streamResultCount >= this.MAX_RESULTS || -1 === result && currentFileIndex === files.length - 1) return void controller.close();
                        if (-1 === result) {
                            await fileSearch.load(files[++currentFileIndex]);
                            continue;
                        }
                        streamResultCount++, controller.enqueue(thisEncoder.encode(JSON.stringify(result) + "\n"));
                    } catch (e) {
                        return console.log(e), void controller.close();
                    }
                }
            });
        }
        async search(handler) {
            const reader = this.stream.getReader();
            let ct = 0;
            for (;;) {
                const {done: done, value: value} = await reader.read();
                if (done) break;
                if (handler(value), ct++, ct === this.MAX_RESULTS) break;
            }
            this.timer.t2 = performance.now(), handler({
                summary: {
                    timer: this.timer.t2 - this.timer.t1,
                    count: ct
                }
            });
        }
    }
    async function getFileContents({filename: filename, filesStore: filesStore, cache: cache, storagePath: storagePath, fetchFileContents: fetchFileContents}) {
        const cachedFile = await filesStore.getItem(filename);
        let contents;
        return cachedFile && "reload" !== cache ? cachedFile : (contents = await fetchFileContents(filename), 
        storagePath ? filesStore.setItem("." + storagePath.replace("/welcome/", "/.welcome/"), contents) : filesStore.setItem(filename, contents), 
        contents);
    }
    async function fileSystemTricks({result: result, filesStore: filesStore, cache: cache, servicesStore: servicesStore, fetchFileContents: fetchFileContents}) {
        const {safe: safe, flattenTree: flattenTree} = this.utils;
        if (!safe((() => result.result[0].code.find))) {
            const parsed = JSON.parse(result.result[0].code);
            return result.result[0].code = parsed.files, result.result[0].tree = parsed.tree, 
            void console.log("will weird things ever stop happening?");
        }
        const serviceJSONFile = result.result[0].code.find((item => "service.json" === item.name));
        if (serviceJSONFile && !serviceJSONFile.code) {
            const filename = `./.${result.result[0].name}/service.json`;
            serviceJSONFile.code = await getFileContents({
                filename: filename,
                filesStore: filesStore,
                cache: cache,
                fetchFileContents: fetchFileContents
            });
        }
        if (serviceJSONFile) {
            let serviceJSON = JSON.parse(serviceJSONFile.code);
            if (!serviceJSON.tree) {
                const filename = `./${serviceJSON.path}/service.json`;
                serviceJSONFile.code = await getFileContents({
                    filename: filename,
                    filesStore: filesStore,
                    cache: cache,
                    fetchFileContents: fetchFileContents
                }), serviceJSON = JSON.parse(serviceJSONFile.code);
            }
            result.result[0].code = serviceJSON.files, result.result[0].tree = {
                [result.result[0].name]: serviceJSON.tree
            };
        }
        const len = safe((() => result.result[0].code.length)), flat = flattenTree(safe((() => result.result[0].tree)));
        for (var i = 0; i < len; i++) {
            const item = result.result[0].code[i];
            if (!item.code && item.path) {
                const filename = "./" + item.path, storagePath = (flat.find((x => x.name === item.name)) || {}).path;
                item.code = await getFileContents({
                    filename: filename,
                    filesStore: filesStore,
                    cache: cache,
                    storagePath: storagePath,
                    fetchFileContents: fetchFileContents
                });
            }
        }
        result.result[0].name ? await servicesStore.setItem(result.result[0].id + "", {
            name: result.result[0].name,
            id: result.result[0].id,
            tree: result.result[0].tree
        }) : console.error("cannot set services store item without name");
    }
    function cacheFn(fn, ttl) {
        const cache = {};
        return new Proxy(fn, {
            apply: (target, thisArg, args) => {
                const key = target.name;
                cache[key] = cache[key] || {};
                const argsKey = args.toString(), cachedItem = cache[key][argsKey];
                return cachedItem || (cache[key][argsKey] = target.apply(thisArg, args), setTimeout((() => {
                    delete cache[key][argsKey];
                }), ttl), cache[key][argsKey]);
            }
        });
    }
    let changeCache, fileCache, servicesCache;
    async function getFile(path) {
        const changesStore = this.stores.changes, filesStore = this.stores.files, servicesStore = this.stores.services, {fetchFileContents: fetchFileContents} = this.utils;
        changeCache = changeCache || cacheFn(changesStore.getItem.bind(changesStore), 250), 
        fileCache = fileCache || cacheFn(filesStore.getItem.bind(filesStore), 250), servicesCache = servicesCache || cacheFn((async () => {
            const keys = await servicesStore.keys();
            let services = [];
            for (let i = 0, len = keys.length; i < len; i++) {
                const thisService = await servicesStore.getItem(keys[i]);
                services.push(thisService);
            }
            return services;
        }), 500);
        let t0 = performance.now();
        const perfNow = () => {
            const d = performance.now() - t0;
            return t0 = performance.now(), d.toFixed(3);
        }, changes = await changeCache(path);
        if (console.log(`changes store: ${perfNow()}ms (${path})`), changes && "update" === changes.type) return changes.value;
        let file = await fileCache(path);
        if (console.log(`file store: ${perfNow()}ms (${path})`), file && file.includes && file.includes("##PLACEHOLDER##")) {
            const services = await servicesCache();
            let serviceFile;
            services.sort(((a, b) => b.name.length - a.name.length));
            let thisService = {};
            for (let i = 0, len = services.length; i < len && (thisService = services[i], !("github" === thisService.type && thisService.git && thisService.git.tree && path.startsWith(thisService.name) && (serviceFile = thisService.git.tree.find((x => path === `${thisService.name}/${x.path}`)), 
            serviceFile))); i++) ;
            if (!serviceFile) return file;
            const getFileContents = async ({path: path}) => {
                try {
                    const contentUrl = "https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{path}".replace("{path}", path).replace("{owner}", thisService.owner).replace("{repo}", thisService.repo).replace("{sha}", thisService.git.sha);
                    return await fetchFileContents(contentUrl);
                } catch (e) {
                    return void console.error(e);
                }
            };
            file = await getFileContents(serviceFile), file && filesStore.setItem(path, file);
        }
        return file;
    }
    const handleServiceRead = (servicesStore, filesStore, fetchFileContents, changesStore) => {
        const stores = {
            files: filesStore,
            services: servicesStore,
            changes: changesStore
        };
        return async function(params, event) {
            const cacheHeader = event.request.headers.get("x-cache"), defaults = [];
            if (0 !== Number(params.id) && !params.id || "*" === params.id) {
                const savedServices = [];
                await servicesStore.iterate(((value, key) => {
                    savedServices.push(value);
                }));
                for (var i = 0, len = savedServices.length; i < len; i++) {
                    const service = savedServices[i], code = await this.getCodeFromStorageUsingTree(service.tree, filesStore, service.name);
                    service.code = code;
                }
                const allServices = [ ...defaults, ...savedServices ].sort(((a, b) => Number(a.id) - Number(b.id))).map((x => ({
                    id: x.id,
                    name: x.name
                })));
                return JSON.stringify({
                    result: this.utils.unique(allServices, (x => Number(x.id)))
                }, null, 2);
            }
            const addTreeState = async service => {
                const changed = (await changesStore.keys()).filter((x => x.startsWith(`${service.name}`))).map((x => x.split(service.name + "/")[1])), opened = await changesStore.getItem(`state-${service.name}-opened`) || [], selected = (opened.find((x => 0 === x.order)) || {}).name || "";
                service.state = {
                    opened: opened,
                    selected: selected,
                    changed: changed
                }, service.treeState = {
                    expand: await changesStore.getItem(`tree-${service.name}-expanded`) || [],
                    select: selected,
                    changed: changed,
                    new: []
                };
            };
            await filesStore.setItem("lastService", params.id);
            let foundService = await servicesStore.getItem(params.id);
            if (!foundService && [ 0, "0" ].includes(params.id)) {
                const root = new RootService(stores);
                foundService = await root.init();
            }
            if (foundService) return foundService.code = await this.getCodeFromStorageUsingTree(foundService.tree, filesStore, foundService.name), 
            await addTreeState(foundService), JSON.stringify({
                result: [ foundService ]
            }, null, 2);
            const lsServices = [] || [], result = {
                result: "*" !== params.id && params.id ? lsServices.filter((x => Number(x.id) === Number(params.id))) : lsServices
            };
            return await this.fileSystemTricks({
                result: result,
                filesStore: filesStore,
                servicesStore: servicesStore,
                cache: cacheHeader,
                fetchFileContents: fetchFileContents
            }), result.forEach(addTreeState), JSON.stringify(result, null, 2);
        };
    };
    return class {
        stores=(() => {
            var driver = [ localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE ];
            return {
                files: localforage.createInstance({
                    driver: driver,
                    name: "service-worker",
                    version: 1,
                    storeName: "files",
                    description: "permanent state of contents of files across projects"
                }),
                services: localforage.createInstance({
                    driver: driver,
                    name: "service-worker",
                    version: 1,
                    storeName: "services",
                    description: "services directory stucture, type, etc"
                }),
                providers: localforage.createInstance({
                    driver: driver,
                    name: "service-worker",
                    version: 1,
                    storeName: "providers",
                    description: "connects services to outside world"
                }),
                changes: localforage.createInstance({
                    driver: driver,
                    name: "service-worker",
                    version: 1,
                    storeName: "changes",
                    description: "keep track of changes not pushed to provider"
                }),
                handlers: localforage.createInstance({
                    driver: driver,
                    name: "service-worker",
                    version: 1,
                    storeName: "handlers",
                    description: "used after app has booted when service worker is updated"
                })
            };
        })();
        defaultServices=defaultServices;
        getCodeFromStorageUsingTree=getCodeFromStorageUsingTree.bind(this);
        fileSystemTricks=fileSystemTricks.bind(this);
        getFile=getFile.bind(this);
        constructor({utils: utils}) {
            var fileStore;
            this.utils = utils, this.handlers = {
                serviceSearch: (fileStore = this.stores.files, async (params, event) => {
                    const serviceSearch = new ServiceSearch;
                    return await serviceSearch.init({
                        ...params,
                        fileStore: fileStore
                    }), serviceSearch.stream;
                }),
                serviceRead: handleServiceRead(this.stores.services, this.stores.files, utils.fetchFileContents, this.stores.changes).bind(this)
            };
        }
    };
})(), Router = (() => {
    const pathToRegex = {
        "/service/create/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/create(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/read/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/read(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/update/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/update(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/change": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/change(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/commit": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/commit(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/delete/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/delete(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/provider/test/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/provider\/test(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/provider/create": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/provider\/create(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/provider/read/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/provider\/read(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/provider/update/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/provider\/update(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/service/provider/delete/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/provider\/delete(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/manage/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/manage(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/monitor/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/monitor(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/persist/:id?": (() => {
            const regex = new RegExp(/^((?:.*))\/persist(?:\/((?:[^\/]+?)))?(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    id: regex.exec(url)[2]
                })
            };
        })(),
        "/.welcome/:path?": (() => {
            const regex = new RegExp(/^((?:.*))\/\.welcome\/((?:.*))(?:\/(?=$))?$/i);
            return {
                match: url => regex.test(url),
                params: url => ({
                    path: (regex.exec(url)[2] || "").split("?")[0],
                    query: (regex.exec(url)[2] || "").split("?")[1]
                })
            };
        })(),
        "/service/search/": (() => {
            const regex = new RegExp(/^((?:.*))\/service\/search\/.*$/i);
            return {
                match: url => {
                    return regex.test("/" === (u = url)[u.length - 1] ? u : u + "/");
                    var u;
                },
                params: (url, urlFull) => Object.fromEntries(urlFull.split("?").pop().split("&").map((x => x.split("="))))
            };
        })()
    }, _generic = ({_handlers: _handlers}) => method => (pathString, handler) => {
        const path = pathToRegex[pathString];
        let alternatePath;
        path || (alternatePath = (pathString => {
            const name = pathString.replace("/:path?", "").replace("/", ""), regex = new RegExp(`^((?:.*))/${name}/((?:.*))(?:/(?=$))?$`, "i");
            return {
                match: url => regex.test(url),
                params: url => ({
                    path: (regex.exec(url)[2] || "").split("?")[0],
                    query: (regex.exec(url)[2] || "").split("?")[1]
                })
            };
        })(pathString));
        const foundHandler = _handlers.find((x => x.pathString === pathString && x.method === method));
        foundHandler ? foundHandler.handler = handler : _handlers.push({
            ...path || alternatePath,
            pathString: pathString,
            method: method,
            handler: handler
        });
    };
    return class {
        _handlers=[];
        constructor({storage: storage, templates: templates, swHandlers: swHandlers}) {
            this.swHandlers = swHandlers, this.storage = storage, this.templates = templates, 
            this.generic = _generic(this), this.get = this.generic("get"), this.post = this.generic("post"), 
            this.expressHandler = (({templates: templates, storage: storage}) => {
                const {getFile: getFile} = storage;
                return async (base, msg) => (await templates.refresh(), async (params, event) => {
                    const {path: path, query: query} = params, cleanPath = decodeURI(path.replace("/::preview::/", "")), previewMode = path.includes("/::preview::/");
                    path.includes(".templates/");
                    const filename = previewMode ? cleanPath.split("/").pop() : path.split("/").pop();
                    let xformedFile;
                    const file = await getFile(`${base}/${cleanPath}`) || await getFile(`./${base}/${cleanPath}`);
                    let fileJSONString;
                    try {
                        fileJSONString = "string" != typeof file ? file ? JSON.stringify(file, null, 2) : "" : file;
                    } catch (e) {}
                    return previewMode && (xformedFile = templates.convert(filename, fileJSONString)), 
                    previewMode && !xformedFile ? templates.NO_PREVIEW : file && file.type && file.size ? xformedFile || file : xformedFile || fileJSONString || file;
                });
            })(this), this.addServiceHandler = (({storage: storage, expressHandler: expressHandler, generic: generic, swHandlers: swHandlers}) => async function({name: name, msg: msg}) {
                const handlersStore = storage.stores.handlers, route = `^/${name}/(.*)`, handlerName = "./modules/service-worker.handler.js", foundHandler = swHandlers.find((x => x.handlerName === handlerName)), type = foundHandler ? foundHandler.type : "fetch", handler = foundHandler ? foundHandler.handler : "route-handler", handlerText = foundHandler ? foundHandler.handlerText : "service-worker-handler";
                foundHandler && swHandlers.find((x => x.handlerName === handlerName && x.routePattern === route)) || (swHandlers.push({
                    type: type,
                    routePattern: route,
                    route: new RegExp(route),
                    handler: handler,
                    handlerName: handlerName,
                    handlerText: handlerText
                }), await handlersStore.setItem(route, {
                    type: type,
                    route: route,
                    handlerName: handlerName,
                    handlerText: handlerText
                }));
                const expHandler = await expressHandler(name, msg);
                generic("get")(`/${name}/:path?`, expHandler);
            })(this), this.restorePrevious = (({storage: storage, addServiceHandler: addServiceHandler}) => async () => {
                const servicesStore = storage.stores.services, restoreToExpress = [];
                await servicesStore.iterate(((value, key) => {
                    let {name: name} = value;
                    restoreToExpress.push({
                        name: name
                    });
                }));
                for (let i = 0, len = restoreToExpress.length; i < len; i++) {
                    const {name: name} = restoreToExpress[i];
                    await addServiceHandler({
                        name: name,
                        msg: "served from reconstituted"
                    });
                }
            })(this), this.find = (({_handlers: _handlers, restorePrevious: restorePrevious}) => async request => {
                const {url: url, method: method} = request, query = (() => {
                    try {
                        return Object.fromEntries([ ...new URL(url).searchParams ]);
                    } catch (e) {
                        return {};
                    }
                })();
                let found = _handlers.find((x => method.toLowerCase() === x.method && x.match(url.split("?")[0])));
                if (found || (await restorePrevious(), found = _handlers.find((x => method.toLowerCase() === x.method && x.match(url.split("?")[0]))), 
                found)) return {
                    exec: async event => await found.handler(found.params(url.split("?")[0], url), event, query)
                };
            })(this), this.restorePrevious();
        }
    };
})(), ProviderManager = (() => {
    const stringify = o => JSON.stringify(o, null, 2);
    async function _fetchFileContents(url, opts) {
        const fileNameBlacklist = [ ".ts" ].map((x => new RegExp(`${x}$`.replace(/\./, ".")))), fetched = await fetch(url, opts), contentType = fetched.headers.get("Content-Type");
        return ![ "image/", "audio/", "video/", "wasm", "application/zip", "application/octet-stream" ].find((x => contentType.includes(x))) || [ "image/svg", "image/x-portable-pixmap" ].find((x => contentType.includes(x))) || fileNameBlacklist.find((x => x.test(url))) ? await fetched.text() : await fetched.blob();
    }
    const handleProviderTest = ({github: github}) => async (params, event) => {
        const githubResponse = github && await github.handler("test", {
            params: params,
            event: event
        });
        if (githubResponse) return githubResponse;
        const body = await event.request.json(), {providerType: providerType, providerUrl: providerUrl, providerAccessToken: providerAccessToken} = body;
        [ "basic-bartok-provider", "github-provider" ].includes(providerType) || stringify({
            error: `Unsupported provider type: ${providerType}`
        }), "github-provider" === providerType && stringify({
            success: !0,
            todo: "test user's access token"
        });
        const fileUrl = (providerUrl + "/file/").replace("//file/", "/file/"), treeUrl = (providerUrl + "/tree/").replace("//tree/", "/tree/");
        try {
            if (200 !== (await fetch(providerUrl)).status) return stringify({
                error: `Failed to connect to provider at: ${providerUrl}`
            });
        } catch (e) {
            return stringify({
                error: `Failed to connect to provider at: ${providerUrl}`
            });
        }
        try {
            if (200 !== (await fetch(fileUrl)).status) return stringify({
                error: `Failed to connect to provider at: ${fileUrl}`
            });
        } catch (e) {
            return stringify({
                error: `Failed to connect to provider at: ${fileUrl}`
            });
        }
        try {
            if (200 !== (await fetch(treeUrl)).status) return stringify({
                error: `Failed to connect to provider at: ${treeUrl}`
            });
        } catch (e) {
            return stringify({
                error: `Failed to connect to provider at: ${treeUrl}`
            });
        }
        return stringify({
            success: !0
        });
    }, handleProviderCreate = ({create: create, github: github}) => async (params, event) => {
        const githubResponse = github && await github.handler("create", {
            params: params,
            event: event
        });
        if (githubResponse) return githubResponse;
        try {
            const body = await event.request.json(), {providerType: providerType, providerUrl: providerUrl} = body;
            [ "basic-bartok-provider" ].includes(providerType) || stringify({
                error: `Unsupported provider type: ${providerType}`
            });
            const provider = await create({
                id: providerUrl,
                url: providerUrl
            });
            return stringify({
                success: !0,
                provider: provider
            });
        } catch (error) {
            return stringify({
                error: error
            });
        }
    }, handleCreateCommit = ({github: github}) => async (params, event) => {
        const githubResponse = github && await github.handler("createCommit", {
            params: params,
            event: event
        });
        return githubResponse || stringify({
            error: "commits are only implemented for github repos"
        });
    };
    async function _providerCreateServiceHandler(event) {
        const servicesStore = this.stores.services, filesStore = this.stores.files, githubResponse = this.github && await this.github.handler("servicesCreate", {
            event: event
        });
        if (githubResponse) return githubResponse;
        try {
            const body = await event.request.json();
            let {providerType: providerType, providerUrl: providerUrl, providerAccessToken: providerAccessToken, repoName: repoName} = body;
            if (![ "basic-bartok-provider" ].includes(providerType)) return stringify({
                error: `Unsupported provider type: ${providerType}`
            });
            if (!await this.read(providerUrl)) return stringify({
                error: `Provider does not exist: ${providerUrl}`
            });
            const treeUrl = (providerUrl + "/tree/").replace("//tree/", "/tree/"), fileUrl = (providerUrl + "/file/").replace("//file/", "/file/"), allServices = [];
            await servicesStore.iterate(((value, key) => {
                allServices.push(value);
            }));
            const baseRes = await fetch(treeUrl);
            if (200 !== baseRes.status) return stringify({
                error: `Failed to connect to provider at: ${providerUrl}`
            });
            const {files: providerFiles, root: providerRoot, tree: providerTree} = await baseRes.json(), providerRootName = providerRoot.split("/").pop(), foundService = allServices.find((x => x.name === providerRootName)), id = foundService ? foundService.id : allServices.reduce(((all, one) => Number(one.id) >= all ? Number(one.id) + 1 : all), 1), service = {
                name: providerRootName,
                id: id,
                providerRoot: providerRoot,
                providerUrl: providerUrl,
                tree: providerTree
            };
            if (!service.name) return void console.error("cannot set services store item without service name");
            await servicesStore.setItem(id + "", service), service.code = [];
            for (let f = 0; f < providerFiles.length; f++) {
                const filePath = providerFiles[f], fileContents = await this.utils.fetchFileContents(`${fileUrl}${providerRoot}/${filePath}`);
                filesStore.setItem(`./${providerRootName}/${filePath}`, fileContents), service.code.push({
                    name: filePath.split("/").pop(),
                    path: `./${providerRootName}/${filePath}`,
                    code: "string" == typeof fileContents ? fileContents : ""
                });
            }
            return await this.providerUpdateServiceJson({
                service: service,
                servicesStore: servicesStore,
                filesStore: filesStore
            }), await this.app.addServiceHandler({
                name: providerRootName,
                msg: "served from fresh baked"
            }), stringify({
                result: {
                    services: [ service ]
                }
            });
        } catch (error) {
            return console.error(error), stringify({
                error: error
            });
        }
    }
    const _providerUpdateServiceJson = async function({service: service, servicesStore: servicesStore, filesStore: filesStore}) {
        const githubResponse = this.github && await this.github.handler("servicesUpdate", {
            service: service
        });
        if (githubResponse) return githubResponse;
        const serviceJsonFile = service.code.find((x => x.path.includes("/service.json")));
        if (!serviceJsonFile) return;
        const serviceJson = JSON.parse(serviceJsonFile.code), {code: code, ...serviceOther} = service, {providerUrl: providerUrl, providerRoot: providerRoot} = service;
        serviceJson.tree = service.tree[service.name], serviceJson.files = service.code.map((x => ({
            name: x.name,
            path: x.path.replace("./", "")
        }))).sort(((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0));
        const filePostUrl = `${providerUrl}file/${providerRoot}${serviceJsonFile.path.replace("./" + service.name, "")}`;
        serviceJsonFile.code = stringify(serviceJson), serviceOther.name ? (await servicesStore.setItem(service.id + "", serviceOther), 
        await filesStore.setItem(serviceJsonFile.path, serviceJsonFile.code), await fetch(filePostUrl, {
            method: "post",
            body: serviceJsonFile.code
        })) : console.error("cannot set services store item without service name");
    };
    async function _providerFileChange(args) {
        let {path: path, code: code, parent: service, deleteFile: deleteFile} = args;
        const githubResponse = this.github && await this.github.handler("filesUpdate", args);
        if (githubResponse) return githubResponse;
        if (service = service || await this.stores.services.iterate(((value, key) => {
            if (value.name === service || value.name === service.name) return value;
        })), !service || !service.providerUrl) throw new Error("file not saved to provider: service not associated with a provider");
        const {providerUrl: providerUrl, providerRoot: providerRoot} = service, filePostUrl = `${providerUrl}file/${providerRoot}${path.replace("./" + service.name, "")}`, filePostRes = await this.utils.fetchJSON(filePostUrl, {
            method: deleteFile ? "DELETE" : "POST",
            body: deleteFile ? void 0 : code
        });
        if (filePostRes.error) throw new Error(filePostRes.error);
        return filePostRes;
    }
    return class {
        constructor({app: app, storage: storage, utils: utils, GithubProvider: GithubProvider}) {
            return new Promise((async resolve => {
                try {
                    this.app = app, this.storage = storage, this.utils = utils, this.fetchContents = _fetchFileContents.bind(this), 
                    this.store = storage.stores.providers, this.stores = storage.stores, this.github = await new GithubProvider(this), 
                    this.handlers = {
                        testHandler: handleProviderTest(this),
                        createHandler: handleProviderCreate(this),
                        readHandler: async (params, event) => (console.error("not implemented: provider read.  Should return one or all saved provider details."), 
                        stringify({
                            error: "not implemented"
                        })),
                        updateHandler: async (params, event) => (console.error("not implemented: provider update.  Should update provider details."), 
                        stringify({
                            error: "not implemented"
                        })),
                        deleteHandler: async (params, event) => (console.error("not implemented: provider delete.  Should delete saved provider."), 
                        stringify({
                            error: "not implemented"
                        })),
                        createCommit: handleCreateCommit(this)
                    }, this.createServiceHandler = _providerCreateServiceHandler.bind(this), this.providerUpdateServiceJson = _providerUpdateServiceJson.bind(this), 
                    this.fileChange = _providerFileChange.bind(this), resolve(this);
                } catch (error) {
                    reject(error);
                }
            }));
        }
        create=async provider => await this.store.setItem(provider.id + "", provider);
        read=async id => id ? await this.store.getItem(id) : await this.store.keys();
        update=async (id, updates) => {
            const provider = await this.read(id);
            return updates.id && updates.id !== id && await this.delete(id), await this.store.setItem((updates.id || provider.id) + "", {
                ...provider,
                ...updates
            });
        };
        delete=async id => await this.store.removeItem(id);
    };
})(), GithubProvider = (() => {
    const urls = {
        rateLimit: "/rate_limit",
        repoInfo: "/repos/{owner}/{repo}",
        latestCommit: "/repos/{owner}/{repo}/branches/{branch}",
        tree: "/repos/{owner}/{repo}/git/trees",
        getTreeRecursive: "/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=true",
        rawBlob: "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}",
        contents: "/repos/{owner}/{repo}/contents/{path}?ref={sha}",
        branch: "/repos/{owner}/{repo}/branches/{branch}",
        treeRecurse: "/repos/{owner}/{repo}/git/trees/{sha}?recursive=true",
        commit: "/repos/{owner}/{repo}/git/commits/{sha}",
        createCommit: "/repos/{owner}/{repo}/git/commits",
        blobCreate: "/repos/{owner}/{repo}/git/blobs",
        refs: "/repos/{owner}/{repo}/git/refs/heads/{branch}"
    };
    Object.entries(urls).forEach((([k, v]) => {
        "/" === v[0] && (urls[k] = "https://api.github.com" + urls[k]);
    }));
    const stringify = o => JSON.stringify(o, null, 2), _fetchJSON = (url, opts) => fetch(url, opts).then((x => x.json())), NOT_IMPLEMENTED_RESPONSE = () => void console.warn("Someone wants to be debugging...") || stringify({
        message: "not implemented"
    }), githubDelete = githubProvider => async (payload, params) => NOT_IMPLEMENTED_RESPONSE(), githubServiceCreate = githubProvider => async (payload, params) => {
        try {
            const {storage: {stores: stores}, fetchContents: fetchContents, app: app} = githubProvider, {auth: auth, repo: repo} = payload, servicesStore = (stores.providers, 
            stores.services), filesStore = stores.files, opts = {
                headers: {}
            };
            auth && (opts.headers.authorization = `token ${auth}`), opts.headers.Accept = "application/vnd.github.v3+json";
            const getDefaultBranch = async () => {
                const repoInfoUrl = urls.repoInfo.replace("{owner}/{repo}", repo), {default_branch: default_branch} = await githubProvider.fetchJSON(repoInfoUrl, opts);
                return default_branch;
            }, branch = payload.branch || await getDefaultBranch(), latestCommitUrl = urls.latestCommit.replace("{owner}/{repo}", repo).replace("{branch}", branch), {commit: {sha: sha}} = await githubProvider.fetchJSON(latestCommitUrl, opts), getTreeUrl = urls.getTreeRecursive.replace("{owner}/{repo}", repo).replace("{tree_sha}", sha), {tree: tree, truncated: truncated} = await githubProvider.fetchJSON(getTreeUrl, opts);
            truncated && console.warn("github repo tree truncated - try without recursive flag");
            const ghFileItems = tree.filter((x => "blob" === x.type)), getOneFile = async (ghFile, commitSha) => {
                const contents = await fetchContents((file = ghFile, urls.rawBlob.replace("{owner}/{repo}", repo).replace("{branch}", commitSha || branch).replace("{path}", file.path)));
                var file;
                return {
                    ...ghFile,
                    contents: contents
                };
            };
            for (let i = 0, len = ghFileItems.length; i < len; i++) {
                const ghFile = ghFileItems[i], PLACEHOLDER = "##PLACEHOLDER##";
                if (!ghFile.path.includes(".templates")) {
                    await filesStore.setItem(`${repo}/${ghFileItems[i].path}`, PLACEHOLDER);
                    continue;
                }
                const {contents: contents} = await getOneFile(ghFile, sha);
                await filesStore.setItem(`${repo}/${ghFileItems[i].path}`, contents);
            }
            let foundService = {};
            const keys = [];
            await servicesStore.iterate(((value, key) => {
                keys.push(key), value.name === repo && (foundService = {
                    key: key,
                    ...value
                });
            }));
            const newId = keys.length ? Math.max(...keys) + 1 : 3e3, githubToServiceTree = githubTreeItems => {
                const tree = {
                    [repo]: {}
                }, root = tree[repo];
                return githubTreeItems.forEach((item => {
                    item.path.split("/").reduce(((all, one) => (all[one] = all[one] || {}, all[one])), root);
                })), tree;
            }, saveService = async (githubTree, commitSha) => {
                const id = foundService.id || newId, thisService = {
                    id: id,
                    type: "github",
                    name: repo,
                    tree: githubToServiceTree(githubTree),
                    owner: repo.split("/").slice(0, 1).join(""),
                    repo: repo.split("/").pop(),
                    git: {
                        tree: githubTree,
                        sha: commitSha
                    },
                    branch: branch
                };
                return await servicesStore.setItem(id + "", thisService), {
                    id: id,
                    thisService: thisService
                };
            }, {id: id, thisService: thisService} = await saveService(tree, sha);
            return await app.addServiceHandler({
                name: repo,
                msg: "service added from github provider"
            }), stringify({
                result: {
                    services: [ thisService ]
                }
            });
        } catch (error) {
            return console.error(error), stringify({
                error: error
            });
        }
    }, githubServiceRead = githubProvider => async (payload, params) => NOT_IMPLEMENTED_RESPONSE(), githubServiceUpdate = githubProvider => async (payload, params) => NOT_IMPLEMENTED_RESPONSE(), githubServiceDelete = githubProvider => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
    async function commit({files: files, git: git, auth: auth, message: message, fetchJSON: fetchJSON}) {
        if (!files || !Array.isArray(files)) return {
            error: "no files were changed"
        };
        if (!(files = files.filter((x => !x.ignore))).length) return {
            error: "no files were changed"
        };
        if (!auth) return {
            error: "auth is required"
        };
        if (!message) return {
            error: "message is required"
        };
        if (!git.owner) return {
            error: "repository owner is required"
        };
        if (!git.branch) return {
            error: "repository branch name is required"
        };
        if (!git.repo) return {
            error: "repository name is required"
        };
        let blobs = [];
        const opts = {
            headers: {
                authorization: `token ${auth}`,
                Accept: "application/vnd.github.v3+json"
            }
        }, ghFetch = async (templateUrl, params = {}, extraOpts = {}) => {
            const filledUrl = (url = templateUrl, obj = {
                ...git,
                ...params
            }, Object.keys(obj).reduce(((all, one) => all.replace(`{${one}}`, obj[one])), url));
            var url, obj;
            return await fetchJSON(filledUrl, {
                ...opts,
                ...extraOpts
            });
        }, ghPost = async (url, params, body) => await ghFetch(url, params, {
            method: "POST",
            body: JSON.stringify(body)
        }), fileToTree = ({path: path}, index) => ({
            path: path,
            mode: "100644",
            type: "blob",
            sha: blobs[index].sha
        }), treeToTree = ({path: path, mode: mode, type: type, sha: sha}) => ({
            path: path,
            mode: mode,
            type: type,
            sha: sha
        }), filesWithoutDeleted = files.filter((x => !x.deleteFile)), deletedFilePaths = files.filter((x => x.deleteFile)).map((x => x.path)), filePaths = filesWithoutDeleted.map((x => x.path));
        blobs = await Promise.all(filesWithoutDeleted.map((({content: content}) => ghPost(urls.blobCreate, null, (content => {
            try {
                return {
                    content: btoa(content),
                    encoding: "base64"
                };
            } catch (e) {
                return {
                    content: content,
                    encoding: "utf-8"
                };
            }
        })(content)))));
        const latest = await ghFetch(urls.branch), fullTree = await ghFetch(urls.treeRecurse, {
            sha: latest?.commit?.sha
        }), createdTree = await ghPost(urls.tree, null, {
            tree: (fwodel = filesWithoutDeleted, fullt = fullTree, fileps = filePaths, delfileps = deletedFilePaths, 
            [ ...fwodel.map(fileToTree), ...fullt.tree.filter((x => "tree" !== x.type && !fileps.includes(x.path) && !delfileps.includes(x.path))).map(treeToTree) ])
        });
        var fwodel, fullt, fileps, delfileps;
        const newCommit = await ghPost(urls.createCommit, null, {
            message: message,
            tree: createdTree.sha,
            parents: [ latest.commit.sha ]
        });
        return ((await ghPost(urls.refs, null, {
            sha: newCommit.sha
        }))?.object?.url || "no commit url available").replace("https://api.github.com/repos", "https://github.com").replace("git/commits", "commit");
    }
    return class {
        constructor({storage: storage, fetchContents: fetchContents, app: app, utils: utils}) {
            return new Promise(((resolve, reject) => {
                try {
                    this.handler = (githubProvider = this, async (which, handlerArgs) => {
                        try {
                            const {params: params, event: event, service: service, parent: parent} = handlerArgs, req = event && event?.request?.clone(), payload = req && await (req?.json()), {providerType: providerType} = payload || {};
                            if ("createCommit" === which) return await githubProvider.createCommit(payload, params);
                            if (!(providerType ? "github-provider" === providerType : "github" === (service || parent)?.type)) return;
                            const githubHandler = githubProvider[which];
                            if (!githubHandler) return;
                            return [ "filesUpdate" ].includes(which) ? await githubHandler(handlerArgs) : await githubHandler(payload, params);
                        } catch (e) {}
                    }), this.storage = storage, this.fetchContents = fetchContents, this.fetchJSON = _fetchJSON, 
                    this.app = app, this.utils = utils, this.test = (githubProvider => async (payload, params) => {
                        try {
                            const {storage: storage} = githubProvider, {auth: auth, repo: repo, branch: branch} = payload, opts = {
                                headers: {}
                            };
                            auth && (opts.headers.authorization = `token ${auth}`), opts.headers.Accept = "application/vnd.github.v3+json";
                            const result = await githubProvider.fetchJSON(urls.rateLimit, opts);
                            let {limit: limit, remaining: remaining, reset: reset} = result?.resources?.core;
                            return reset = new Date(1e3 * reset).toLocaleString("sv").split(" ").reverse().join(" "), 
                            console.log(stringify({
                                limit: limit,
                                remaining: remaining,
                                reset: reset
                            })), stringify({
                                success: !0,
                                limit: limit,
                                remaining: remaining,
                                reset: reset
                            });
                        } catch (error) {
                            return stringify({
                                error: error
                            });
                        }
                    })(this), this.create = (githubProvider => async (payload, params) => {
                        try {
                            const {storage: storage} = githubProvider, {auth: auth, repo: repo, branch: branch} = payload;
                            return storage.stores.providers, console.log({
                                payload: payload,
                                params: params
                            }), NOT_IMPLEMENTED_RESPONSE();
                        } catch (error) {
                            return console.error(error), stringify({
                                error: error
                            });
                        }
                    })(this), this.read = async (payload, params) => NOT_IMPLEMENTED_RESPONSE(), this.update = githubDelete(), 
                    this.delete = githubDelete(), this.servicesCreate = githubServiceCreate(this), this.servicesRead = githubServiceRead(), 
                    this.servicesUpdate = githubServiceUpdate(), this.servicesDelete = githubServiceDelete(), 
                    this.filesCreate = githubServiceCreate(this), this.filesRead = githubServiceRead(), 
                    this.filesUpdate = githubServiceUpdate(), this.filesDelete = githubServiceDelete(), 
                    this.createCommit = (githubProvider => async (payload, params) => {
                        try {
                            const {message: message, auth: auth, cwd: cwd} = payload;
                            if (!message) return stringify({
                                error: "commit message is required"
                            });
                            if (!auth) return stringify({
                                error: "auth token is required for commit"
                            });
                            if (!cwd) return stringify({
                                error: "current working directory (cwd) is required for commit"
                            });
                            const {storage: {stores: stores}, utils: utils} = githubProvider, servicesStore = stores.services, changesStore = stores.changes, filesStore = stores.files, {flattenObject: flattenObject} = utils;
                            let service;
                            if (await servicesStore.iterate(((value, key) => {
                                const {tree: tree, name: name} = value;
                                return cwd === `${name}/` || flattenObject(tree).includes(cwd) ? (service = value, 
                                !0) : void 0;
                            })), !(service && service.name && service.branch && service.repo && "github" === service?.type)) throw new Error("missing or malformed service");
                            const svcRegExp = new RegExp("^" + service.name + "/", "g"), {owner: owner, repo: repo, branch: branch} = service, git = {
                                owner: owner,
                                repo: repo,
                                branch: branch
                            }, files = [], changes = [], changesKeys = await changesStore.keys();
                            for (let i = 0, len = changesKeys.length; i < len; i++) {
                                const key = changesKeys[i];
                                if (!svcRegExp.test(key)) continue;
                                const change = await changesStore.getItem(key);
                                if (!change?.service) continue;
                                const {type: operation, value: content, service: {name: parent}, deleteFile: deleteFile} = change;
                                if (!parent) continue;
                                if (parent !== service.name) continue;
                                const file = {
                                    path: key.replace(svcRegExp, ""),
                                    content: content,
                                    operation: operation,
                                    deleteFile: deleteFile
                                };
                                file.path.startsWith(".git/") && (file.ignore = !0), files.push(file), changes.push({
                                    ...change,
                                    key: key
                                });
                            }
                            let commitResponse;
                            if (files.filter((x => !x.ignore)).length) {
                                if (commitResponse = await commit({
                                    auth: auth,
                                    files: files,
                                    git: git,
                                    message: message,
                                    fetchJSON: githubProvider.fetchJSON
                                }), !commitResponse) throw new Error("commit failed");
                                if (commitResponse.error) throw new Error(commitResponse.error);
                            } else commitResponse = {
                                error: "no files changed"
                            };
                            for (let i = 0, len = files.length; i < len; i++) {
                                const change = changes[i];
                                change.deleteFile ? await filesStore.removeItem(change.key) : await filesStore.setItem(change.key, change.value), 
                                await changesStore.removeItem(change.key);
                            }
                            return stringify({
                                commitResponse: commitResponse
                            });
                        } catch (e) {
                            return stringify({
                                commitResponse: {
                                    error: e.message
                                }
                            });
                        }
                    })(this), resolve(this);
                } catch (error) {
                    reject(error);
                }
                var githubProvider;
            }));
        }
    };
})(), ServicesManager = (() => {
    const stringify = o => JSON.stringify(o, null, 2), clone = o => {
        if (o) try {
            return JSON.parse(stringify(o));
        } catch (e) {
            return;
        }
    }, unique = a => [ ...new Set(a) ];
    function objectPath(obj, path) {
        var result = obj;
        try {
            return path.split("/").every((function(prop) {
                return "." === prop || (void 0 === result[prop] ? (result = void 0, !1) : (result = result[prop], 
                !0));
            })), result;
        } catch (e) {
            return;
        }
    }
    const pipe = (...fns) => x => fns.reduce(((v, f) => f(v)), x), stripFrontDotSlash = x => x.replace(/^\.\//, ""), handleServiceCreate = ({app: app, storage: storage, providers: providers}) => async (params, event) => {
        const servicesStore = storage.stores.services, filesStore = storage.stores.files, {id: id} = params;
        if ("provider" === id) return await providers.createServiceHandler(event);
        const {name: name} = await event.request.json() || {};
        if (!id) return stringify({
            params: params,
            event: event,
            error: "id required for service create!"
        });
        if (!name) return stringify({
            params: params,
            event: event,
            error: "name required for service create!"
        });
        console.log("/service/create/:id? triggered"), await servicesStore.setItem(id + "", {
            name: name,
            id: id,
            tree: {
                [name]: {
                    ".templates": {
                        "json.html": {}
                    },
                    "package.json": {}
                }
            }
        }), filesStore.setItem(`./${name}/package.json`, {
            main: "package.json",
            comment: "this is an example package.json"
        }), filesStore.setItem(`./${name}/.templates/json.html`, "\n\t\t\t\t<html>\n\t\t\t\t\t\t<p>basic json template output</p>\n\t\t\t\t\t\t<pre>{{template_value}}</pre>\n\t\t\t\t</html>\n\t\t\t\t"), 
        await app.addServiceHandler({
            name: name,
            msg: "served from fresh baked"
        });
        const services = storage.defaultServices();
        return stringify({
            result: {
                services: [ services.filter((x => 777 === Number(x.id))) ]
            }
        });
    }, handleServiceChange = ({storage: storage, utils: utils, templates: templates}) => async (params, event) => {
        const servicesStore = storage.stores.services;
        storage.stores.files;
        const changesStore = storage.stores.changes;
        let jsonData, fileData;
        try {
            const clonedRequest = event.request.clone();
            jsonData = await clonedRequest.json();
        } catch (e) {}
        try {
            if (!jsonData) {
                const formData = await event.request.formData();
                jsonData = JSON.parse(formData.get("json")), fileData = formData.get("file");
            }
        } catch (e) {}
        try {
            let {path: path, code: code, command: command, service: serviceName} = jsonData;
            fileData && (code = fileData || "");
            const service = await servicesStore.iterate(((value, key) => {
                if (value.name === serviceName) return value;
            }));
            "github" === service.type && "./" == `${path.slice(0, 2)}` && (path = path.slice(2)), 
            await changesStore.setItem(path, {
                type: "update",
                value: code,
                service: (() => {
                    const {tree: tree, ...rest} = service;
                    return rest;
                })()
            }), service && "upsert" === command && (service.tree = utils.treeInsertFile(path, service.tree), 
            await servicesStore.setItem(service.id + "", service)), path.includes("/.templates/") && await templates.refresh();
            const metaData = () => "";
            return stringify({
                result: {
                    path: path,
                    code: fileData ? metaData(fileData) : code
                }
            });
        } catch (error) {
            return stringify({
                error: error
            });
        }
    }, handleServiceGetChanges = ({storage: storage, utils: utils, templates: templates}) => async (params, event, query) => {
        const {flattenObject: flattenObject} = utils, servicesStore = storage.stores.services, filesStore = storage.stores.files, changesStore = storage.stores.changes, {cwd: cwd} = query;
        let service;
        cwd && await servicesStore.iterate(((value, key) => {
            const {tree: tree} = value;
            if (flattenObject(tree).includes(cwd)) return service = value.name, !0;
        }));
        const changes = [], changesKeys = await changesStore.keys();
        for (let i = 0, len = changesKeys.length; i < len; i++) {
            const key = changesKeys[i], value = await changesStore.getItem(key), parent = value?.service?.name;
            parent && (service && parent !== service || changes.push({
                fileName: key,
                ...value,
                original: await filesStore.getItem(key)
            }));
        }
        try {
            return stringify({
                changes: changes,
                cwd: cwd
            });
        } catch (error) {
            return stringify({
                error: error
            });
        }
    }, _operationsUpdater = (() => {
        const getBody = operation => {
            const convertStoreObject = (code = {}) => (Object.entries(code).forEach((([k, v]) => {
                if ("./" !== k.slice(2)) {
                    if ("/" === k[0]) return delete code[k], void (code["." + k] = v);
                    delete code[k], code["./" + k] = v;
                }
            })), code);
            return {
                ...operation,
                service: operation.service.name,
                tree: clone(operation.service.tree) || {},
                code: convertStoreObject(operation.code),
                changes: convertStoreObject(operation.changes),
                filesToAdd: [],
                filesToDelete: []
            };
        }, adjustMoveTarget = operation => {
            if (!(operation.name.includes("move") || operation.name.includes("copy"))) return operation;
            let {target: target, source: source} = operation;
            return operation.name.includes("Folder"), target.endsWith("/") && (target += source.split("/").pop()), 
            {
                ...operation,
                target: target
            };
        }, adjustRenameTarget = operation => {
            if (!operation.name.includes("rename")) return operation;
            let target = operation.target;
            return !operation.target.includes("/") && operation.source.includes("/") && (target = [ ...operation.source.split("/").slice(0, -1), target ].join("/")), 
            {
                ...operation,
                target: target
            };
        }, keepHelper = operation => {
            let {filesToAdd: filesToAdd, filesToDelete: filesToDelete} = operation;
            const {tree: tree, code: code, utils: utils, service: service, changes: changes} = operation;
            utils.keepHelper(tree, (() => {
                const changesFiles = Object.entries(changes).map((([path, value]) => ({
                    name: path.split("/").pop(),
                    path: path
                })));
                return [ ...Object.entries(code).map((([path, value]) => ({
                    name: path.split("/").pop(),
                    path: path
                }))), ...changesFiles ];
            })()).filter((x => x.includes("/.keep"))).map((x => "." + x)).forEach((k => {
                const parentPath = k.split("/").slice(0, -1).join("/").replace(service + "/", ""), parentInTree = objectPath(tree[service], parentPath) || {};
                parentInTree && (parentInTree[".keep"] = {}, code[k] = " ", filesToAdd.push(k), 
                filesToDelete = filesToDelete.filter((x => x !== k)));
            }));
            return Object.keys(operation.code).filter((x => x.includes("/.keep"))).forEach((k => {
                const parentPath = k.split("/").slice(0, -1).join("/").replace(service + "/", ""), parentInTree = objectPath(tree[service], parentPath) || {};
                if (0 === Object.keys(parentInTree).filter((x => ".keep" !== x)).length) return;
                delete parentInTree[".keep"], delete code[k];
                filesToAdd.find((x => x === k)) || filesToDelete.push(k), filesToAdd = filesToAdd.filter((x => x !== k));
            })), {
                ...operation,
                filesToAdd: filesToAdd,
                filesToDelete: filesToDelete,
                code: code,
                tree: tree
            };
        }, addSourceToTarget = pipe((operation => {
            if (operation.name.includes("File")) return operation;
            const sourcePath = `./${operation.service}/${operation.source}`, targetPath = `./${operation.service}/${operation.target}`, children = unique([ ...Object.keys(operation.code), ...Object.keys(operation.changes) ]).filter((x => x.startsWith(sourcePath + "/"))), childrenMappedToTarget = children.map((child => {
                const childRelative = child.split(operation.source).pop();
                return `${targetPath}${childRelative}`;
            })), filesToAdd = [ ...operation.filesToAdd, ...childrenMappedToTarget ];
            return children.forEach(((c, i) => {
                operation.code[childrenMappedToTarget[i]] = async store => await store.getItem(c);
            })), {
                ...operation,
                filesToAdd: filesToAdd
            };
        }), (operation => {
            const {service: service, source: source, target: target, tree: tree} = operation, sourceValue = objectPath(tree[service], source) || {}, targetSplit = target.split("/"), targetKey = 1 === targetSplit.length ? targetSplit[0] : targetSplit.slice(-1).join("/"), targetParentPath = 1 === targetSplit.length ? "" : targetSplit.slice(0, -1).join("/");
            return (1 === targetSplit.length ? tree[service] : objectPath(tree[service], targetParentPath))[targetKey] = sourceValue, 
            {
                ...operation,
                tree: tree
            };
        }), (operation => {
            if (!operation.name.includes("File")) return operation;
            const path = `./${operation.service}/${operation.target}`, update = `./${operation.service}/${operation.source}`, fileGetter = "addFile" === operation.name ? async store => operation.source || "" : async store => await store.getItem(update);
            operation.code[path] = fileGetter;
            const filesToAdd = [ ...operation.filesToAdd, path ];
            return {
                ...operation,
                filesToAdd: filesToAdd
            };
        })), deleteSource = pipe((operation => {
            if (operation.name.includes("File")) return operation;
            const sourcePath = `./${operation.service}/${operation.source}`, children = unique([ ...Object.keys(operation.code), ...Object.keys(operation.changes) ]).filter((x => x.startsWith(sourcePath + "/"))), filesToDelete = [ ...operation.filesToDelete, ...children ];
            return children.forEach((c => {
                delete operation.code[c];
            })), {
                ...operation,
                filesToDelete: filesToDelete
            };
        }), (operation => {
            const {service: service, source: source, tree: tree} = operation, sourceSplit = source.split("/"), sourceKey = 1 === sourceSplit.length ? sourceSplit[0] : sourceSplit.slice(-1).join("/"), sourceParentPath = 1 === sourceSplit.length ? "" : sourceSplit.slice(0, -1).join("/");
            return delete (1 === sourceSplit.length ? tree[service] : objectPath(tree[service], sourceParentPath))[sourceKey], 
            operation;
        }), (operation => {
            if (!operation.name.includes("File")) return operation;
            const path = `./${operation.service}/${operation.source}`;
            delete operation.code[`./${operation.service}/${operation.source}`];
            const filesToDelete = [ ...operation.filesToDelete, path ];
            return {
                ...operation,
                filesToDelete: filesToDelete
            };
        })), init = (...fns) => pipe(getBody, adjustMoveTarget, adjustRenameTarget, ...fns, keepHelper), add = init(addSourceToTarget), copy = init(addSourceToTarget), move = init(addSourceToTarget, deleteSource), rename = init(addSourceToTarget, deleteSource), remove = init(deleteSource), operations = {
            addFile: add,
            addFolder: add,
            moveFile: move,
            moveFolder: move,
            copyFile: copy,
            copyFolder: copy,
            renameFile: rename,
            renameFolder: rename,
            deleteFile: remove,
            deleteFolder: remove
        };
        return operation => (service, code, utils, changes) => operations[operation.name]({
            ...operation,
            service: service,
            code: code,
            utils: utils,
            changes: changes
        });
    })(), handleServiceUpdate = ({storage: storage, providers: providers, utils: utils}) => async (params, event) => {
        const servicesStore = storage.stores.services, filesStore = storage.stores.files, changesStore = storage.stores.changes;
        try {
            const {id: id} = params, body = await event.request.json(), {name: name, operation: operation} = body, isMoveOrRename = operation?.name?.includes("rename") || operation?.name?.includes("move"), isCopy = operation?.name?.includes("copy"), operationsUpdater = _operationsUpdater(operation);
            let update;
            if (operationsUpdater) {
                const _service = await servicesStore.getItem(id + ""), fileKeys = (await filesStore.keys()).filter((key => key.startsWith(`./${_service.name}/`) || key.startsWith(`${_service.name}/`))), changeKeys = (await changesStore.keys()).filter((key => key.startsWith(`./${_service.name}/`) || key.startsWith(`${_service.name}/`))), _code = fileKeys.reduce(((all, key) => ({
                    ...all,
                    [key]: ""
                })), {}), _changed = changeKeys.reduce(((all, key) => ({
                    ...all,
                    [key]: ""
                })), {});
                update = operationsUpdater(_service, _code, utils, _changed);
                const getItem = (target, update) => async key => {
                    let formattedKey = key;
                    "./" === key.slice(0, 2) && "github" === _service.type && (formattedKey = key.slice(2)), 
                    "/" === key.slice(0, 1) && "github" === _service.type && (formattedKey = key.slice(1));
                    const changed = await changesStore.getItem(formattedKey);
                    if (changed && "update" === changed.type) return changed.value;
                    if (changed && changed.deleteFile) {
                        return update.filesToAdd = update.filesToAdd.filter((x => x !== target)), delete objectPath(update.tree, target.split("/").slice(0, -1).join("/"))[target.split("/").pop()], 
                        "";
                    }
                    return await filesStore.getItem(formattedKey);
                };
                for (var key in update.code) "function" == typeof update.code[key] && (update.code[key] = await update.code[key]({
                    getItem: getItem(key, update)
                }));
            }
            if (update && (body.code = Object.entries(update.code).map((([path, value]) => ({
                name: path.split("/").pop(),
                path: path.replace(/^\.\//, ""),
                update: value
            }))), body.tree = update.tree), !update && (isMoveOrRename || isCopy)) {
                const service = await servicesStore.getItem(id + ""), filesFromService = (await filesStore.keys()).filter((key => key.startsWith(`./${service.name}/`)));
                body.code = [];
                for (var i = 0, len = filesFromService.length; i < len; i++) {
                    const key = filesFromService[i], filename = operation.target.endsWith("/") ? operation.source.split("/").pop() : "", update = await filesStore.getItem(key), renameKey = (key, force) => isMoveOrRename || force ? key.replace(`./${service.name}/${operation.source}`, `./${service.name}/${operation.target}${filename}`) : key, copyFile = () => {
                        if (!key.includes(`./${service.name}/${operation.source}`)) return;
                        const copiedFile = {
                            name: operation.target.split("/").pop(),
                            update: update,
                            path: renameKey(key, "force").replace(/^\./, "")
                        };
                        body.code.push(copiedFile);
                    };
                    body.code.push({
                        name: key.split("/").pop(),
                        update: update,
                        path: renameKey(key).replace(/^\./, "")
                    }), isCopy && copyFile();
                }
                body.tree = service.tree;
                const getPosInTree = (path, tree) => ({
                    parent: path.split("/").slice(0, -1).reduce(((all, one) => (all[one] = all[one] || {}, 
                    all[one])), body.tree),
                    param: path.split("/").pop()
                }), sourcePos = getPosInTree(`${service.name}/${operation.source}`, body.tree), targetPos = getPosInTree(`${service.name}/${operation.target}`, body.tree);
                targetPos.parent[targetPos.param || sourcePos.param] = sourcePos.parent[sourcePos.param], 
                isMoveOrRename && delete sourcePos.parent[sourcePos.param];
            }
            const parsedCode = !Array.isArray(body.code) && utils.safe((() => JSON.parse(body.code)));
            parsedCode && parsedCode.tree && (body.tree = parsedCode.tree, body.code = parsedCode.files);
            const service = {
                ...await servicesStore.getItem(id + "") || {},
                name: name,
                tree: body.tree
            };
            if (!service.name) return void console.error("cannot set meta store item without name");
            await servicesStore.setItem(id + "", service);
            const {filesToAdd: filesToAdd, filesToDelete: filesToDelete} = await (async () => {
                if (update && update.filesToAdd && update.filesToDelete) return update;
                const filesFromUpdateTree = utils.keepHelper(body.tree, body.code).map((x => `.${x}`)), filesInStore = (await filesStore.keys()).filter((key => key.startsWith(`./${service.name}/`))), filesToDelete = filesInStore.filter((file => !filesFromUpdateTree.includes(file)));
                return {
                    filesToAdd: filesFromUpdateTree.filter((file => !filesInStore.includes(file))),
                    filesToDelete: filesToDelete
                };
            })();
            for (let i = 0, len = filesToAdd.length; i < len; i++) {
                const path = [ "github", "default" ].includes(service.type) ? stripFrontDotSlash(filesToAdd[i]) : filesToAdd[i], fileUpdate = body.code.find((x => `.${x.path}` === path || x.path === `/${path}` || x.path === path));
                let fileUpdateCode;
                fileUpdate?.update && (fileUpdateCode = fileUpdate.update, delete fileUpdate.update);
                const code = fileUpdateCode || "";
                await changesStore.setItem(path, {
                    type: "update",
                    value: code,
                    service: (() => {
                        const {tree: tree, ...rest} = service;
                        return rest;
                    })()
                });
            }
            for (let i = 0, len = filesToDelete.length; i < len; i++) {
                const path = "github" === service.type ? stripFrontDotSlash(filesToDelete[i]) : filesToDelete[i];
                null !== await filesStore.getItem(path) ? await changesStore.setItem(path, {
                    deleteFile: !0,
                    service: (() => {
                        const {tree: tree, ...rest} = service;
                        return rest;
                    })()
                }) : await changesStore.removeItem(path);
            }
            const changed = (await changesStore.keys()).filter((x => x.startsWith(`${service.name}`))).map((x => x.split(service.name + "/")[1])), opened = await changesStore.getItem(`state-${service.name}-opened`) || [], selected = (opened.find((x => 0 === x.order)) || {}).name || "";
            return stringify({
                result: [ {
                    id: service.id,
                    name: service.name,
                    code: body.code.map((({name: name, path: path}) => ({
                        name: name,
                        path: path
                    }))),
                    tree: body.tree,
                    state: {
                        opened: opened,
                        selected: selected,
                        changed: changed
                    },
                    treeState: {
                        expand: await changesStore.getItem(`tree-${service.name}-expanded`) || [],
                        select: selected,
                        changed: changed,
                        new: []
                    }
                } ]
            });
        } catch (error) {
            console.error(error);
            const {stack: stack, message: message} = error;
            return stringify({
                error: {
                    message: message,
                    stack: stack
                }
            });
        }
    };
    return class {
        constructor({app: app, storage: storage, providers: providers, templates: templates, utils: utils}) {
            this.app = app, this.storage = storage, this.providers = providers, this.templates = templates, 
            this.utils = utils, this.handlers = {
                serviceCreate: handleServiceCreate(this),
                serviceChange: handleServiceChange(this),
                serviceGetChanges: handleServiceGetChanges(this),
                serviceUpdate: handleServiceUpdate(this),
                serviceDelete: (params, event) => (console.log("/service/delete/:id? triggered"), 
                stringify({
                    params: params,
                    event: event
                }))
            };
        }
    };
})(), TemplateEngine = class {
    templates=[];
    constructor({storage: storage}) {
        this.storage = storage, this.refresh = this.refresh.bind(this), this.NO_PREVIEW = '\n\t\t<!DOCTYPE html>\n\t\t<html class="dark-enabled">\n\t\t\t<head>\n\t\t\t\t<meta charset="UTF-8">\n\t\t\t</head>\n\t\t\t<style>\n\t\t\t\t.no-preview {\n\t\t\t\t\tposition: absolute;\n\t\t\t\t\ttop: 0;\n\t\t\t\t\tleft: 0;\n\t\t\t\t\twidth: 100%;\n\t\t\t\t\theight: 100%;\n\t\t\t\t\tdisplay: flex;\n\t\t\t\t\tjustify-content: center;\n\t\t\t\t\talign-items: center;\n\t\t\t\t\tfont-size: 1.5em;\n\t\t\t\t\tcolor: var(--main-theme-text-color);\n\t\t\t\t}\n\t\t\t\tbody {\n\t\t\t\t\tmargin: 0px;\n\t\t\t\t\tmargin-top: 40px;\n\t\t\t\t\theight: calc(100vh - 40px);\n\t\t\t\t\toverflow: hidden;\n\t\t\t\t\tcolor: var(--main-theme-text-color);\n\t\t\t\t\tbackground: var(--main-theme-color);\n\t\t\t\t\tfont-family: sans-serif;\n\t\t\t\t}\n\t\t\t</style>\n\t\t\t<link rel="stylesheet" href="/colors.css" />\n\t\t\t<body>\n\t\t\t\t<pre>\n\t\t\t\t\t<div class="no-preview" title="No preview!">⠝⠕ ⠏⠗⠑⠧⠊⠑⠺</div>\n\t\t\t\t</pre>\n\t\t\t</body>\n\t\t</html>\n\t\t'.replace(/^		/g, "");
    }
    add(name, template) {
        const newTemp = {
            name: name,
            extensions: [],
            body: template,
            tokens: [ "{{template_value}}", "{{markdown}}", "{{template_input}}" ],
            matcher: () => !1
        };
        newTemp.extensions.push(name.split(".").shift()), newTemp.convert = contents => {
            let xfrmed = newTemp.body + "";
            return newTemp.tokens.forEach((t => {
                xfrmed = xfrmed.replace(new RegExp(t, "g"), contents);
            })), xfrmed;
        }, this.templates.push(newTemp);
    }
    update(name, contents) {
        const ext = name.split(".").shift(), matchingTemplates = this.templates.filter((t => t.extensions.includes(ext)));
        matchingTemplates.forEach((m => m.body = contents)), matchingTemplates.length || this.add(name, contents);
    }
    getTemplate(filename = "", contents = "") {
        const ext = filename.split(".").pop(), extMatch = this.templates.find((x => x.extensions.includes(ext)));
        return extMatch || (() => {
            if (filename.includes(".json") && contents.includes("file-type")) try {
                const fileType = JSON.parse(contents)["file-type"];
                if (!fileType) return;
                return this.templates.find((x => x.extensions.includes(fileType)));
            } catch (e) {
                return void console.error(e);
            }
        })();
    }
    convert(filename, contents) {
        if (filename.split(".").pop(), filename.includes(".htm")) return contents;
        if (!this.templates.length) return !1;
        const foundTemplate = this.getTemplate(filename, contents);
        return foundTemplate ? foundTemplate.convert(contents) : void 0;
    }
    async refresh() {
        const filesStore = this.storage.stores.files, currentTemplateNames = (await filesStore.keys()).filter((x => x.includes("/.templates/")));
        for (var i = 0, len = currentTemplateNames.length; i < len; i++) {
            const key = currentTemplateNames[i], value = await filesStore.getItem(key), name = key.split("/").pop();
            this.templates.find((x => x.name === name)) ? this.update(name, value) : this.add(name, value);
        }
    }
}, init = async ({cacheName: cacheName}) => {
    const swHandlers = self.handlers;
    await utils.initMimeTypes();
    const storage = new StorageManager({
        utils: utils
    }), templates = new TemplateEngine({
        storage: storage
    }), app = new Router({
        storage: storage,
        templates: templates,
        swHandlers: swHandlers
    }), providers = await new ProviderManager({
        app: app,
        storage: storage,
        utils: utils,
        GithubProvider: GithubProvider
    }), services = new ServicesManager({
        app: app,
        storage: storage,
        providers: providers,
        utils: utils,
        templates: templates
    });
    return app.get("/service/search/", storage.handlers.serviceSearch), app.get("/service/read/:id?", storage.handlers.serviceRead), 
    app.post("/service/create/:id?", services.handlers.serviceCreate), app.get("/service/change", services.handlers.serviceGetChanges), 
    app.post("/service/change", services.handlers.serviceChange), app.post("/service/commit", providers.handlers.createCommit), 
    app.post("/service/update/:id?", services.handlers.serviceUpdate), app.post("/service/provider/delete/:id?", services.handlers.serviceDelete), 
    app.post("/service/provider/test/:id?", providers.handlers.testHandler), app.post("/service/provider/create", providers.handlers.createHandler), 
    app.post("/service/provider/read/:id?", providers.handlers.readHandler), app.post("/service/provider/update/:id?", providers.handlers.updateHandler), 
    app.post("/service/provider/delete/:id?", providers.handlers.deleteHandler), app.get("/manage/:id?", utils.notImplementedHandler), 
    app.get("/monitor/:id?", utils.notImplementedHandler), app.get("/persist/:id?", utils.notImplementedHandler), 
    async event => {
        const serviceAPIMatch = await app.find(event.request), res = serviceAPIMatch ? await serviceAPIMatch.exec(event) : "no match in service request listener!";
        let response;
        if (event.request.url.includes("/::preview::/")) return response = new Response(utils.addBase(res), {
            headers: {
                "Content-Type": "text/html"
            }
        }), response;
        let {contentType: contentType} = utils.getMime(event.request.url) || {};
        return contentType || !serviceAPIMatch || res?.type || ({contentType: contentType} = utils.getMime(".json")), 
        contentType ? (response = new Response(res, {
            headers: {
                "Content-Type": contentType || res.type
            }
        }), response) : new Response(res);
    };
};

var Handler = {
    init: init
};

const cacheName = "v0.4.4";

importScripts("/shared/vendor/localforage.min.js"), importScripts("/shared/vendor/json5v-2.0.0.min.js"), 
self.addEventListener("install", installHandler), self.addEventListener("activate", activateHandler), 
self.addEventListener("fetch", asyncFetchHandler), self.addEventListener("foreignfetch", asyncFetchHandler), 
self.addEventListener("message", messageHandler), self.addEventListener("sync", syncHandler), 
self.addEventListener("push", pushHandler), self.handlers = [];

const driver = [ localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE ];

let handlerStore, handler;

function getHandlerStore() {
    return handlerStore || localforage.createInstance({
        driver: driver,
        name: "service-worker",
        version: 1,
        storeName: "handlers",
        description: "used after app has booted when service worker is updated"
    });
}

async function getHandler() {
    return handler = handler || await Handler.init({
        cacheName: cacheName
    }), handler;
}

handlerStore = getHandlerStore();

const activateHandlers = async () => {
    handlerStore = getHandlerStore();
    const genericHandler = await getHandler(), eachHandlerStoreItem = (value, key) => {
        const {type: type, route: route, handlerName: handlerName, handlerText: handlerText} = value, foundHandler = self.handlers.find((x => x.handlerName === handlerName)), foundExactHandler = foundHandler && self.handlers.find((x => x.handlerName === handlerName && x.routePattern === route));
        if (foundExactHandler) return;
        let handlerFunction;
        if (!foundHandler) try {
            handlerFunction = eval(handlerText);
        } catch (e) {
            handlerFunction = genericHandler;
        }
        self.handlers.push({
            type: type,
            routePattern: route,
            route: "fetch" === type ? new RegExp(route) : route,
            handler: handlerFunction || (foundHandler ? foundHandler.handler : void 0),
            handlerName: handlerName,
            handlerText: handlerText
        });
    };
    return await handlerStore.iterate(eachHandlerStoreItem);
};

async function installHandler(event) {
    return console.log("service worker install event"), self.skipWaiting();
}

function activateHandler(event) {
    console.log("service worker activate event"), event.waitUntil((async () => (await self.clients.claim(), 
    await activateHandlers()))());
}

function asyncFetchHandler(event) {
    if (!(event.request.url.includes("https://crosshj.auth0.com") || event.request.url.includes("index.bootstrap") || event.request.url.includes("localhost:3333") || event.request.url.includes("allorigins") || event.request.url.includes("browser-sync/socket.io") || event.request.url.includes("browser-sync/browser-sync-client") || event.request.url.includes("?browsersync=") || "no-store" === event.request.cache || "no-cache" === event.request.headers.get("pragma") && "no-cache" === event.request.headers.get("cache-control"))) if (event.request.url.includes("unpkg") || event.request.url.includes("cdn.jsdelivr") || event.request.url.includes("rawgit.com") || event.request.url.includes("cdn.skypack.dev")) {
        const response = async () => {
            const cache = await caches.open(cacheName), cacheResponse = await cache.match(event.request);
            if (cacheResponse) return cacheResponse;
            const networkResponse = await fetch(event.request);
            return cache.put(event.request, networkResponse.clone()), networkResponse;
        };
        event.respondWith(response());
    } else event.request.url.includes("https://webtorrent.io/torrents/") || event.request.url.includes("api.github.com") || event.respondWith(async function() {
        self.handlers.length || await activateHandlers();
        return await fetchHandler(event);
    }());
}

async function fetchHandler(event) {
    const genericHandler = await getHandler(), routeHandlerBlacklist = [ "//(.*)" ], path = event.request.url.replace(location.origin, "");
    if (event.request.url.includes(location.origin + "/~/")) return genericHandler(event);
    if (self.handlers.filter((x => !routeHandlerBlacklist.includes(x.routePattern))).find((x => "fetch" === x.type && x.route.test(path)))) return genericHandler(event);
    const cacheMatch = await caches.match(event.request);
    return cacheMatch || await fetch(event.request);
}

function messageHandler(event) {
    const {data: data} = event, {bootstrap: bootstrap} = data || {};
    bootstrap ? (async () => {
        try {
            console.log("booting");
            const bootstrapMessageEach = module => {
                const client = event.source;
                client ? client.postMessage({
                    module: module,
                    msg: "module-loaded"
                }) : console.error("failed to notify client on boot complete");
            }, modules = await bootstrapHandler(bootstrap, bootstrapMessageEach), client = event.source;
            if (!client) return void console.error("failed to notify client on boot complete");
            client.postMessage({
                modules: modules.filter((x => !x.includes || !x.includes("NOTE:"))),
                msg: "boot complete"
            });
        } catch (e) {
            console.log(e);
            const client = event.source;
            if (!client) return void console.error("failed to notify client on boot complete");
            client.postMessage({
                msg: "boot error - you offline?"
            });
        }
    })() : (console.log("service worker message event"), console.log({
        data: data
    }));
}

function syncHandler(event) {
    console.log("service worker sync event");
}

function pushHandler(event) {
    console.log("service worker push event");
}

async function bootstrapHandler({manifest: manifest}, bootstrapMessageEach) {
    const manifestResponse = await fetch(manifest), _manifest = JSON5.parse(await manifestResponse.text()), _source = new Response(JSON.stringify(_manifest, null, 2), {
        status: manifestResponse.status,
        statusText: manifestResponse.statusText,
        headers: manifestResponse.headers
    });
    await caches.open(cacheName).then((function(cache) {
        cache.put(manifest, _source);
    }));
    const {modules: modules} = _manifest || {};
    if (modules && Array.isArray(modules)) {
        for (var i = 0, len = modules.length; i < len; i++) await registerModule(modules[i]), 
        bootstrapMessageEach(modules[i]);
        return modules;
    }
    console.error("Unable to find modules in service manifest");
}

async function registerModule(module) {
    try {
        if (module.includes && module.includes("NOTE:")) return;
        const {source: source, include: include, route: route, handler: handler, resources: resources, type: type} = module;
        if (!route && !resources) return void console.error("module must be registered with a route or array of resources!");
        if (handler) {
            const genericHandler = await getHandler();
            let foundHandler = self.handlers.find((x => x.handlerName === handler)), handlerFunction, handlerText;
            "./modules/service-worker.handler.js" === handler && genericHandler && (handlerText = "service-worker-handler-register-module", 
            handlerFunction = genericHandler, foundHandler = {
                handler: handler,
                handlerText: handlerText
            }), foundHandler && foundHandler.handler || (handlerText = await (await fetch(handler)).text(), 
            handlerFunction = eval(handlerText));
            const foundExactHandler = foundHandler && self.handlers.find((x => x.handlerName === handler && x.routePattern === route));
            if (foundExactHandler) return;
            return await handlerStore.setItem(route, {
                type: type,
                route: route,
                handlerName: handler,
                handlerText: handlerText || foundHandler.handlerText
            }), void self.handlers.push({
                type: type,
                routePattern: route,
                route: "fetch" === type ? new RegExp(route) : route,
                handler: handlerFunction || foundHandler.handler,
                handlerName: handler,
                handlerText: handlerText || foundHandler.handlerText
            });
        }
        if (resources && await Promise.all(resources.map((async resourceUrl => {
            const opts = {};
            resourceUrl.includes(".htm") && (opts.headers = opts.headers || {}, opts.headers.Accept = opts.headers.Accept || "", 
            opts.headers.Accept = "text/html," + opts.headers.Accept);
            const response = await fetch(resourceUrl, opts);
            return await caches.open(cacheName).then((function(cache) {
                cache.put(resourceUrl, response);
            }));
        }))), include) {
            const response = await fetch(source), extra = [];
            await Promise.all(include.map((async x => {
                const text = await (await fetch(x)).text();
                extra.push(`\n\n/*\n\n${x}\n\n*/ \n ${text}`);
            })));
            let modified = `/* ${source} */\n ${await response.text()}` + extra.join("");
            const _source = new Response(modified, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
            return await caches.open(cacheName).then((function(cache) {
                cache.put(route, _source);
            }));
        }
        if (source) {
            const _source = await fetch(source);
            return caches.open(cacheName).then((function(cache) {
                cache.put(route, _source);
            }));
        }
    } catch (e) {
        console.error("failed to register module"), console.log(module), console.log(e);
    }
}
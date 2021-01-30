(() => {
  const UIManagerRead = async (manager) => {
    async function populateCache() {
      let tree = {};
      const code = [];
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (var i = 0, len = keys.length; i < len; i++) {
        const request = keys[i];
        const split = request.url.split(/(\/bartok\/|\/shared\/)/);
        split.shift();
        const pathSplit = split
          .join("")
          .split("/")
          .filter((x) => !!x);
        let current = tree;
        for (var j = 0, jlen = pathSplit.length; j < jlen; j++) {
          const leafName = pathSplit[j];
          if (!leafName) {
            continue;
          }
          current[leafName] = current[leafName] || {};
          current = current[leafName];
        }

        let name = (pathSplit[pathSplit.length - 1] || "").replace("/", "");
        const _code = await (await cache.match(request)).text();
        code.push({
          name,
          code: _code,
          url: request.url,
        });
      }

      tree = { ...tree.bartok, ...tree };
      delete tree.bartok;

      const bartokCode = {
        id: manager.id,
        name: manager.name,
        tree: { [manager.name]: tree },
        code,
      };
      manager.cache = bartokCode;
    }

    function applyChangedToCache(changed, cache) {
      const overlayCode = JSON.parse(JSON.stringify(cache.code));
      //TODO: should handle tree but not right now...
      Object.entries(changed).forEach(([key, value]) => {
        const changeFilename = key.split("/").pop();
        const foundCachedFile = overlayCode.find(
          (x) => x.name === changeFilename
        );
        foundCachedFile && (foundCachedFile.code = value);
      });
      return { ...cache, code: overlayCode };
    }

    if (!manager.cache) await populateCache();

    let overlayedWithChanges;
    if (Object.keys(manager.changed).length) {
      overlayedWithChanges = applyChangedToCache(
        manager.changed,
        manager.cache
      );
    }

    return JSON.stringify(
      {
        result: [overlayedWithChanges || manager.cache],
      },
      null,
      2
    );
  };

  const UIManagerUpdate = async (manager, { service }) => {
    // update caches with changed files
    const cache = await caches.open(cacheName);
    const changesAsArray = Object.entries(manager.changed);
    for (var i = 0, len = changesAsArray.length; i < len; i++) {
      const [key, value] = changesAsArray[i];
      const fileName = key.split("/").pop();
      const managerCachedFile = manager.cache.code.find(
        (x) => x.name === fileName
      );
      const { url } = managerCachedFile;
      const { contentType } = getMime(url) || {};
      const headers = { "content-type": contentType || "" };
      const response = new Response(value, { headers });

      await cache.put(url, response);
      managerCachedFile.code = value;
    }

    // read service.manifest.json
    //const manifest = manager.cache.code.find(x => x.name === 'service.manifest.json');
    //console.log({ manifest });

    console.warn("TODO: save files to backend (if provider is available?)");
    // TODO: tell UI to refresh?

    manager.changed = {};
    await manager.changeStore.setItem("UIManagerChanged", manager.changed);

    return JSON.stringify(
      {
        result: [service],
      },
      null,
      2
    );
  };

  const UIManagerChange = async (manager, { path, code }) => {
    manager.changed[path] = code;

    console.warn(`changed a file at: ${path}`);

    await manager.changeStore.setItem("UIManagerChanged", manager.changed);

    return JSON.stringify({
      result: { path, code },
    });
  };

  const UIManagerInit = async (manager, { handlerStore, changeStore }) => {
    manager.changeStore = changeStore;
    manager.changed = (await changeStore.getItem("UIManagerChanged")) || {};

    const route = `^/${manager.name}/(.*)`;
    const handler = "./modules/serviceRequestHandler.js";

    // this is the service worker's handlers
    let foundHandler;
    let currentTry = 0;
    const giveUp = 5;
    const timeBetweenTries = 3000;
    while (!foundHandler && currentTry < giveUp) {
      foundHandler = handlers.find((x) => x.handlerName === handler);
      if (!foundHandler) {
        currentTry++;
        await new Promise((r) => setTimeout(r, timeBetweenTries));
      }
    }
    if (!foundHandler)
      return console.error(
        "could not find a handler to base UIManager handler on!"
      );

    const foundExactHandler =
      foundHandler &&
      handlers.find(
        (x) => x.handlerName === handler && x.routePattern === route
      );
    if (foundExactHandler) return;
    handlers.push({
      type: foundHandler.type,
      routePattern: route,
      route: new RegExp(route),
      handler: foundHandler.handler,
      handlerName: handler,
      handlerText: foundHandler.handlerText,
    });
    await handlerStore.setItem(route, {
      type,
      route,
      handlerName: handler,
      handlerText: foundHandler.handlerText,
    });
  };

  const UIManagerAddChanged = (manager) => {};

  class UIManager {
    id = 0;
    name;
    changeStore = undefined;
    cache = undefined;
    changed = undefined;

    constructor(name) {
      this.name = name;
    }
    init = (handlerStore, changeStore) =>
      UIManagerInit(this, { handlerStore, changeStore });
    read = () => UIManagerRead(this);
    update = (args) => UIManagerUpdate(this, args);
    change = (args) => UIManagerChange(this, args);
  }

  module.exports = {
    UIManager,
    UIManagerAddChanged,
  };
})();

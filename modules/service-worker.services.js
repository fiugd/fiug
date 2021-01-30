(() => {
  const handleServiceCreate = ({ app, storage, providers }) => async (
    params,
    event
  ) => {
    // event.request.arrayBuffer()
    // event.request.blob()
    // event.request.json()
    // event.request.text()
    // event.request.formData()
    const { id } = params;

    if (id === "provider") {
      return await providers.createServiceHandler(event);
    }
    const { name } = (await event.request.json()) || {};

    if (!id) {
      return JSON.stringify(
        { params, event, error: "id required for service create!" },
        null,
        2
      );
    }
    if (!name) {
      return JSON.stringify(
        { params, event, error: "name required for service create!" },
        null,
        2
      );
    }
    console.log("/service/create/:id? triggered");
    //return JSON.stringify({ params, event }, null, 2);

    // create the service in store
    await storage.stores.services.setItem(id + "", {
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
    stoarge.stores.files.setItem(`./${name}/package.json`, {
      main: "package.json",
      comment: "this is an example package.json",
    });
    storage.stores.files.setItem(
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

    return JSON.stringify(
      {
        result: {
          services: [services.filter((x) => Number(x.id) === 777)],
        },
      },
      null,
      2
    );
  };

  const handleServiceChange = ({ stores, ui, utils }) => async (
    params,
    event
  ) => {
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

      await stores.files.setItem(path, code);

      if (command === "upsert") {
        const serviceToUpdate = await stores.services.iterate((value, key) => {
          if (value.name === service) return value;
          return;
        });
        serviceToUpdate.tree = utils.treeInsertFile(path, serviceToUpdate.tree);
        await stores.services.setItem(serviceToUpdate.id + "", serviceToUpdate);
      }

      const metaData = () => ""; //TODO
      return JSON.stringify(
        {
          result: {
            path,
            code: fileData ? metaData(fileData) : code,
          },
        },
        null,
        2
      );
    } catch (error) {
      return JSON.stringify({ error }, null, 2);
    }
  };

  const handleServiceUpdate = ({ storage, providers, ui, utils }) => async (
    params,
    event
  ) => {
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
        (await storage.stores.services.getItem(id + "")) || {};

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
      await storage.stores.services.setItem(id + "", service);

      const storageFiles = await storage.getCodeFromStorageUsingTree(
        body.tree,
        storage.stores.files,
        service.name
      );
      const updateAsStore = utils.getCodeAsStorage(
        body.tree,
        body.code,
        service.name
      );

      const allServiceFiles = [];
      await storage.stores.files.iterate((value, key) => {
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

      // TOFO: binary files
      console.warn(`may need to update binary files!`);
      console.log(binaryFiles.map((x) => x.key));

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

        await storage.stores.files.setItem(
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
        await storage.stores.files.removeItem(key);
        await providers.fileChange({
          path: key,
          parent: service,
          deleteFile: true,
        });
      }

      return JSON.stringify(
        {
          result: [body],
        },
        null,
        2
      );
    } catch (e) {
      console.error(e);
      return JSON.stringify({ error: e }, null, 2);
    }
  };

  const handleServiceDelete = () => (params, event) => {
    console.log("/service/delete/:id? triggered");
    return JSON.stringify({ params, event }, null, 2);
  };

  class ServicesManager {
    constructor({ app, storage, providers, ui, utils }) {
      this.app = app;
      this.storage = storage;
      this.providers = providers;
      this.ui = ui;
      this.utils = utils;

      this.stores = storage.stores;

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

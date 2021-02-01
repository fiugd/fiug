(() => {
	//https://docs.github.com/en/rest

	const baseUrl = "https://api.github.com";
	const urls = {
		rateLimit: baseUrl + '/rate_limit',
		latestCommit: baseUrl + '/repos/{owner}/{repo}/branches/{branch}',
		getTreeRecursive: baseUrl + '/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=true',
		rawBlob: 'https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{blob.path}'
	};

	const stringify = o => JSON.stringify(o,null,2);
	const fetchJSON = (url, opts) => fetch(url, opts).then(x => x.json());

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const debug = () => { debugger; };
	const NOT_IMPLEMENTED_RESPONSE = () => {
		return debug() || stringify({ message: 'not implemented' })
	};

	const githubRequestHandler = (githubProvider) => async (which, handlerArgs) => {
		try {
			const { params, event } = handlerArgs;
			const req = event.request.clone();
			const payload = await req.json();
			const { providerType } = payload;
			const isSupported = providerType && providerType === "github-provider";
			if(!isSupported) return;
			const githubHandler = githubProvider[which];
			return githubHandler && await githubHandler(payload, params);
		} catch(e) {}
		return;
	};

	const githubTest = (githubProvider) => async (payload, params) => {
		try {
			const { storage } = githubProvider;
			const { providerAccessToken: auth, providerRepository: repo } = payload;

			const opts = { headers: {} };
			if(auth) opts.headers.authorization = `token ${auth}`;
			opts.headers.Accept = "application/vnd.github.v3+json";

			const result = await fetchJSON(urls.rateLimit, opts);
			let { limit, remaining, reset } = result?.resources?.core;
			reset = new Date(reset*1000).toLocaleString('sv').split(' ').reverse().join(' ');

			console.log(stringify({ limit, remaining, reset }));

			return stringify({ success: true, ...{limit, remaining, reset} });
		} catch(error){
			return stringify({ error });
		}
	};

	const githubCreate = (githubProvider) => async (payload, params) => {
		try {
			const { storage } = githubProvider;
			const { providerAccessToken: auth } = payload;
			const providersStore = storage.stores.providers;

			console.log({ payload, params });

			// check if provider exists

			// if exists then update
			// don't overwrite access_token if not present in payload ???

			// if not exists then create
			// save access_token
			// save type = github
			// other properties?

			return NOT_IMPLEMENTED_RESPONSE();
		} catch(error){
			console.error(error)
			return stringify({ error });
		}
	};

	const githubRead = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubUpdate = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubDelete = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();

	const githubServiceCreate = (githubProvider) => async (payload, params) => {
		try {
			const { storage: { stores }, fetchContents, app } = githubProvider;
			// in the future, should not use auth from this call (should exist on provider)
			const { providerAccessToken: auth, providerRepository: repo } = payload;
			const providersStore = stores.providers;
			const servicesStore = stores.services;
			const filesStore = stores.files;

			console.log({ payload, params });

			// TODO: check if provider exists, reject if not (create it, no?)

			const opts = { headers: {} };
			if(auth) opts.headers.authorization = `token ${auth}`;
			opts.headers.Accept = "application/vnd.github.v3+json";

			// pull tree (includes files info) from github
			const latestCommitUrl = urls.latestCommit
				.replace('{owner}/{repo}', repo)
				.replace('{branch}', 'main');
			const { commit: { sha } } = await fetchJSON(latestCommitUrl, opts);
			const getTreeUrl = urls.getTreeRecursive
				.replace('{owner}/{repo}', repo)
				.replace('{tree_sha}', sha);
			const { tree, truncated } = await fetchJSON(getTreeUrl, opts);
			if(truncated) console.warn('github repo tree truncated - try without recursive flag')

			//const ghTreeItems = tree.filter(x => x.type === 'tree');
			const ghFileItems = tree.filter(x => x.type === 'blob');

			// pull files from github
			/*
			// does raw github access (not api) go against quota
			// if so, warn the user that we can't do it without access token ??
			// also, may be better to use API in the future
			const result = await fetchJSON(urls.rateLimit, opts);
			let { remaining, reset, limit } = result?.resources?.core;
			reset = new Date(reset*1000).toLocaleString('sv').split(' ').reverse().join(' ');

			if(remaining < ghFileItems.length) {
				const files = ghFileItems.length;
				return stringify({
					files, remaining, reset, limit,
					error: 'file sync exceeds rate limit'
				});
			}
			*/
			const getOneFile = async (ghFile) => {
				const getBlobUrl = (blob) => urls.rawBlob
					.replace('{owner}/{repo}', repo)
					.replace('{branch}', 'main')
					.replace('{blob.path}', blob.path);
				const contents = await fetchContents(getBlobUrl(ghFile));
				return { ...ghFile, contents };
			};
			for(let i=0, len = ghFileItems.length; i<len; i++){
				const { contents } = await getOneFile(ghFileItems[i]);
				await filesStore.setItem(`${repo}/${ghFileItems[i].path}`, contents);
				//await sleep(50);
			}

			// check if service exists
			let foundService = {};
			const keys = [];
			await servicesStore.iterate((value, key) => {
				keys.push(key);
				if(value.name === repo) foundService = { key, ...value };
			});
			const newId = Math.max(...keys) + 1;

			const githubToServiceTree = (githubTreeItems) => {
				const tree = { [repo]: {} };
				const root = tree[repo];
				githubTreeItems.forEach(item => {
					item.path.split('/').reduce((all, one) => {
						all[one] = all[one] || {};
						return all[one];
					}, root);
				});
				return tree;
			};

			const saveService = async (githubTree) => {
				const id = foundService.id || newId;
				const type = 'github';
				const name = repo;
				const tree = githubToServiceTree(githubTree);
				const thisService = { id, type, name, tree };

				// create or update service
				await servicesStore.setItem(id+'', thisService);
				return { id, thisService };
			}
			const { id, thisService } = await saveService(tree);
	
			// may be issues with merging, but overwrite for now
			// create files that do not exist
			// overwrite files that already exist
			// delete files that exist but not in github

			//console.log({ ghTreeItems, ghFileItems });

			await app.addServiceHandler({
				name: repo,
				msg: "service added from github provider",
			});
			return stringify({ result: { services: [thisService] } });
		} catch(error){
			console.error(error)
			return stringify({ error });
		}
	}

	const githubServiceRead = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubServiceUpdate = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubServiceDelete = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();

	const githubFileCreate = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileRead = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileUpdate = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileDelete = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();

	class GithubProvider {
		constructor ({ storage, fetchContents, app }) {
			return new Promise((resolve, reject) => {
				try {
					this.handler = githubRequestHandler(this);

					this.storage = storage;
					this.fetchContents = fetchContents;
					this.app = app;

					// the provider  user entered info <-> fiug providersStore
					// store details about how each service connects to github
					this.test = githubTest(this);
					this.create = githubCreate(this);
					this.read = githubRead(this);
					this.update = githubDelete(this);
					this.delete = githubDelete(this);

					// child of the provider  gh repository <-> fiug servicesStore
					// get repo from github, store tree in servicesStore
					// modify service tree, sync github
					this.servicesCreate = githubServiceCreate(this);
					this.servicesRead = githubServiceRead(this);
					this.servicesUpdate = githubServiceUpdate(this);
					this.servicesDelete = githubServiceDelete(this);

					// files from repository  gh repo files <-> fiug filesStore
					// change a files contents, sync to github
					this.filesCreate = githubServiceCreate(this);
					this.filesRead = githubServiceRead(this);
					this.filesUpdate = githubServiceUpdate(this);
					this.filesDelete = githubServiceDelete(this);

					resolve(this);
				} catch(error) {
					reject(error);
				}
			});
		}
	}

	module.exports = { GithubProvider };
})();
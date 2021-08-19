(() => {
	//https://docs.github.com/en/rest

	const baseUrl = "https://api.github.com";
	const urls = {
		rateLimit: '/rate_limit',
		latestCommit: '/repos/{owner}/{repo}/branches/{branch}',
		tree: '/repos/{owner}/{repo}/git/trees',
		getTreeRecursive: '/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=true',
		rawBlob: 'https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{blob.path}',

		//commit
		branch: '/repos/{owner}/{repo}/branches/{branch}',
		treeRecurse: '/repos/{owner}/{repo}/git/trees/{sha}?recursive=true',
		commit: '/repos/{owner}/{repo}/git/commits/{sha}',
		createCommit: '/repos/{owner}/{repo}/git/commits',
		blobCreate: '/repos/{owner}/{repo}/git/blobs',
		refs: '/repos/{owner}/{repo}/git/refs/heads/{branch}'
	};
	Object.entries(urls).forEach(([k,v]) => {
		if(v[0] !== '/') return
		urls[k] = baseUrl + urls[k];
	});

	const stringify = o => JSON.stringify(o,null,2);
	const fetchJSON = (url, opts) => fetch(url, opts).then(x => x.json());
	const fill = (url, obj) => Object.keys(obj).reduce((all,one) => all.replace(`{${one}}`, obj[one]),	url);

	//const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const debug = () => {
		console.warn('Someone wants to be debugging...')
		//debugger;
	};
	const NOT_IMPLEMENTED_RESPONSE = () => {
		return debug() || stringify({ message: 'not implemented' })
	};

	const githubRequestHandler = (githubProvider) => async (which, handlerArgs) => {
		try {
			const { params, event, service, parent } = handlerArgs;
			const req = event && event?.request?.clone();
			const payload = req && await req?.json();
			const { providerType } = (payload || {});

			if(which === 'createCommit'){
				return await githubProvider.createCommit(payload, params);
			}
			
			const isSupported = providerType
				? providerType === "github-provider"
				: (service||parent)?.type === 'github';

			if(!isSupported) return;

			const githubHandler = githubProvider[which];
			if(!githubHandler) return;

			const notANetReqHandler = ['filesUpdate'].includes(which);

			return notANetReqHandler
				? await githubHandler(handlerArgs)
				: await githubHandler(payload, params);
		} catch(e) {}
		return;
	};

	const githubTest = (githubProvider) => async (payload, params) => {
		try {
			const { storage } = githubProvider;
			const { auth, repo, branch } = payload;

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
			const { auth, repo, branch } = payload;
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
			const { auth, repo, branch } = payload;
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
				.replace('{branch}', branch);
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
					.replace('{branch}', branch)
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
			const newId = keys.length
				? Math.max(...keys) + 1
				: 3000; // this sucks

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
				const thisService = {
					id, type, name, tree,
					owner: repo.split('/').slice(0,1).join(''),
					repo: repo.split('/').pop(),
					branch
				};

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
	const githubServiceUpdate = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE(); // this should not return a network response
	const githubServiceDelete = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();

	const githubFileCreate = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileRead = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileUpdate = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileDelete = (githubProvider) => async (payload, params) => NOT_IMPLEMENTED_RESPONSE();

	/*
		files: { path, content, operation }[], operation is one of [create, update, delete]
		git: { owner, repo, branch }
		auth: github authorization token,
		message: commit message
	*/
	async function commit({ files, git, auth, message }){
		//TODO: message can be formatted in Title Description format by including \n\n between the two

		if(!auth) return { error: 'auth is required' };
		if(!message) return { error: 'message is required' };
		if(!git.owner) return { error: 'repository owner is required' };
		if(!git.branch) return { error: 'repository branch name is required' };
		if(!git.repo) return { error: 'repository name is required' };
		if(!files || !Array.isArray(files) || !files.length) return { error: 'no files were changed'};

		let blobs = [];

		const opts = {
			headers: {
				authorization: `token ${auth}`,
				Accept: "application/vnd.github.v3+json"
			}
		};
		const ghFetch = async (templateUrl, params={}, extraOpts={}) => {
			const filledUrl = fill(templateUrl, { ...git, ...params });
			return await fetchJSON(filledUrl, {...opts, ...extraOpts });
		};
		const ghPost = async (url, params, body) => await ghFetch(url, params, {
			method: 'POST',
			body: JSON.stringify(body)
		});
		const safeBase64 = (content) => {
			try {
				return { content: btoa(content), encoding: 'base64' }
			} catch(e) {
				return { content, encoding: "utf-8" }
			}
		};
		const fileToTree = ({ path }, index) => ({
			path, mode: '100644', type: 'blob',	sha: blobs[index].sha
		});
		const treeToTree = ({ path, mode, type, sha }) => ({ path, mode, type, sha });
		const blobCreate = ({ content }) => ghPost(urls.blobCreate, null, safeBase64(content));
		const createNewTree = (fwodel, fullt, fileps, delfileps) => {
			return [
				...fwodel.map(fileToTree),
				...fullt.tree
					.filter(x =>
						x.type !== 'tree' &&
						!fileps.includes(x.path) &&
						!delfileps.includes(x.path)
					)
					.map(treeToTree)
			];
		};

		const filesWithoutDeleted = files.filter(x => !x.deleteFile);
		const deletedFilePaths = files.filter(x => x.deleteFile).map(x => x.path);
		const filePaths = filesWithoutDeleted.map(x => x.path);

		blobs = await Promise.all(filesWithoutDeleted.map(blobCreate));
		const latest = await ghFetch(urls.branch);
		const fullTree = await ghFetch(urls.treeRecurse, { sha: latest?.commit?.sha });
		const createdTree = await ghPost(urls.tree, null, {
			tree: createNewTree(filesWithoutDeleted, fullTree, filePaths, deletedFilePaths)
		});
		const newCommit = await ghPost(urls.createCommit, null, {
			message, tree: createdTree.sha, parents: [ latest.commit.sha ]
		});
		const updateRefs = await ghPost(urls.refs, null, { sha: newCommit.sha });
		return (updateRefs?.object?.url || 'no commit url available')
			.replace('https://api.github.com/repos', 'https://github.com')
			.replace('git/commits','commit');
	}

	/*
	in the future:
		this will not automatically push commit to github, but instead create a commit to be pushed later
		auth will come from a seperate login command, not manually passed
		cwd will not be supported and instead some other method used to get current service, etc (maybe)
	*/
	const githubCreateCommit = (githubProvider) => async (payload, params) => {
		try {
			const { message, auth, cwd } = payload;

			if(!message) return stringify({ error: 'commit message is required' });
			if(!auth) return stringify({ error: 'auth token is required for commit' });
			if(!cwd) return stringify({ error: 'current working directory (cwd) is required for commit' });

			const { storage: { stores }, utils } = githubProvider;
			const servicesStore = stores.services;
			const changesStore = stores.changes;
			const filesStore = stores.files;
			const { flattenObject } = utils;
			
			let service;
			await servicesStore.iterate((value, key) => {
				const { tree, name } = value;
				if(cwd === `${name}/`){
					service = value;
					return true;
				}
				const flattened = flattenObject(tree);
				if(flattened.includes(cwd)){
					service = value;
					return true;
				}
			});
			if(service?.type !== 'github') return;
			if(!service || !service.name || !service.branch || !service.repo){
				throw new Error('missing or malformed service');
			}
			const svcRegExp = new RegExp('^' + service.name + '/', 'g')
			const { owner, repo, branch } = service;
			const git = { owner, repo, branch };

			const files = [];
			const changes = [];
			const changesKeys = await changesStore.keys();
			for(let i=0, len=changesKeys.length; i<len; i++){
				const key = changesKeys[i];
				if(!svcRegExp.test(key)) continue;

				const change = await changesStore.getItem(key);
				if(!change?.service) continue;
				const {
					type: operation,
					value: content,
					service: { name: parent },
					deleteFile
				} = change;

				if(!parent) continue;
				if(parent !== service.name) continue;
				const path = key.replace(svcRegExp, '');

				files.push({ path, content, operation, deleteFile });
				changes.push({ ...change, key });
			}

			const commitResponse = await commit({ auth, files, git, message })
			if(!commitResponse) return stringify({ error: 'commit failed' })

			for(let i=0, len=files.length; i<len; i++){
				const change = changes[i];
				if(change.deleteFile){
					await filesStore.removeItem(change.key);
				} else {
					await filesStore.setItem(change.key, change.value);
				}
				await changesStore.removeItem(change.key);
			}
			return stringify({ commitResponse });
		} catch(e){
			debugger;
			return;
		}
	}

	class GithubProvider {
		constructor ({ storage, fetchContents, app, utils }) {
			return new Promise((resolve, reject) => {
				try {
					this.handler = githubRequestHandler(this);

					this.storage = storage;
					this.fetchContents = fetchContents;
					this.app = app;
					this.utils = utils;

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

					this.createCommit = githubCreateCommit(this);

					resolve(this);
				} catch(error) {
					reject(error);
				}
			});
		}
	}

	module.exports = { GithubProvider };
})();

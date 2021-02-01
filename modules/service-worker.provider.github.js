(() => {
	//https://docs.github.com/en/rest

	const baseUrl = "https://api.github.com/";
	const urls = {
		rateLimit: baseUrl + 'rate_limit'
	};

	const stringify = o => JSON.stringify(o,null,2);
	const fetchJSON = (url, opts) => fetch(urls.rateLimit, opts).then(x => x.json());
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

	const githubTest = (githubProvider) => async (payload) => {
		try {
			const { storage } = githubProvider;
			const { providerAccessToken: auth, repo } = payload;

			const opts = { headers: {} };
			if(auth) opts.headers.authorization = `token ${auth}`;

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
			console.log({ payload, params });
			const providersStore = githubProvider.storage.stores.providers;

			// check if provider exists

			// if exists then update

			// if not exists then create

			return NOT_IMPLEMENTED_RESPONSE();
		} catch(error){
			console.error(error)
			return stringify({ error });
		}
	};

	const githubRead = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubUpdate = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubDelete = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();

	const githubServiceCreate = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubServiceRead = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubServiceUpdate = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubServiceDelete = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();

	const githubFileCreate = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileRead = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileUpdate = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();
	const githubFileDelete = (githubProvider) => async (payload) => NOT_IMPLEMENTED_RESPONSE();

	class GithubProvider {
		constructor ({ storage }) {
			return new Promise((resolve, reject) => {
				try {
					this.handler = githubRequestHandler(this);

					//nope, this belongs in provider instances
					//this.key = key;

					this.storage = storage;

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
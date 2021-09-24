export const GithubMock = () => {
	let calls = [];

	const reset = () => {
		calls = [];
	};

	const responses = [{
		match: x => /\/repos\/.*\/.*\/git\/blobs/.test(x),
		response: () => {
			return { sha: 'fake-blob-sha' }
		}
	}, {
		match: x => /\/repos\/.*\/.*\/branches\/.*/.test(x),
		response: () => {
			return {
				commit: { sha: 'fake-latest-sha'}
			}
		}
	}, {
		match: x => /\/repos\/.*\/.*\/git\/trees\/.*\?recursive\=true/.test(x),
		response: () => {
			return { tree: [] }
		}
	}, {
		match: x => /\/repos\/.*\/.*\/git\/commits/.test(x),
		response: () => {
			return { sha: 'fake-newcommit-sha' }
		}
	},{
		match: x => /\/repos\/.*\/.*\/git\/refs\/heads\/.*/.test(x),
		response: () => {
			return { object: { url: 'https://fake.commit.url'} }
		}
	}];

	const Response = (key) => {
		const found = responses.find(x => x.match(key));
		if(found) return found.response;
		return () => ({});
	}

	const fetchJSON = (url, params) => {
		calls.push({ url, params });
		//console.log(url);
		//console.log(JSON.stringify(params, null, 2));
		return Response(url)(params);
	};

	return { fetchJSON, reset };
};

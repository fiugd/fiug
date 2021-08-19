//show-preview

/*
https://gist.github.com/StephanHoyer/91d8175507fcae8fb31a
https://gist.github.com/harlantwood/2935203
https://mdswanson.com/blog/2011/07/23/digging-around-the-github-api-take-2.html

https://github.com/crosshj/fiug-welcome/commits/WIP-testing-github-commiting
*/


import { consoleHelper, delay, importCSS, logJSON, fetchJSON, stringify, getStored, htmlToElement } from '../.tools/misc.mjs';
import '../shared.styl';
consoleHelper();

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
	const fill = (url, obj) =>
		Object.keys(obj).reduce((all,one) =>
			all.replace(`{${one}}`, obj[one]),
		url);
	const baseUrl = "https://api.github.com";
	const urls = {
		rateLimit: '/rate_limit',
		branch: '/repos/{owner}/{repo}/branches/{branch}',
		tree: '/repos/{owner}/{repo}/git/trees',
		treeRecurse: '/repos/{owner}/{repo}/git/trees/{sha}?recursive=true',
		commit: '/repos/{owner}/{repo}/git/commits/{sha}',
		createCommit: '/repos/{owner}/{repo}/git/commits',
		blobCreate: '/repos/{owner}/{repo}/git/blobs',
		blobRaw: 'https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{blobPath}',
		refs: '/repos/{owner}/{repo}/git/refs/heads/{branch}'
	};
	Object.entries(urls).forEach(([k,v]) => {
		if(v[0] !== '/') return
		urls[k] = baseUrl + urls[k];
	});
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
	const createNewTree = (fwodel, fullt, fileps, delfileps) => ([
		...fwodel.map(fileToTree),
		...fullt.tree
			.filter(x =>
				x.type !== 'tree' &&
				!fileps.includes(x.path) &&
				!delfileps.includes(x.path)
			)
			.map(treeToTree)
	]);

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
	logJSON(updateRefs)
	return (updateRefs?.object?.url || 'no commit url available')
		.replace('https://api.github.com/repos', 'https://github.com')
		.replace('git/commits','commit');
}

(async () => {
	const auth = getStored('Github Personal Access Token');

	const FakeFile = ([name, content]) => ({
		path: `commitTest/file-${name.toUpperCase()}.md`,
		content: new Array(2).fill().map(x => '### ' + content.toUpperCase()).join('   \n')
	});

	const filesToDelete = [{
		path: 'commitTest/file-CANDY.md',
		deleteFile: true
	},{
		path: 'commitTest/file-DANCE.md',
		deleteFile: true
	},{
		path: 'commitTest/file-CARROT.md',
		deleteFile: true
	},{
		path: 'commitTest/file-DISHEVELED.md',
		deleteFile: true
	}];
	const files = [
		...`trouble force | cobra yahtzee | plaster baster | tantamount eggs`
				.split('|')
				.map(x => FakeFile(x.trim().split(' '))),
		...filesToDelete
	];
	logJSON(files);


	const git = {
		owner: 'crosshj',
		repo: 'fiug-welcome',
		branch: 'WIP-testing-github-commiting' || 'main',
	};
	const message = `wip: ${new Date().toLocaleString('ja')}\n\n- testing delete\n- refactoring`

	await delay(15000);

	const result = await commit({ auth, files, git, message });
	if(!result) return console.error('no result!')
	if(result.error) return console.error(result.error)
	document.body.append(htmlToElement(`
		<div>
			<span>result:</span>
			<a href="${result}">
				<button style="background: #99e;">${result.split('/').pop().slice(0,7)}</button>
			</a>
		</div>
	`));
})();
// https://octokit.github.io/rest.js/v18

import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

(async () => {
	await appendUrls([
		'../shared.styl'
	]);
	await prism('javascript', '', 'prism-preload');
	const log = async (o) => await prism("json", JSON.stringify(o, null, 2));

	const owner = 'crosshj';
	const repo = 'fiug';
	const tree_sha = 'e002fde335352b29e28ac8b2d844cf814e59b1e8'
	
	const auth = 'cc7a547c1204d41d3f728d114fa0dd74dc5002bf';
	const oct = new Octokit({ auth });

	await log(Object.keys(oct.repos))


	const { data: repos } = await oct.repos.listForAuthenticatedUser();
	await log({ repos: repos.filter(x => !x.fork) });

	const { data: gists } = await oct.gists.list();
	await log({ gists });

	const { data: rateLimit } = await oct.rateLimit.get();
	await log({ rateLimit });

	const { data: repoContent } = await oct.repos.getContent({ owner, repo });
	await log({ repoContent });

	const treeReq = args => oct.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', args);
	const { data: welcomeTree } = await treeReq({ owner, repo, tree_sha });
	await log({ welcomeTree });

})()
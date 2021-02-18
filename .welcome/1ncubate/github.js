//show-preview
import { appendUrls, consoleHelper, htmlToElement, importCSS, prism } from '../.tools/misc.mjs';
import 	'../shared.styl';

consoleHelper();


//show-preview

// https://octokit.github.io/rest.js/v18


/*

1) main app stands up a worker for github octokit

2) when that worker is available, it messages the service worker

2.1) (what if the service worker is unavailable at that time ?)

2.2) before this, calls service worker to do business with github are not ready and told to wait

3) after this, calls to service worker which require github get passed to worker

4) worker performs those calls and sends results to service worker

5) service worker receives results, stores, etc, then sends relevant result to client


what kinds of "calls to do business" would this include:
- test a github provider with
- list repos for user
- sync with github
-  etc 

what kinds of "calls to do business" would this exclude
- get repo/files that have already been synced to file/service stores
- anything else?

pros:
- can write es6!
- multi-threading
- seperation of concerns
- might be a similar pattern needed with WASM if that is for sure in future for core of this app
- might simplify the role of service-worker code

cons:
- complexity, extra confusing code (see below and github-worker.js) and syncing the load of all this code
- part of what I wanted service worker for is "in app" though it is technically not, instead in a worker
- would not be needed if I could just write/use ES6 in service workers

alternatives:
- precompile github octokit code
- compile octokit on the fly
- could call github API directly vs using octokit <<< BEST!!! (see fetch below)
	- https://docs.github.com/en/rest

*/


//import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const sessionPrompt = (varName) => {
	const stored = sessionStorage.getItem(varName);
	if(stored) return stored;
	const prompted = prompt(varName);
	sessionStorage.setItem(varName, prompted);
	return prompted;
}

(async () => {
	const log = (o) => prism("json", JSON.stringify(o, null, 2));

	const GithubWorker = new Proxy({
		worker: new Worker('github-worker.mjs', { type: 'module' }),
		__calls: []
	}, {
		apply(target, thisArg, args) {
			console.log(target, thisArg, args);
			return args;
		},
		get(target, name, receiver){
			if(name !== 'exec'){
				target.__calls.push(name);
				return receiver;
			}
			return (...args) => new Promise(resolve => {
				const listener = target.worker.addEventListener('message', e => {
					target.worker.removeEventListener('message', listener);
					resolve(e.data); 
				});
				target.worker.postMessage({
					calls: target.__calls, args
				});
				target.__calls = [];
			});
		}
	});

	const owner = 'crosshj';
	const repo = 'fiug';
	const tree_sha = 'e002fde335352b29e28ac8b2d844cf814e59b1e8'
	const auth = sessionPrompt('Github Personal Access Token');
	
	//https://docs.github.com/en/rest
	const result = await( await fetch("https://api.github.com/rate_limit", {
		headers: {
			authorization: `token ${auth}`,
		}
	})).json();
	log({ rateLimit: result })

	await GithubWorker.init.exec({ auth }); // do this better (class)

	const { data: gists } = await GithubWorker.gists.list.exec();
	//log({ gists });

	const { data: repos } = await GithubWorker.repos.listForAuthenticatedUser.exec();
	//log({ repos: repos.filter(x => !x.fork) }); 
	
	const { data: rateLimit } = await GithubWorker.rateLimit.get.exec();
	//log({ rateLimit });
	
	const { data: repoContent } = await  GithubWorker.repos.getContent.exec({ owner, repo });
	log({ repoContent });

	const treeReq = args =>  GithubWorker.request.exec('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', args);
	const { data: welcomeTree } = await treeReq({ owner, repo, tree_sha });
	log({ welcomeTree });

	/*
	const oct = new Octokit({ auth });
	await log(Object.keys(oct.repos))
	*/

})()
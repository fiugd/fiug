import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

let o;

addEventListener('message', async e => {
	const { calls, args } = e.data;
	if(calls[0] === 'init'){
		o = new Octokit(...args);
		postMessage(undefined);
		return;
	}
	
	const functionToCall = calls.reduce((all, one) => all[one], o);
	const result = await functionToCall(...args)
	postMessage(result);
});
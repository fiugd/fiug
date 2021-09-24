// node test/service-worker.root.js

const rootUrl = "https://beta.fiug.dev/service/read/0";

const rootResponse = await fetch(rootUrl, {
	headers: {
		accept: "application/json",
		"content-type": "application/json",
	},
	body: null,
	method: "GET",
}).then(x => x.json());

console.log(rootResponse);

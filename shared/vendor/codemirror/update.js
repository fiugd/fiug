const semVer = `([0-9]+(\.[0-9]+)+)`;
const iso8601Date = `[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?`;
const semVerDateRegex = new RegExp(`v${semVer}\$`);

const getCacheName = async () => {
	const allCaches = await caches.keys();
	const allVersioned = allCaches
		.filter(x => semVerDateRegex.exec(x))
	return allVersioned.sort().reverse()[0];
};

const cacheName = await getCacheName();
const root = `https://beta.fiug.dev`;
const cache = await caches.open(cacheName);


const updates = [[
	`/crosshj/fiug-beta/shared/vendor/codemirror/addon.bundle.js`,
	`/shared/vendor/codemirror/addon.bundle.js`
],[
	`/crosshj/fiug-beta/shared/vendor/codemirror/mode.bundle.js`,
	`/shared/vendor/codemirror/mode.bundle.js`
],[
	`/crosshj/fiug-beta/shared/modules/utilities.mjs`,
	`/shared/modules/utilities.mjs`
],[
	`/crosshj/fiug-beta/shared/modules/editor.mjs`,
	`/shared/modules/editor.mjs`
],[
	`/crosshj/fiug-beta/shared/images/faviconBeta.svg`,
	`/shared/images/faviconBeta.svg`
],[
	`/crosshj/fiug-beta/shared/icons/seti/ext.json.mjs`,
	`/shared/icons/seti/ext.json.mjs`
],[
	`/crosshj/fiug-beta/modules/Editor.mjs`,
	`/_/modules/Editor.mjs`
],[
	`/crosshj/fiug-beta/modules/TreeView.mjs`,
	`/_/modules/TreeView.mjs`
],[
	`/crosshj/fiug-beta/modules/editorEvents.mjs`,
	`/_/modules/editorEvents.mjs`
],[
	`/crosshj/fiug-beta/modules/treeEvents.mjs`,
	`/_/modules/treeEvents.mjs`
],[
	`/crosshj/fiug-beta/modules/statusBarEvents.mjs`,
	`/_/modules/statusBarEvents.mjs`
],[
	`/crosshj/fiug-beta/modules/editorTabsEvents.mjs`,
	`/_/modules/editorTabsEvents.mjs`
],[
	`/crosshj/fiug-beta/modules/operationsEvents.mjs`,
	`/_/modules/operationsEvents.mjs`
],[
	`/crosshj/fiug-beta/modules/statusBarEvents.mjs`,
	`/_/modules/statusBarEvents.mjs`
],[
	`/crosshj/fiug-beta/modules/state.mjs`,
	`/_/modules/state.mjs`
],

//terminal
[
	`/crosshj/fiug-beta/modules/Terminal.mjs`,
	`/_/modules/Terminal.mjs`
],[
	`/crosshj/fiug-beta/terminal/terminal.html`,
	`/_/modules/terminal/index.html`
],[
	`/crosshj/fiug-beta/terminal/terminal.js`,
	`/_/modules/terminal/terminal.js`
],[
	`/crosshj/fiug-beta/terminal/terminal.ops.js`,
	`/_/modules/terminal/terminal.ops.js`
],[
	`/crosshj/fiug-beta/terminal/terminal.history.js`,
	`/_/modules/terminal/terminal.history.js`
],[
	`/crosshj/fiug-beta/terminal/terminal.git.js`,
	`/_/modules/terminal/terminal.git.js`
],[
	`/crosshj/fiug-beta/terminal/terminal.css`,
	`/_/modules/terminal/terminal.css`
],[
	`/crosshj/fiug-beta/terminal/terminal.lib.js`,
	`/_/modules/terminal/terminal.lib.js`
],[
	`/crosshj/fiug-beta/terminal/terminal.utils.js`,
	`/_/modules/terminal/terminal.utils.js`
]];

const updateCache = async (source, target) => {
	const bundleText = await fetch(root+source).then(x => x.text());
	let contentType = 'application/javascript; charset=utf-8';
	if(target.endsWith('.svg')) contentType = 'image/svg+xml';
	if(target.endsWith('.html')) contentType = 'text/html';
	const opts = {
		headers: {
			'Content-Type': contentType
		}
	};
	await cache.put(root+target, new Response(bundleText, opts));
};

for(var i=0, len=updates.length; i<len; i++){
	await updateCache(...updates[i]);
}

console.log(`\nupdated cache [${cacheName}]:\n\n${updates.map(([,x]) => x).join('\n')}`);


const importMap = {
	"imports": {
		"chalk": "https://cdn.skypack.dev/chalk",
		//"chalk": "https://cdn.skypack.dev/-/chalk@v2.4.2-3J9R9FJJA7NuvPxkCfFq/dist=es2020,mode=imports/optimized/chalk.js",
		//"chalk/": "https://cdn.skypack.dev/-/chalk/",
	}
};
const importMapResponse = new Response(
	JSON.stringify(importMap, null, 2),
	{
		headers: {
			'Content-Type': 'application/importmap+json; charset=utf-8'
		}
	}
);
await cache.put(root+'/importmap.importmap', importMapResponse);
console.log(`also added /importmap.importmap`);

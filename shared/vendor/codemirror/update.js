const cacheName = `v0.4.9`;
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
	`/crosshj/fiug-beta/modules/Editor.mjs`,
	`/_/modules/Editor.mjs`
],[
	`/crosshj/fiug-beta/modules/editorEvents.mjs`,
	`/_/modules/editorEvents.mjs`
],[
	`/crosshj/fiug-beta/modules/treeEvents.mjs`,
	`/_/modules/treeEvents.mjs`
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
],[
	`/crosshj/fiug-beta/terminal/terminal.ops.js`,
	`/_/modules/terminal/terminal.ops.js`
],[
	`/crosshj/fiug-beta/terminal/terminal.lib.js`,
	`/_/modules/terminal/terminal.lib.js`
]];

const updateCache = async (source, target) => {
	const bundleText = await fetch(root+source).then(x => x.text());
	const opts = {
		headers: {
			'Content-Type': 'application/javascript; charset=utf-8'
		}
	};
	await cache.put(root+target, new Response(bundleText, opts));
};

for(var i=0, len=updates.length; i<len; i++){
	await updateCache(...updates[i]);
}

console.log(`\nupdated: \n${updates.map(([,x]) => x).join('\n')}`);

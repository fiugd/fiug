import 'https://unpkg.com/rollup/dist/rollup.browser.js';
import 'https://cdn.jsdelivr.net/npm/source-map@0.7.3/dist/source-map.js';
import 'https://cdn.jsdelivr.net/npm/terser/dist/bundle.min.js';

import rollupConfig from 'https://beta.fiug.dev/crosshj/fiug-beta/service-worker/build/rollup.config.js';
import terserConfig from 'https://beta.fiug.dev/crosshj/fiug-beta/service-worker/build/terser.config.js';
import packageJson from "https://beta.fiug.dev/crosshj/fiug-beta/package.json" assert { type: "json" };

const VERSION = `v${packageJson.version}`;
const DATE = new Date().toISOString();
const AddVersion = (code) => code.replace(/{{VERSION}}/g, VERSION);
const AddDate = (code) => code.replace(/{{DATE}}/g, DATE);

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const Minify = (code) => Terser.minify(code, terserConfig());

async function saveBuild({ code, map }){
	const changeUrl = 'https://beta.fiug.dev/service/change';
	const body = {
		path: `./${rollupConfig.output.file}`,
		service: 'crosshj/fiug-beta',
		//command: 'upsert',
		code: code
	};
	const headers = {
		"accept": "application/json",
		"content-type": "application/json",
	};
	const opts = { 
			method: 'POST',
			headers,
			body: JSON.stringify(body),
			mode: "cors",
			credentials: "omit"
	};
	//console.log(JSON.stringify(opts, null, 2))

	try {
		return await fetch(changeUrl, opts).then(x => x.json());
	} catch(error) {
		return { error }; 
	}

	return { error: 'error saving build' };
}

console.log(`Bundling service-worker with Rollup version ${rollup.VERSION}...`);

const generated = await rollup.rollup(rollupConfig)
	.then(x => x.generate(rollupConfig.output));
const { code } = generated.output[0];


const minified = await pipe(AddDate,AddVersion,Minify)(code);
const {error} = await saveBuild(minified);
console.log(error || `DONE\nsee ` +
`https://beta.fiug.dev/${rollupConfig.output.file}`
);

/*
NOTES from initial go at this:

would like to bundle the service worker into one file and not have to use bastardized module.exports/require

*** rollup:
http://rollupjs.org/repl/
https://github.com/rollup/rollup/blob/master/docs/999-big-list-of-options.md
https://github.com/rollup/rollup/blob/master/docs/05-plugin-development.md
https://rollupjs.org/guide/en/#outputformat
https://rollupjs.org/guide/en/#rolluprollup

parcel:
https://parcel-repl.vercel.app/
from https://github.com/parcel-bundler/parcel/issues/1253

other:
https://skalman.github.io/UglifyJS-online/
https://try.terser.org/
*/

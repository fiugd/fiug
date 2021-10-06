export const importmap = () => {
	return `
{
	imports: {
		chalk: "https://cdn.skypack.dev/chalk",
		lodash: 'https://cdn.skypack.dev/lodash',
		rollup: 'https://unpkg.com/rollup/dist/rollup.browser.js',
		rollupPluginSourceMap: 'https://cdn.jsdelivr.net/npm/source-map@0.7.3/dist/source-map.js',
		terser: 'https://cdn.jsdelivr.net/npm/terser/dist/bundle.min.js',
	}
}
`.trim()+ '\n';
}

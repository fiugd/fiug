/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 |
 | For up-to-date information about the options:
 |   http://www.browsersync.io/docs/options/
 */

const path = require("path");
const packageJson = require(path.resolve(process.cwd(), "package.json"));

module.exports = {
	port: 3322,
	ui: {
		port: 3323,
	},
	server: {
		directory: false,
	},
	files: ["index.*", "modules/**/*", "../shared/**/*"],
	ignore: ["./__services/**/*", "./server/**/*"],
	injectChanges: false,
	notify: false,
	middleware: [
		function (req, res, next) {
			// if (req.url === "/") {
			// 	res.writeHead(302, { Location: `/` });
			// 	res.end();
			// 	return;
			// }
			next();
		},
	],
	snippetOptions: {
		ignorePaths: ["index.bootstrap.html"],
		rule: {
			match: /<\/body>/i,
			fn: function (snippet, match) {
				const customSnippet = `<script async src='/browser-sync/browser-sync-client.js?v=2.26.7'><\/script>\n`;
				return customSnippet + match;
			},
		},
	},
};

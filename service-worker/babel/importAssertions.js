import { declare } from "https://cdn.skypack.dev/-/@babel/helper-plugin-utils@v7.14.5-BndCG7BrChRfEI6G53g6/dist=es2020,mode=imports/optimized/@babel/helper-plugin-utils.js";
//import { declare } from "@babel/helper-plugin-utils";

export default declare(api => {
	api.assertVersion(7);

	return {
		name: "syntax-import-assertions",

		manipulateOptions(opts, parserOpts) {
			parserOpts.plugins.push(["importAssertions"]);
		},
	};
});

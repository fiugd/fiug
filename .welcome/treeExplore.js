//show-preview
import { consoleHelper, importCSS } from './.tools/misc.mjs';
import './shared.styl';
consoleHelper();

const flattenTree = (tree) => {
	const results = [];
	const recurse = (branch, parent = "/") => {
		const leaves = Object.keys(branch);
		leaves.map((key) => {
			const children = Object.keys(branch[key]);
			if (!children || !children.length) {
				results.push({
					name: key,
					code: parent + key,
					path: parent + key,
				});
			} else {
				if (!branch[key]) {
					debugger;
				}
				recurse(branch[key], `${parent}${key}/`);
			}
		});
	};
	recurse(tree);
	return results;
};

const parent =  {
	"name": ".test",
	"id": 1,
	"providerRoot": "C:/repos/fiug-beta/.welcome/.test",
	"providerUrl": "http://localhost:3333/",
	"tree": {
		".test": {
			"jerp.js": {},
			"pace": {
				"bap.mpg": {},
				"trost.ec2": {}
			},
			"tape.jpg": {},
			"test.txt": {},
			"ger": {
				".keep": {},
				"dang.jpg": {}
			},
			"bape": {}
		}
	},
	"code": [
		{
			"name": "jerp.js",
			"code": "↵↵",
			"path": "/.test/jerp.js"
		},
		{
			"name": "bap.mpg",
			"code": "/.test/pace/bap.mpg",
			"path": "/.test/pace/bap.mpg"
		},
		{
			"name": "trost.ec2",
			"code": "/.test/pace/trost.ec2",
			"path": "/.test/pace/trost.ec2"
		},
		{
			"name": "tape.jpg",
			"code": "/.test/tape.jpg",
			"path": "/.test/tape.jpg"
		},
		{
			"name": "test.txt",
			"code": "/.test/test.txt",
			"path": "/.test/test.txt"
		},
		{
			"name": ".keep",
			"code": "/.test/ger/.keep",
			"path": "/.test/ger/.keep"
		},
		{
			"name": "dang.jpg",
			"code": "/.test/ger/dang.jpg",
			"path": "/.test/ger/dang.jpg"
		}
	]
}

const keepHelper = (tree, code) => {
	const treeFlat = flattenTree(tree).map(x => x.path.replace('/.keep', ''));
	const treeFiles = code.map(x => x.path).filter(x => !x.includes('/.keep'));
	const addKeepFiles = treeFlat.reduce((all, one, i, array) => {
		const found = array.filter((x) => x !== one && x.startsWith(one));
		if(found.length === 0 && !treeFiles.includes(one)) all.push(one);
		return all;
	}, []);
	return treeFlat.map(x => addKeepFiles.includes(x) ? x + '/.keep' : x)
}

console.log('this is an exercise in creating .keep files for empty dirs');
console.info(JSON.stringify(
	keepHelper(parent.tree, parent.code),
	null, 2
))

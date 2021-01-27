const { resolve } = require('path');
const { readdir } = require('fs').promises;

// REFACTOR: this is redundant - add to manager.js
function handler(handlerfns, name){
	return async (req, res) => {
		let result;
		try {
			result = await handlerfns[name](req.params, req.body);
		}catch(e){
			console.log(e)
			process.stdout.write(name + ' - ');
		}
		res.json({ message: name, result });
	}
}

var cors = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
};

const clone = x => {
	try { return JSON.parse(JSON.stringify(x)); }
	catch(e) {}
};

async function getTreeFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(dirents.map((dirent) => {
	  const filePath = resolve(dir, dirent.name);
	  return dirent.isDirectory()
		  ? getTreeFiles(filePath)
		  : { dir, file: dirent.name, filePath };
	}));
	return Array.prototype.concat(...files);
}

module.exports = {
	handler, cors, clone, getTreeFiles
};

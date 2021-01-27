const fs = require('fs');
const {
	clone, getTreeFiles
} = require('../utilities');

// NOTE: for now, code is a bundle of tree + files
const getFiles = (name, _code = {}) => {
	if (_code.code && _code.tree) {
		return {
			code: _code.code,
			tree: _code.tree
		};
	}
	let _tree = {
		[name]: {
			"index.js": {},
			"package.json": {}
		}
	};
	let _files = [{
		name: "index.js",
		code: _code
	}, {
		name: "package.json",
		code: JSON.stringify({ name }, null, 2)
	}];
	try {
		const { tree, files } = JSON.parse(_code);
		_tree = tree;
		_files = files;
	}
	catch (e) {
		//console.log('error parsing file bundle from service code');
		//console.log(e);
	}
	return {
		code: _files,
		tree: _tree
	};
};

const mapServiceToUI = x => {
	const { id: _id, name } = x;
	let tree, code;
	if (x.code && x.tree) {
		({ tree, code } = x);
	} else {
		({ tree, code } = getFiles(name, x.code));
	}
	const mappedService = {
		id: _id,
		tree,
		code,
		name
	};
	return mappedService;
};

const hydrateFileService = async (service) => {
	const { name, tree, code } = clone(service);
	const svcDefFileName = '.service.json';
	let serviceJSON;

	const serviceFiles = await (async () => {
		try {
			serviceJSON = JSON.parse(code.find(x => x.name === svcDefFileName).code);
			return await getTreeFiles(serviceJSON.path);
		} catch(e){}
	})();
	if(!serviceFiles || !serviceFiles.length){
		return service;
	}
	serviceFiles.forEach(x => {
		let { file, dir, filePath } = x;
		const codeFile = code.find(c => c.name === file);
		const codeContents = fs.readFileSync(filePath, 'utf8');

		dir = (((
			dir || '')
			.split(serviceJSON.path)[1] || '')
			.split('\\') || [])
			.filter(d=>!!d);
		let thisPath = tree[name];
		for(var i=0, len=dir.length; i<len; i++){
			thisPath[dir[i]] = thisPath[dir[i]] || {};
			thisPath = thisPath[dir[i]];
		}
		thisPath[x.file] = {};

		codeFilePath = [serviceJSON.path, ...dir, file].join('/');
		if(codeFile){
			//codeFile.code = codeContents;
			codeFile.code = file !== 'package.json' ? '' : codeContents;
			codeFile.path = codeFilePath;
		} else {
			code.push({
				name: file,
				path: codeFilePath
			});
		}
	});
	// serviceJSON file should be updated with tree so UI can use it offline
	const svcDefFile = code.find(x => x.name === 'service.json');
	svcDefFile.code = JSON.stringify({
		...serviceJSON,
		tree: tree[name],
		files: code
	}, null, 2);
	return { name, tree, code };
};

const readServices = async ({ manager, args }) => {
	// filter on id if passed
	if (args[0].id) {
		const foundService = manager.services
			.find(x => Number(x.id) === Number(args[0].id));
		if(!foundService){
			console.log('could not find the service');
			return [];
		}
		const mappedService = mapServiceToUI(foundService);
		//console.log({ mappedService })
		const hydratedService = await hydrateFileService(mappedService);
		//console.log({ hydratedService })
		return [ hydratedService ];
	}
	return manager.services
		.map(x => {
			const { id: _id, name } = x;
			return {
				id: _id,
				name
			};
		});
};
exports.readServices = readServices;

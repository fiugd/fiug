const { initService } = require("./instanceInit");

const updateService = async ({ manager, args }) => {
	const { id, code, name } = args[1];
	const service = manager.services.find(x => x.id === Number(id));
	// console.log(JSON.stringify({ service }, null, 2 ));
	// console.log({ args });
	service.name = name || service.name;
	service.code = code || service.code;
	service.instance.kill(); // maybe better to send a kill message and confirm death
	const updatedService = initService(service);
	const { id: _id, code: _code, name: _name, tree: _tree } = updatedService;

	// console.log({
	// 	_tree, _code
	// })
	return [{
		id: _id,
		code: _code,
		name: _name,
		tree: _tree
	}];
};

exports.updateService = updateService;

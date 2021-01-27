const { instanceKill } = require("./instanceKill");

const deleteService = async ({ manager, args }) => {
	const { id } = args[1];
	const service = manager.services.find(x => Number(x.id) === Number(id));
	//console.log({service});

	await new Promise((resolve, reject) => {
		instanceKill([service], () => {
			console.log(`service ${service.id} ${service.name}: instance stopped for delete`)
			resolve();
		});
	})
	//service.instance && service.instance.kill(); // maybe better to send a kill message and confirm death

	manager.services = manager.services.filter(x => x.id !== Number(id));
	return manager.services;
};
exports.deleteService = deleteService;

const persistServices = async ({ db, manager }) => {
	const dbServices = await db.read();
	for (var i = 0, len = manager.services.length; i < len; i++) {
		const service = manager.services[i];
		if (!dbServices.find(d => Number(d.id) === Number(service.id))) {
			await db.create(service);
		}
		else {
			if(service.tree){
				const backupCode = JSON.parse(JSON.stringify(service.code));
				service.code = JSON.stringify({
					code: service.code,
					tree: service.tree
				});
				await service.save();
				service.code = backupCode;
			} else {
				await service.save();
			}
		}
	}
	for (var i = 0, len = dbServices.length; i < len; i++) {
		const dbService = dbServices[i];
		if (!manager.services.find(m => Number(m.id) === Number(dbService.id))) {
			await dbService.destroy();
		}
	}
	return manager.services.map(x => {
		const { id: _id, name } = x;
		return { id: _id, name };
	});
};

module.exports = {
	persistServices
};

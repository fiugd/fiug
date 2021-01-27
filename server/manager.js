const { persistServices } = require("./manager/persist");

const { instanceKill } = require("./manager/instanceKill");

const { createServices } = require("./manager/serviceCreate");
const { readServices } = require("./manager/serviceRead");
const { updateService } = require("./manager/serviceUpdate");
const { deleteService } = require("./manager/serviceDelete");

const { initService } = require("./manager/instanceInit");

/*

communicate between children without going through parent:
https://stackoverflow.com/a/47501318

*/

const initManager = async ({ db }) => {
	const manager = {
		services: await db.read()
	};

	//console.log(manager.services.filter(x => x.name === 'bartokv0.2').map(x => x.toJSON()));
	manager.services = manager.services.map(initService);

	let killing = false;
	function exitHandler(options, exitCode) {
		console.log({exitCode})
		if(killing){
			return;
		}
		killing = true;
		instanceKill(manager.services, () => {
			console.log('All instances cleaned up.')
			//if (options.cleanup) console.log('clean');
			//if (exitCode || exitCode === 0) console.log(exitCode);
			if (options.exit) process.exit(exitCode);
		});
	}

	//do something when app is closing
	process.on('exit', exitHandler.bind(null, { cleanup: true }));

	//catches ctrl+c event
	process.on('SIGINT', exitHandler.bind(null, { exit: true }));

	// catches "kill pid" (for example: nodemon restart)
	process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
	process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

	//catches uncaught exceptions
	process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

	return manager;
};

// REFACTOR: this is redundant
function handle({ name, db, manager }) {
	return async function () {
		const args = arguments;
		if(name === 'create'){
			return await createServices({ db, manager, args });
		}
		if(name === 'read'){
			return await readServices({ manager, args });
		}
		if(name === 'update'){
			return await updateService({ manager, args });
		}
		if(name === 'delete'){
			return await deleteService({ manager, args });
		}
		if(name === 'persist'){
			return await persistServices({ db, manager, args });
		}
		process.stdout.write(name + ' -');
		return args;
	}
}

// REFACTOR: this is redundant
const initHandlers = ({ db, manager }) => ({
	create: handle({ name: 'create', db, manager }),
	read: handle({ name: 'read', db, manager }),
	update: handle({ name: 'update', db, manager }),
	delete: handle({ name: 'delete', db, manager }),
	manage: handle({ name: 'manage', db, manager }),
	monitor: handle({ name: 'monitor', db, manager }),
	persist: handle({ name: 'persist', db, manager })
});

async function init({ db }) {
	const manager = await initManager({ db });
	return initHandlers({ db, manager })
}

module.exports = { init, handle };
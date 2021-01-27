/*

TODO: if service is set to auto-persist, save to DB as well

*/

const { initService } = require("./instanceInit");

const createServices = async ({ db, manager, args }) => {
	const { id, name } = args[1];
	const service = db.Service.build({
		id: Number(id),
		name,
		code: JSON.stringify({
			code: [{
				name: "index.js",
				code: `
const serviceName = '${name}';
const send = (message) => {
	if (process.send) {
		process.send(\`\${serviceName}: \${message}\`);
	} else {
		console.log(message);
	}
};

process.on('message', parentMsg => {
	const _message = parentMsg + ' PONG.';
	send(_message);
});
`
			},{
				name: "package.json",
				code: JSON.stringify({
					name,
					description: "",
					template: "",
					port: ""
				}, null, 2)
			}],
			tree: {
				[name]: {
					"index.js": {},
					"package.json": {}
				}
			}
		})
	});
	// console.log({ service });
	// console.log({ args });
	const newService = initService(service);
	manager.services.push(newService);
	const { id: _id, code: _code, name: _name, tree: _tree } = newService;
	return [{
		id: _id,
		code: _code,
		name: _name,
		tree: _tree
	}];
};

exports.createServices = createServices;

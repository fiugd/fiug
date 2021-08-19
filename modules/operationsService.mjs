function getReadAfter(List, inlineEditor, getCodeFromService) {
	return ({ result = {} } = {}) => {
		// I think this console.log was here because I was trying to move away from using this
		// it's a callback pattern and I would prefer not to use it
		//  but I wanted to make sure it was safe to go away, dunno...
		//console.warn('Read After');
	};
}

function getUpdateAfter(setCurrentService) {
	return ({ result={} }) => {
		//TODO: why is this even needed?
		//console.warn('Update After');
		const services = result?.result;
		if(!services || !services.length){
			return console.error('updateAfter: error setting current service');
		}
		setCurrentService(services[0], null, 'set');
	};
}

function getOperations(updateAfter, readAfter) {
	const operations = [{
		name: '', url: '', config: {}
	}, {
		name: 'create',
		url: 'service/create/{id}',
		config: {
			method: 'POST'
		},
		eventToParams: ({ body = {} }) => {
			const { id } = body;
			if (!id) throw new Error('id is required when creating service');
			return { id };
		},
		eventToBody: ({ body = {} }) => {
			const { name, id } = body;
			if (!name) throw new Error('name is required when creating service');
			if (!id) throw new Error('id is required when creating service');
			return JSON.stringify({ name, id }, null, 2);
		},
		after: updateAfter
	}, {
		name: 'read',
		url: 'service/read/{id}',
		after: readAfter,
		eventToParams: ({ body = {} }) => {
			const { id='' } = body;
			return { id };
		}
	}, {
		name: 'update',
		url: 'service/update/{id}',
		config: {
			method: 'POST'
		},
		after: updateAfter,
		eventToParams: ({ body = {} }) => {
			const { id='' } = body;
			return { id };
		},
		eventToBody: ({ body = {} }) => {
			const { name, id } = body;
			if (!name) throw new Error('name is required when updating service');
			if (!id && typeof id !== "number") throw new Error('id is required when updating service');
			return JSON.stringify(body, null, 2);
		},
	}, {
		name: 'change',
		url: 'service/change',
		config: {
			method: 'POST'
		},
		eventToBody: ({ path, code, service } = {}) => {
			if (!path) throw new Error('path is required when changing service files');
			return JSON.stringify({ path, code: code || '', service }, null, 2);
		},
	}, {
		name: 'delete',
		url: 'service/delete/{id}',
		config: {
			method: 'POST'
		},
		eventToParams: ({ body = {} }) => {
			const { id='' } = body;
			return { id };
		}
	}, {
		name: 'manage',
		url: 'manage'
	}, {
		name: 'monitor',
		url: 'monitor'
	}, {
		name: 'persist',
		url: 'persist'
	}, {
		name: 'provider-test',
		url: 'service/provider/test',
		config: {
			method: 'POST'
		},
		eventToBody: (eventData) => {
			return JSON.stringify(eventData, null, 2);
		}
	}, {
		name: 'provider-save',
		url: 'service/provider/create',
		config: {
			method: 'POST'
		},
		eventToBody: (eventData) => {
			return JSON.stringify(eventData, null, 2);
		}
	}, {
		name: 'provider-add-service',
		url: 'service/create/provider',
		config: {
			method: 'POST'
		},
		eventToBody: (eventData) => {
			return JSON.stringify(eventData, null, 2);
		}
	}];
	operations.forEach(x => {
		//x.url = `./${x.url}`;
		// if (x.config && x.config.body) {
		// 	x.config.body = JSON.stringify(x.config.body);
		// }
		x.config = x.config || {};
		x.config.headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});
	return operations;
}


async function performOperation(operation, eventData = {}) {

	const { body = {}, after } = eventData;
	if (operation.name !== "read") {
		try{
			body.id = body.id === 0
				? body.id
				: body.id || (currentService || {}).id;
		} catch(e){}
	}
	let { id } = body;

	const op = JSON.parse(JSON.stringify(operation));
	op.after = operation.after;

	if(after && op.name !== "read"){
		op.after = (...args) => {
			after(...args);
			op.after(...args);
		};
	} else {
		op.after = after || op.after;
	}

	if(id === "*"){
		id = '';
	}
	if(id !== '' && Number(id) === 0){
		id = "0";
	}
	// op.config = op.config || {};
	// op.config.headers = {
	// 	...{
	// 		'Accept': 'application/json',
	// 		'Content-Type': 'application/json'
	// 	}, ...((op.config || {}).headers || {})
	// };
	// if (op.config.method !== "POST") {
	// 	delete op.config.body;
	// }

	op.url = op.url.replace('bartok/', '');

	//, externalStateRequest
	//const result = await externalStateRequest(op);
	if(operation.eventToBody){
		op.config.body = operation.eventToBody(eventData);
	}
	if(operation.eventToParams){
		const params = operation.eventToParams(eventData);
		Object.keys(params).forEach(key => {
			op.url = op.url.replace(
				`{${key}}`,
				!!params[key] || params[key] === 0 || params[key] === "0"
					? params[key]
					: ''
			);
		});
	}

	const response = await fetch(op.url, op.config);
	const result = await response.json();

	if (op.after) {
		op.after({ result });
	}
	const currentServiceId = localStorage.getItem('lastService');
	if(operation.name === "read" && id && id !== "*" && Number(id) !== Number(currentServiceId)){
		localStorage.setItem('lastService', id);
		sessionStorage.removeItem('tree');
		sessionStorage.removeItem('editorFile');
		sessionStorage.removeItem('tabs');
		sessionStorage.removeItem('statusbar');
	}

	return {
		detail: {
			op: operation.name,
			id,
			result: result
				? result.result || result
				: {},
			listener: eventData.listener
		}
	};
}

const operationsListener = async (
	e, {
		operations, managementOp, performOperation, externalStateRequest,
		getCurrentFile, getCurrentService, resetState
	}) => {
	if(e.detail.body.id === "undefined"){
		e.detail.body.id = undefined;
	}
	if(e.detail.body.name === "undefined"){
		e.detail.body.name = undefined;
	}

	const currentFile = getCurrentFile();
	const currentService = getCurrentService();


	// console.log(e.detail);
	const manageOp = managementOp(e, currentService, currentFile);
	let eventOp = (manageOp || {}).operation || e.detail.operation;
	if (eventOp === 'cancel') {
		const foundOp = operations.find(x => x.name === 'read');
		performOperation(foundOp, { body: { id: '' } }, externalStateRequest);
		return;
	}
	// this updates project with current editor window's code
	if (eventOp === 'update') {
		// console.log(JSON.stringify({ currentService}, null, 2));
		const files = JSON.parse(JSON.stringify(currentService.code));

		// NEXT: this is not needed because getCurrentService has sideffects of
		// adding  current changes to service (safe to assume???)

		// (files.find(x => x.name === currentFile) || {})
		// 	.code = e.detail.body.code;

		e.detail.body.code = JSON.stringify({
			tree: currentService.tree,
			files
		});
	}
	if (eventOp === 'updateProject') {
		// console.log(JSON.stringify({ currentService}, null, 2));
		const files = JSON.parse(JSON.stringify(currentService.code));
		e.detail.body.code = JSON.stringify({
			tree: currentService.tree,
			files
		});
		e.detail.body.id = currentService.id;
		e.detail.body.name = currentService.name;
		eventOp = "update";
	}
	const foundOp = operations.find(x => x.name === eventOp);
	if (!foundOp) {
		console.error('Could not find operation!');
		console.error({ eventOp, manageOp });
		e.detail.done && e.detail.done('ERROR\n');
		return;
	}
	foundOp.config = foundOp.config || {};
	//foundOp.config.body = foundOp.config.body ? JSON.parse(foundOp.config.body) : undefined;
	if (foundOp.name !== "read") {
		e.detail.body.id = e.detail.body.id === 0
			? e.detail.body.id
			: e.detail.body.id || (currentService || {}).id;
	}
	try{
		e.detail.body.id = e.detail.body.id || currentService.id;
		e.detail.body.name = e.detail.body.name || currentService.name;
	} catch(e){}
	if(foundOp.name === "create"){
		e.detail.body.code="";
	}
	foundOp.config.body = JSON.stringify(e.detail.body);

	const opsWhichResetState = ["read"];
	if (
		e.type === "operations" &&  opsWhichResetState.includes(e.detail.operation) && e.detail.body.id !== "*"
	) {
		//console.log("id: " + e.detail.body.id);
		resetState();
	}
	await performOperation(foundOp, e.detail, externalStateRequest);
	e.detail.done && e.detail.done('DONE\n');
};

export {
	getOperations, getReadAfter, getUpdateAfter, performOperation, operationsListener
};
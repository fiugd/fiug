export const ServiceMock = ({ utils }) => {
	const deps = {
		app: {},
		storage: {
			stores: {
				services: {},
				files: {},
				changes: {},
			}
		},
		providers: {},
		templates: {},
		ui: {
			id: 999,
			update: () => {}
		},
		utils,
	};
	const calls = [];
	const params = {
		id: 3002
	};
	let body = {};
	const setBody = (b) => { body = b; };
	const getBody =() => body;
	const event = {
		request: {
			json: getBody
		}
	};
	let serviceFiles = {
		'./fake/source/.keep': 'should be removed',
		'./fake/source/toMove.xxx': 'file to move from source',
		'./fake/source/toRename.xxx': 'file to rename in source',
		'./fake/source/toDelete.xxx': 'file to delete from source',
		'./fake/source/toCopy.xxx': "a file to copy from source",
		'./fake/target/sibling.xxx': "a sibling file",
	};
	const allServices = {
		"3002": {
			id: 3002,
			name: 'fake',
			type: 'github',
			repo: 'fake',
			tree: {
				fake: {
					target: {
						'sibling.xxx': {}
					},
					source: {
						".keep": {},
						"toMove.xxx": {},
						"toRename.xxx": {},
						"toDelete.xxx": {},
						"toCopy.xxx": {},
					},
				}
			}
		}
	};
	const setService = (id, transform) => allServices[id.toString()] = transform(allServices[id.toString()]);
	const setFiles = (transform) => transform(serviceFiles);

	const changes = {
		'tree-fake-expanded': [ 'expanded/1', 'expanded/2' ],
		'state-fake-opened': [{ name: 'opened.js', order: 0 }]
	};
	deps.providers.fileChange = async (args) => {
		const { path:originalPath, parent, code, deleteFile } = args;
		const path = originalPath.slice(2);
		changes[path] = {
			value: code, deleteFile, service: parent
		}; 
		calls.push({
			providerFileChange: { ...changes[path], path },
		});
	};
	deps.storage.stores.services.getItem = async (key) => {
		const value = allServices[key] || null;
		calls.push({
			servicesGet: { key, value }
		});
		return value; 
	};
	deps.storage.stores.services.setItem = async (key, value) => {
		allServices[key] = value;
		calls.push({
			serviceSet: { key, value }
		});
	};
	deps.storage.stores.files.keys = async () => {
		const keys = Object.keys(serviceFiles);
		calls.push({
			filesKeys: { keys }
		});
		return keys;
	};
	deps.storage.stores.files.setItem = async (key, value) => {
		serviceFiles[key] = value;
		calls.push({
			fileSet: { key, value }
		});
	};
	deps.storage.stores.files.getItem = async (key) => {
		const value = serviceFiles[key] || null;
		calls.push({
			fileGet: { key, value }
		});
		return value;
	};
	deps.storage.stores.files.removeItem = async (key) => {
		const value = serviceFiles[key];
		delete serviceFiles[key];
		calls.push({
			fileRemove: { key, value }
		});
	};
	deps.storage.stores.changes.keys = async () => {
		const keys = Object.keys(changes);
		calls.push({
			changesKeys: { keys }
		});
		return keys;
	};
	deps.storage.stores.changes.getItem = async (key) => {
		const value = changes[key] || null;
		calls.push({
			changesGet: { key, value }
		});
		return value;
	};
	deps.storage.stores.changes.setItem = async (key, value) => {
		changes[key] = value;
		calls.push({
			changesSet: { key, value }
		});
	};
	deps.storage.stores.changes.removeItem = async (key) => {
		const value = changes[key];
		calls.push({
			changesRemove: { key, value }
		});
		delete changes[key];
	};

	return {
		setBody, setService, setFiles,
		deps, event, calls, params, changes,
		files: serviceFiles,
		services: allServices
	};
}
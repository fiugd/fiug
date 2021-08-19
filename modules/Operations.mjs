import { attachListeners } from "./operationsEvents.mjs";

import { managementOp } from "./operationsManagement.mjs";
import { externalStateRequest } from "./ExternalState.mjs";
import {
	setCurrentService,
	getCurrentFile,
	getCurrentService,
	getCurrentFolder,
	setCurrentFile,
	setCurrentFolder,
	getState,
	resetState,
} from "./state.mjs";

import {
	getOperations,
	getReadAfter,
	getUpdateAfter,
	performOperation,
	operationsListener,
} from "./operationsService.mjs";

async function Operations() {
	const { triggerOperationDone } = attachListeners({
		managementOp,
		externalStateRequest,
		getCurrentFile,
		getCurrentService,
		setCurrentService,
		getCurrentFolder,
		setCurrentFolder,
		getState,
		resetState,
		getOperations,
		getReadAfter,
		getUpdateAfter,
		performOperation,
		operationsListener,
	});

	const lastService = localStorage.getItem("lastService");
	if (!lastService && ![0, "0"].includes(lastService)) {
		const event = new CustomEvent("noServiceSelected", {
			bubbles: true,
			detail: {},
		});
		document.body.dispatchEvent(event);
		return;
	}

	// APPLICATION STATE BOOTSTRAP
	const operations = getOperations(
		() => {},
		// occurs after call to init?
		// TODO: would be nice to do away with this
		(...args) => {
			const service = args[0]?.result?.result[0];
			if(!service) return console.error('no service!')
			setCurrentService(service);

			const selected = service.treeState?.select;
			if(!selected) console.error('no tree state!');
			setCurrentFile({ filePath: selected || "" });

			const name = selected.includes('/')
				? selected.split('/').pop()
				: selected;
			const parent = selected.includes('/')
				? selected.replace(`/${name}`, '')
				: '';
			
			const event = new CustomEvent("fileSelect", {
				bubbles: true,
				detail: { name, parent },
			});
			document.body.dispatchEvent(event);
		}
	);

	//const operations = getOperations(()=>{}, ()=>{});

	// TODO: this should go away at some point!!!
	// request a list of services from server (and determine if server is accessible)
	const foundOp = operations.find((x) => x.name === "read");
	//console.log({ foundOp });
	//await performOperation(foundOp, { body: { id: '' } }, externalStateRequest);

	//console.log({ lastService });
	const eventData = { body: { id: lastService } };
	const result = await performOperation(
		foundOp,
		{ body: { id: lastService } },
		externalStateRequest
	);
	triggerOperationDone(result);
}

export default Operations;

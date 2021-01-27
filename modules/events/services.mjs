import { attach } from '../Listeners.mjs';

const hideServiceMapHandler = (hideServiceMap) => async (event) => {
	console.log('hide services');
	hideServiceMap();
};

const showServiceMapHandler = (showServiceMap) => async (event) => {
	console.log('show services');
	showServiceMap();
};

const operationDoneHandler = (receiveServices) => async (event) => {
	const { type, detail } = event;
	const { op, id } = detail;
	if(op === "read" && !id){
		const services = detail.result;
		receiveServices(services);
	}
};

function attachListener({
	showServiceMap,
	hideServiceMap,
	receiveServices
}){
	attach({
		name: 'Service Map',
		eventName: 'showServicesMap',
		listener: showServiceMapHandler(showServiceMap)
	});
	attach({
		name: 'Service Map',
		eventName: 'showSearch',
		listener: hideServiceMapHandler(hideServiceMap)
	});
	attach({
		name: 'Service Map',
		eventName: 'showServiceCode',
		listener: hideServiceMapHandler(hideServiceMap)
	});
	attach({
		name: 'Service Map',
		eventName: 'operationDone',
		listener: operationDoneHandler(receiveServices)
	});
}

export {
	attachListener
};

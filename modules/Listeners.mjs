const listeners = {};
const triggers = {};

function attach({
	name, listener, eventName, options
}){
	if(!name || !listener || !eventName){
		console.error('Attempt to improperly attach an event listener');
		console.error({ name, listener, eventName });
		return;
	}
	const listenerName = `${eventName}__${name}`;
	if(listeners[listenerName]){
		return;
	}
	window.addEventListener(eventName, listener, options);
	listeners[listenerName] = listener;
}

function remove({
	name, eventName, options
}){
	const listenerName = `${eventName}__${name}`;
	window.removeEventListener(eventName, listeners[listenerName], options);
	delete listeners[listenerName];
}

function list(){
	return Object.keys(listeners);
}


/*
future todo:

- when an event is triggered, don't create a custom event if event listeners exist already for that event
- instead, just trigger those

- there should be an uber listener instead of a bunch of click listeners added

*/

// this thing is used too many ways... SIGH
function trigger({ e, type, params, source, data, detail }){
	const _data = typeof data === "function"
		? data(e)
		: data || (detail||{}).data || {};
	//console.log(`triggering event: ${type}`);
	const defaultDetail = {
		..._data,
		...params,
		...{ source },
		data: _data
	};
	const event = new CustomEvent(type, {
		bubbles: true,
		detail: detail
			? { ...defaultDetail, ...detail, data: _data }
			: defaultDetail
	});
	window.dispatchEvent(event);
}

let triggerClickListener;
const attachTrigger = function attachTrigger({
	name, // the module that is attaching the listener
	type='click', // the input event name, eg. "click"
	data, // an object or function to get data to include with fired event
	eventName, // the name of the event(s) that triggers are attached for (can also be a function or an array)
	filter // a function that will filter out input events that are of no concern
}){
	if(type === 'raw'){
		const triggerName = `${eventName}__${name}`;
		const _trigger = (args) => trigger({
			...args,
			e: args,
			data,
			type: eventName,
			source: name
		});
		triggers[triggerName] = {
			eventName, type, trigger: _trigger
		};
		return _trigger;
	}

	if(type !== 'click') {
		console.error(`triggering based on ${type} not currently supported`);
		return;
	}

	const listener = triggerClickListener || ((event) => {
		const foundTrigger = Object.keys(triggers)
			.map(key => ({ key, ...triggers[key] }) )
			.find(t => {
				if(t.type === 'raw'){
					return false;
				}
				//this won't work if only one global listener
				//if(t.key !== triggerName) return false;
				const filterOkay = t.filter && typeof t.filter === "function" && t.filter(event);
				return filterOkay;
			});
		if(!foundTrigger) return true; //true so event will propagate, etc
		event.preventDefault();
		event.stopPropagation();

		const { eventName: type, data } = foundTrigger;
		const params = {};
		const source = {};
		const _data = typeof data === "function"
			? data(event)
			: data || {};
		trigger({ type, params, source, data: _data, detail: (_data||{}).detail });
		return false;
	});

	const options = {};
	if(!triggerClickListener){
		window.addEventListener(type, listener, options);
	}

	const triggerName = `${eventName}__${name}`;
	triggers[triggerName] = {
		eventName, filter, data, type
	};

	triggerClickListener = triggerClickListener || listener;
}

function removeTrigger({
	name, eventName
}){
	const triggerName = `${eventName}__${name}`;
	delete triggers[triggerName];
	// probably should never do this since something will always be listening for a click
	// (and clicks are all that is supported right now)
	// (and there is really only one click listener for triggers)
	//window.removeEventListener(eventName, listeners[listenerName], options);
}
function listTriggers(){
	return Object.keys(triggers);
}

window.listTriggers = listTriggers;
window.listListeners = list;

export {
	trigger, //deprecate exporting this?
	attach, remove, list,
	attachTrigger, removeTrigger, listTriggers
};

import { attachTrigger } from "./Listeners.mjs";

const triggers = {
	operations: attachTrigger({
		name: "Hot Keys",
		eventName: "operations",
		type: "raw",
	}),
	ui: attachTrigger({
		name: "Hot Keys",
		eventName: "ui",
		type: "raw",
	}),
};

// most or all of this function should go away!!!
function triggerEvent(type, name) {
	const done = () => {
		//console.log(`done: ${name}`);
		if (name === "update") {
			triggerEvent("operations", "persist");
		}
	};
	const body = {
		// name: (document.body.querySelector('#service_name')||{}).value,
		// id: (document.body.querySelector('#service_id')||{}).value,
		code: (window.Editor || { getValue: () => {} }).getValue(), //this should be got from current state
	};

	triggers[type]({
		detail: {
			operation: name,
			done,
			body,
		},
	});

	// const event = new CustomEvent(type, {
	// 	bubbles: true,
	// 	detail: {
	// 		operation: name,
	// 		done,
	// 		body
	// 	}
	// });
	// document.body.dispatchEvent(event);
}

// https://stackoverflow.com/questions/6333814/how-does-the-paste-image-from-clipboard-functionality-work-in-gmail-and-google-c

function HotKeys() {
	const useCapture = true;
	document.addEventListener(
		"keydown",
		function (event) {
			if (event.shiftKey && event.altKey && event.key === "ArrowLeft") {
				triggerEvent("ui", "prevDocument");
				event.preventDefault();
				return false;
			}
			if (event.shiftKey && event.altKey && event.key === "ArrowRight") {
				triggerEvent("ui", "nextDocument");
				event.preventDefault();
				return false;
			}

			if (
				(event.ctrlKey || event.metaKey) &&
				event.shiftKey &&
				event.key.toLowerCase() === "f"
			) {
				triggerEvent("ui", "searchProject");
				event.preventDefault();
				return false;
			}
			if (
				(event.ctrlKey || event.metaKey) &&
				event.shiftKey &&
				event.key.toLowerCase() === "p"
			) {
				triggerEvent("ui", "commandPalette");
				event.preventDefault();
				return false;
			}
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
				triggerEvent("ui", "searchPalette");
				event.preventDefault();
				return false;
			}
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
				triggerEvent("operations", "update");
				event.preventDefault();
				return false;
			}
			if (event.ctrlKey && event.which === 9) {
				// this will only work with electron
				triggerEvent("nextTab");
				event.preventDefault();
				return false;
			}
		},
		useCapture
	);
}

export default HotKeys;

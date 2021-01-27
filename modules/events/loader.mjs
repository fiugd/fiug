import { attach } from '../Listeners.mjs';

function attachListener({
	hideBar,
	showBar
}){
	attach({
		name: 'Indicators',
		eventName: 'operations',
		listener: showBar
	});
	attach({
		name: 'Indicators',
		eventName: 'operationDone',
		listener: hideBar
	});
	// maybe should be in another listener
	attach({
		name: 'Indicators',
		eventName: "message",
		listener: (event) => {
			const { data } = event;

			if(data === 'colorRequest'){
				const highlight = getComputedStyle(document.documentElement)
    				.getPropertyValue('--main-theme-highlight-color');
				event.source.postMessage({ colors: { highlight }}, event.origin);
				return;
			}

			if(data && data.colorChangeRequest
				&& data.colorChangeRequest.highlight
			){
				document.documentElement.style
					.setProperty(
						'--main-theme-highlight-color',
						data.colorChangeRequest.highlight
					);
				localStorage.setItem('themeHighlightColor', data.colorChangeRequest.highlight)
				return;
			}

		}
	});
}

export {
	attachListener
};

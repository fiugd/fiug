import { delay } from './misc.mjs'

const createIframe = (url) => {
	return new Promise((resolve, reject) => {
		const ifrmContainer = document.createElement('div');
		ifrmContainer.classList.add("loading");
		ifrmContainer.classList.add('iframe-container');

		const ifrm = document.createElement('iframe');
		const id = Math.random().toString().replace('.', '');
		ifrm.setAttribute('id', id);
		ifrm.setAttribute('src', url);
		ifrm.addEventListener("load", function(e){
			var that = this;
			try {
				if(!ifrm.contentDocument) throw new Error('iframe fail');
				//ack message the iframe before removing the loading
				//ifrmContainer.classList.remove('loading');
			} catch(err) {
				console.trace(err);
				ifrmContainer.classList.remove('loading');
				ifrmContainer.classList.add('error');
			}
		});
		ifrm.addEventListener("error", () => {
			console.log('error');
		});

		ifrmContainer.appendChild(ifrm)
		document.body.appendChild(ifrmContainer);
		resolve(ifrmContainer);
	});
};

const recieveMessage = (timeout=10000) => {
	return new Promise((resolve, reject) => {
		const listener = (event) => {
			window.removeEventListener("message", listener);
			resolve(event.data);
		};
		window.addEventListener("message", listener, false);
		setTimeout(() => {
			window.removeEventListener("message", listener);
			reject('receive message timed out');
		}, timeout);
	});
};

const createGraph = async (graphObject, baseUrl="..") => {
	const graph = await createIframe(baseUrl + '/.templates/d3-graph.html/::preview::/?message=true&chrome=false');
	graph.style.width = '100%'
	graph.style.height =  "32em";

	//console.error('TODO: graph resize/refresh and basic config options');
	try {
		let message = await recieveMessage();
		graph.querySelector('iframe').contentWindow.postMessage(graphObject, "*");
		(async()=>{
			await delay(500);
			graph.classList.remove('loading');
		})()
	} catch(e){
		message = e;
	}
	return graph;
}

export {
	createGraph
};

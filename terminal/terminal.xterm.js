import { WebLinksAddon } from 'https://cdn.skypack.dev/xterm-addon-web-links';

export default () => {
	const options = {
		theme: {
			background: "rgba(255, 255, 255, 0.0)", // '#1e1e1e',
			//fontFamily: 'consolas'
		},
		allowTransparency: true,
		fontSize: 13,
		//fontFamily: 'Ubuntu Mono, courier-new, courier, monospace',
		//fontWeight: 100,
		convertEol: true,
		//rendererType: 'dom',
	};
	const term = new Terminal(options);
	term.open(document.querySelector('#terminal .term-contain'));

	const fitAddon = new FitAddon.FitAddon();
	term.loadAddon(fitAddon);
	const fit = fitAddon.fit.bind(fitAddon);
	//term.onResize(fit);
	window.addEventListener("resize", fit);
	fit();

	/*
	const linkHandler = (e, uri) => alert(`Attempt to navigate to: ${uri}`)
	const linkMatcherOpts = {};
	//https://xtermjs.org/docs/api/terminal/interfaces/ilinkmatcheroptions/

	term.loadAddon(new WebLinksAddon(linkHandler, linkMatcherOpts));
	
	https://github.com/xtermjs/xterm.js/pull/538
	https://npmdoc.github.io/node-npmdoc-xterm/build/apidoc.html#apidoc.module.xterm.Linkifier
	https://github.com/xtermjs/xterm-addon-web-links

	https://github.com/xtermjs/xterm-addon-web-links/blob/master/src/WebLinksAddon.ts
	would love for links back to the main part of app:
		- git diff could use this, esp.
		- could be useful for ls command, etc

	import ansiEscapes from 'https://cdn.skypack.dev/ansi-escapes';
	ansiEscapes.link(text, url)
	- not sure xterm.js supports this yet, though

	*/
	term.loadAddon(new WebLinksAddon());

	term._attachHandlers = ({ bubbleHandler, keyHandler }) => {
		term.attachCustomKeyEventHandler(bubbleHandler);
		term.onKey(keyHandler);
	};

	return term;
}
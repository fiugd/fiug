//show-preview

import { consoleHelper, importCSS, fetchTEXT, logJSON } from '../.tools/misc.mjs';
import '../shared.styl';
consoleHelper();

import parse5 from 'https://cdn.skypack.dev/parse5';
import pretty from 'https://cdn.skypack.dev/pretty';

function addBaseES6(html, href="../../", target="_blank"){
	try {
		const baseHref = html.includes('<base')
			? ''
			: `<base href="${href}" target="${target}">`;
		const document = parse5.parse(baseHref + html);
		return pretty(parse5.serialize(document));
	} catch(e){
		return html;
	}
}

function addBase(html, href="../../", target="_blank"){
	try {
		const baseHref = html.includes('<base')
			? ''
			: `\n<base href="${href}" target="${target}">\n`;

		if(!html.includes('<html>')){
			html = '<html>\n' + html + '\n</html>'
		}

		html = html.replace('<html>', html.includes('<head>')
			? '<html>'
			: '<html>\n\n<head></head>\n'
		);

		html = html.replace('<head>', `<head>${baseHref}`)

		return html;
	} catch(e){
		return html;
	}
}

(async () => {
	const exampleHTMLUrl = '../.templates/avif.html';
	const exampleHTML = await fetchTEXT(exampleHTMLUrl);
	console.info(addBase(exampleHTML));

})();
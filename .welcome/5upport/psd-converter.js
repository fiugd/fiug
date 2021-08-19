//show-preview
import { writePsd, readPsd } from 'https://cdn.skypack.dev/@gluefx/ag-psd';
import FileSaver from 'https://cdn.skypack.dev/file-saver';
import { appendUrls, consoleHelper, htmlToElement, importCSS, logJSON } from '../.tools/misc.mjs';
import '../shared.styl';

consoleHelper();
const { saveAs } = FileSaver;

/*
	this service would return a PSD when given a jpg or png
*/
(async () => {

	const width = 300;
	const height = 275;

	//const canvas = new OffscreenCanvas(width, height);
	const canvas = htmlToElement(`
		<canvas id="myCanvas" width="${width}" height="${height}"></canvas>
	`);
	const context = canvas.getContext('2d');
	context.fillStyle = '#1a1a1a';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#222';
	context.fillRect((width-100)/2, (height-100)/2, 100, 100);
	document.body.append(canvas)

	const psd = {
		width: width,
		height: height,
		children: [{
			name: 'Layer #1',
			canvas
		}, {
			name: 'Layer #2',
			canvas
		}]
	};

	const buffer = writePsd(psd);
	const blob = new Blob([buffer], { type: 'application/octet-stream' });

	const button = htmlToElement(`<button>save</button>`);
	document.body.append(button);
	button.addEventListener('click', () => saveAs(blob, 'my-file.psd'));

	const psdUrl = '../5upport/timeline.psd'
	const psdBuffer = await (await fetch(psdUrl)).arrayBuffer();

	const psdInput = readPsd(psdBuffer);
	document.body.append(psdInput.children[3].canvas);

	const truncateMetaDataLog = (key, value) =>
		['metadata'].includes(key) ? '[ TRUNCATED ]' : value;
	logJSON(psdInput, truncateMetaDataLog);

})();
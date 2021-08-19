//show-preview
import { appendUrls, consoleHelper, htmlToElement, importCSS, prism } from '../.tools/misc.mjs';
import 	'../shared.styl';

consoleHelper();

/*

drop a file from browser and it uploads to project

- this should be combined with code from paste-image.js & open.folder.html

*/

const deps = [
	"https://unpkg.com/dropzone@4.0.1/dist/dropzone.js"
];

(async () => {
	await appendUrls(deps);
	const dropArea = htmlToElement(`
	<div id="drop-area" tabindex='-1'>
		<style>
			#drop-area {
				display: flex;
				flex-direction: column;
				width: 100%;
				height: 30em;
				background: rgba(10, 10, 10, 0.1);
				border: 2px dashed rgb(100, 100, 100);
				border-radius: 3px;
				margin: 2em 0px;
				justify-content: center;
				align-items: center;
				box-sizing: border-box;
			}
			#drop-area:focus { border-color: red; outline: none }
			#drop-area.dz-drag-hover { filter: sepia(1) hue-rotate(157deg) saturate(2.5); }
			p { margin: 10px}
			.prism-preload { display: none; }
		</style>

		<p>drop files or folders here</p>
		<p>OR</p>
		<button id="clickable">Select Files</button>
	</div`);
	document.body.appendChild(dropArea)

	await prism('javascript','', 'prism-preload');

	Dropzone.autoDiscover = false;

	const myDropzone = new Dropzone(dropArea, {
		url: () => false,
		accept: (file) => false,
		ignoreHiddenFiles: false,
		previewsContainer: false,
		clickable: "#clickable"
	});

	const cbConcat = (newEvent, target, delay) => {
		let timeout, allArgs = [];
		return (args) => {
			if(timeout) clearTimeout(timeout)
			allArgs.push(args);
			timeout = setTimeout(() => {
				target.emit(newEvent, allArgs); allArgs = []; timeout = null;
			}, delay);
		};
	};

	myDropzone.on("addedfile", cbConcat("allFilesAdded", myDropzone, 50));

	myDropzone.on("allFilesAdded", async (files) => {
		await prism("javascript", JSON.stringify(
			files.map(x => ({ ...x, name: x.name }))
			, null, 2)
		);
	});

})()
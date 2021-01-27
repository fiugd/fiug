/*

	this would be a service that returns PSD when given a jpg or png

	https://www.npmjs.com/package/ag-psd

*/
const deps = [
	"../shared.styl",
	'https://unpkg.com/ag-psd@6.2.0/dist/bundle.js',
	"https://unpkg.com/file-saver@2.0.0-rc.2/dist/FileSaver.min.js"
];

const width = 300;
const height = 275;

//const canvas = new OffscreenCanvas(width, height);
const canvas = htmlToElement(`<canvas id="myCanvas" width="${width}" height="${height}"></canvas>`)
const context = canvas.getContext('2d');
context.fillStyle = '#1a1a1a';
context.fillRect(0, 0, width, height);
context.fillStyle = '#222';
context.fillRect((width-100)/2, (height-100)/2, 100, 100);

const psd = {
	width: width,
	height: height,
	children: [
		{
			name: 'Layer #1',
			canvas
		},
		{
			name: 'Layer #2',
			canvas
		}
	]
};

(async () => {
	window.exports = {};
	window.module = {};
	window.require = function(...args){
		console.log(args)
	}
	await appendUrls(deps);
	const { exports: { writePsd, readPsd } }  = module;

	const buffer = writePsd(psd);
	const blob = new Blob([buffer], { type: 'application/octet-stream' });

	const button = htmlToElement(`<button>save</button>`);
	document.body.append(button);
	button.addEventListener('click', () => {
		saveAs(blob, 'my-file.psd');
	});

	const psdUrl = '../5upport/timeline.psd'
	const psdBuffer = await (await fetch(psdUrl)).arrayBuffer();

	const psdInput = readPsd(psdBuffer);
	psdInput.children[0].canvas = canvas
	document.body.append(psdInput.children[0].canvas)

})()
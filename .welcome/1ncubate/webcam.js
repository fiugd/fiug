//show-preview
import tensorflowModelsBodyPix from 'https://cdn.skypack.dev/@tensorflow-models/body-pix';

import { appendUrls, addUrls, consoleHelper, htmlToElement, importCSS } from '../.tools/misc.mjs';
import '../shared.styl';
consoleHelper();
/*
https://github.com/jtangelder/webcam/blob/master/greenscreen.html

https://towardsdatascience.com/virtual-background-in-webcam-with-body-segmentation-technique-fc8106ca3038

*/


const deps = [
	'../shared.styl'
];

const styleHTML = `
	<style>
		video {
			width: 100%;
			object-fit: cover;
			height: auto;
			margin-bottom: 1em;
			/* filter: url(#displacement) */
		}
	</style>
`;

const svgFiltersHTML = `
<svg xmlns="http://www.w3.org/2000/svg" id="image" version="1.1">
	<defs>

	<filter id="blurEffect">
		<feGaussianBlur stdDeviation="4"/>
	</filter>

	<filter id="turbulence">
		<feTurbulence baseFrequency=".01" type="fractalNoise" numOctaves="3" seed="23" stitchTiles="stitch"/>
	</filter>

	<filter id="blur"> 
		<feGaussianBlur stdDeviation="10,3" result="outBlur"/> 
	</filter> 

	<filter id="inverse"> 
		 <feComponentTransfer> 
				 <feFuncR type="table" tableValues="1 0"/> 
				 <feFuncG type="table" tableValues="1 0"/> 
				 <feFuncB type="table" tableValues="1 0"/> 
		 </feComponentTransfer> 
	</filter> 

	<filter id="convolve"> 
		<feConvolveMatrix order="3" kernelMatrix="1 -1  1 -1 -0.01 -1 1 -1 1" edgeMode="duplicate" result="convo"/> 
	</filter> 

	<filter id="convoblur"> 
		<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/> 
		<feConvolveMatrix order="3" kernelMatrix="1 -1  1 -1 -0.01 -1 1 -1 1" edgeMode="none" result="convo"/> 
		<feMerge> 
			<feMergeNode in="blur"/> 
			<feMergeNode in="convo"/> 
		</feMerge> 
	</filter>

	<filter id="blackandwhite">
		<feColorMatrix values="0.3333 0.3333 0.3333 0 0
			0.3333 0.3333 0.3333 0 0
			0.3333 0.3333 0.3333 0 0
			0      0      0      1 0"
		/>
	</filter>

	<filter id="convolve2">
		<feConvolveMatrix
			filterRes="100 100"
			style="color-interpolation-filters:sRGB"
			order="3"
			kernelMatrix="0 -1 0   -1 4 -1   0 -1 0"
			preserveAlpha="true"
		/>
	</filter>

	<filter id="offset" x="-10%" y="-20%" height="230%" width="140%" transform="translate(90,0)">
		<feGaussianBlur stdDeviation="14"/>
		<feOffset dx="0" dy="240" result="B"/>
		<feMerge>
			<feMergeNode in="B"/>
			<feMergeNode in="SourceGraphic"/>
		</feMerge>
	</filter>

	<filter id="myblur">
		<feGaussianBlur stdDeviation="1"/>
	</filter>

	<filter id="myconvolve">
		<feConvolveMatrix
			filterRes="100 100"
			style="color-interpolation-filters:sRGB"
			order="3"
			kernelMatrix="0 -1 0   -1 4 -1   0 -1 0"
			preserveAlpha="true"
		/>
	</filter>


	<filter id="displacement" x="0%" y="0%" height="100%" width="100%">
		<feTurbulence
			baseFrequency=".005"
			type="fractalNoise"
			numOctaves="1"
			seed="1"
			stitchTiles="stitch"
		/>
		<feDisplacementMap
			scale="300"
			in="SourceGraphic"
			xChannelSelector="G"
		/>
	</filter>

	<filter id="bluefill" x="0%" y="0%" width="100%" height="100%">
		<feFlood flood-color="blue" result="A"/>
		<feColorMatrix type="matrix" in="SourceGraphic" result="B" values="
			1   0  0  0 0
			0   1  0  0 0
			0   0  1  0 0
			1   1  1  0 0
		"/>
		<feMerge>
			<feMergeNode in="A"/>
			<feMergeNode in="B"/>
		</feMerge>
	</filter>

	<filter id="noir">
		<feGaussianBlur stdDeviation="1.5"/>
			<feComponentTransfer>
					<feFuncR type="discrete" tableValues="0 .5 1 1"/>
					<feFuncG type="discrete" tableValues="0 .5 1"/>
					<feFuncB type="discrete" tableValues="0"/>
				 </feComponentTransfer>
			 </filter>
		 </defs>
	 </svg>
`;

(async () => {
	await appendUrls(deps);

	const style = htmlToElement(styleHTML);
	const filters = htmlToElement(svgFiltersHTML);
	
	const video = document.createElement('video');
	video.muted = true;
	video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
	video.play();

	const button = document.createElement('button');
	button.textContent = 'launch PiP'
	button.addEventListener("click", () => {
		video.requestPictureInPicture(); 
	});

	document.body.append(filters);
	document.body.append(style);
	document.body.append(video)
	document.body.append(button);

})();

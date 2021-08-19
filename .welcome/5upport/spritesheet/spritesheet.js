//show-preview
import GIF from 'https://cdn.skypack.dev/gif.js';
import { consoleHelper, htmlToElement, importCSS } from '../../.tools/misc.mjs';
import '../../shared.styl';
consoleHelper();

/*
gif lib - https://github.com/jnordberg/gif.js
sprite packer - https://www.codeandweb.com/free-sprite-sheet-packer
*/

const fetchJson = async (url) => await (await fetch(url)).json();
const logJson = (x) => console.log(JSON.stringify(x, null, 2));
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

class GifMaker {
	constructor(opts){
		this.gif = new GIF({
			workers: 4,
			quality: 10,
			workerScript: 'spritesheet.worker.js',
			transparent: 0x111100,
			...opts
		});
	}
	addFrame(ctx){
		this.gif.addFrame(ctx, { copy: true, delay: 150 });
	}
	finish(){
		const thisGif = this.gif;
		const p = new Promise((resolve) => {
			thisGif.on('finished', function(blob) {
				resolve(URL.createObjectURL(blob));
			});
			thisGif.render();
		});
		return p;
	}
}

class SpriteParser {
	constructor(configUrl, opts){
		this.configUrl = configUrl;
		this.opts = opts;
	}
	async parseConfig(){
		const spritesConfig = await fetchJson(this.configUrl);
		const {
			meta: {
				image: imageUrl,
				size
			},
			frames
		} = spritesConfig;
		this.imageUrl = imageUrl;

		const framesParsed = Object.entries(frames)
			.map(([name,v]) => ({ name, ...v}));
		const [width, height] = framesParsed.reduce((all, one) => {
			if(one.sourceSize.w > all[0]) all[0] = one.sourceSize.w;
			if(one.sourceSize.h > all[1]) all[1] = one.sourceSize.h;
			return all;
		}, [0, 0]);
		this.frames = framesParsed;
		this.width = width;
		this.height = height;

		const canvas = document.createElement("CANVAS");
		canvas.width = width;
		canvas.height = height;
		this.ctx=canvas.getContext("2d");
	}
	async start(gif){
		this.gif = gif;
		this.img = new Image();
		const thisImg = this.img;
		const thisCreateGif = this.createGif.bind(this);
		const thisImageUrl = this.imageUrl;
		await new Promise((resolve) => {
			thisImg.onload = async () => {
				await thisCreateGif();
				resolve();
			};
			thisImg.src= thisImageUrl;
		});
	}
	async createGif(){
		const { ctx, gif, img, width, height, frames } = this;
		const thisGif = new GifMaker({ width, height, ...this.opts });

		for(var y=0; y<frames.length; y++){
			const { frame } = frames[y];
			ctx.rect(0, 0, this.width, this.height);
			ctx.fillStyle = '#111100';
			ctx.fill();
			ctx.drawImage(img,
				frame.x,frame.y,frame.w,frame.h,
				0,0,width,height
			);
			thisGif.addFrame(ctx);
		}
		gif.src= await thisGif.finish();
	}
}

(async () => {
	const sprite = new SpriteParser(
		'./spritesheet.json',
		{ debug: false }
	);
	await sprite.parseConfig();
	const containerStyle = `
		width:${sprite.width}px;
		height:${sprite.height}px;
		background:transparent;
	`;
	const gifContainer = htmlToElement(`
		<div style="${containerStyle}">
			<img>
		</div>
	`);
	const gif = gifContainer.querySelector('img');

	await sprite.start(gif);
	gifContainer.append(sprite.gif);
	document.body.append(gifContainer);
})()
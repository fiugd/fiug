//https://unpkg.com/synaptic@1.1.1/dist/synaptic.min.js

// https://brain.js.org/ - supposed to be GPU accelerated

/*



*/

const MAX_COLOR_DIFF = 200; // maximum color diff possible

const centroids = [
	[67.47721536886036, 50.553661180644525, 44.73773786212245],
	[23.30993394509928, 22.405260659757932, 28.924509532473696],
	[199.530574561459, 150.71039218910065, 98.53510225246303],
	[137.5909163826732, 185.59365915306694, 234.6102840195476],
	[44.932165065008476, 57.92280140454907, 79.62261305236098]
];

const rgbaToKmeans = (kmeans) => (pixel, index) => {
	const km = kmeans.test([pixel[index], pixel[index+1], pixel[index+2]]);
	return km.idx;
}

const rgbaToScalar = (pixel, index) => {
	return (pixel[index]*1000000 + pixel[index+1]*1000 + pixel[index+2]) / 255255255;
}

const rgbaToArray = (pixel, index) => [
	pixel[index], pixel[index+1], pixel[index+2]
];

const RGBtoId = (pixels, width, height) => {
	var _canvas = document.createElement('canvas');
	var _ctx = _canvas.getContext('2d');
	const id = _ctx.createImageData(width, height);
	for(var i = 0, p = 0; p < pixels.length; i+=4, p++){
		id.data[i] = pixels[p][0];
		id.data[i+1] = pixels[p][1];
		id.data[i+2] = pixels[p][2];
		id.data[i+3] = pixels[p][3] || 255;
	}
	return id;
};

const idToRGBA = id => {
	const rgb = [];
	for(var i=0, len=id.length; i < len; i+=4){
		rgb.push([id[i], id[i+1], id[i+2]]);
	}
	return rgb;
}

const extractFeatures = (block) => {
	let pixelData, width;
	if(!block.getImageData){
		const image = block.getImage();
		var canvas = document.createElement('canvas');
		canvas.width = block.width;
		canvas.height = block.height;
		canvas.getContext('2d').drawImage(image, 0, 0, block.width, block.height);
		pixelData = canvas.getContext('2d').getImageData(0, 0, block.width, block.height).data;
	} else {
		pixelData = block.getImageData().data;
	}

	const toKmeans = rgbaToKmeans(block.kmeans);
	const top = toKmeans(pixelData, 0, block.kmeans);
	const right = toKmeans(pixelData, block.width*4);
	const left = toKmeans(pixelData, pixelData.length-block.width*4);
	const bottom = toKmeans(pixelData, pixelData.length-4);

	const pixels = idToRGBA(pixelData);
	const allKmeans = {};
	pixels.forEach(x => {
		allKmeans[block.kmeans.test(x).idx] = allKmeans[block.kmeans.test(x).idx] || 0;
		allKmeans[block.kmeans.test(x).idx]++
	});
	const pBlob = Object.entries(allKmeans).sort((a,b) => a[1] - b[1]).map(x => x[0])

	//return { ...block, features: [top, right, bottom, left] };
	return { ...block, features: [pBlob[0]||0, pBlob[1]||0, pBlob[2]||0, pBlob[3]||0] };
}

function convertURIToImageData(URI) {
	return new Promise(function(resolve, reject) {
		if (URI == null) return reject();
		var canvas = document.createElement('canvas'),
				context = canvas.getContext('2d'),
				image = new Image();
		image.addEventListener('load', function() {
			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			resolve(context.getImageData(0, 0, canvas.width, canvas.height));
		}, false);
		image.src = URI;
	});
}

// ClusterNN
(() => {
	class ClusterNN {
		async init ({ storage, imageData, blockSize, width, height, ctx }) {
			const deps = [
				"https://unpkg.com/synaptic@1.1.4/dist/synaptic.min.js",
				"https://unpkg.com/skmeans@0.11.3/dist/browser/skmeans.min.js",
				"https://unpkg.com/chroma-js@2.1.0/chroma.min.js", //this lib also does kmeans clustering
			];
			await appendUrls(deps);
			this.storage = storage;
			this.synaptic = window.synaptic;
			this.network = new synaptic.Architect.Perceptron(26, 4, 1);
			this.network.trainer = new synaptic.Trainer(this.network);
			this.set = await storage.getItem('clusterNN-train-set') || [];
			
			const defaultTrainingOpts = {
				rate: .1,
				iterations: 20000,
				error: .005,
			}
			
			this.trainingOptions = { ...defaultTrainingOpts, ...{
				//rate: 0.3,
				iterations: 1000,
				//error: .006,
			}}

			const getImage = (x, y) => () => {
				const pixelData = ctx.getImageData(x, y, blockSize, blockSize);
				
				const pixels = idToRGBA(pixelData.data);

				pixels.forEach(x => {
					const { centroid } = this.kmeans.test(x);
					x[0] = centroid[0];
					x[1] = centroid[1];
					x[2] = centroid[2];
				});
				
				function imagedata_to_image(imagedata) {
					var _canvas = document.createElement('canvas');
					var _ctx = _canvas.getContext('2d');

					_canvas.width = imagedata.width;
					_canvas.height = imagedata.height;
					_ctx.putImageData(imagedata, 0, 0);

					var _image = new Image();
					_image.src = _canvas.toDataURL();

					_image._width = imagedata.width;
					_image._height = imagedata.height;

					return _image;
				}
				
				function pixels_to_image(pxls, width, height){
					const imgD = RGBtoId(pxls, width, height);
					return imagedata_to_image(imgD);
				}
				//return pixels_to_image(pixels, blockSize, blockSize);
				return imagedata_to_image(pixelData);
			};
			
			const _getImageData = (x, y) => () => ctx.getImageData(x, y, blockSize, blockSize);
			const _putImageData = (x, y) => (imageData) => ctx.putImageData(imageData, x, y);
			this.kmeans = skmeans(idToRGBA(imageData.data), 5, centroids);

			const getEdges = (x,y) => ({
				right: () => ctx.getImageData(x+blockSize-1, y, 1, blockSize),
				left: () => ctx.getImageData(x, y, 1, blockSize),
				top: () => ctx.getImageData(x, y, blockSize, 1),
				bottom: () => ctx.getImageData(x, y+blockSize-1, blockSize, 1)
			});
			
			const allCanvasBlocks = ({ bx, by, ix, iy}) => {
				const blocks = [];
				let i = 0;
				const blocksPerRow = Math.floor(ix/bx);
				//console.log(blocksPerRow)
				const totalBlocks = (ix/bx) * (iy/by)
				for(var y=0; y+by <= iy;  y+=by){
					for(var x=0; x+bx <= ix;  x+=bx, i++){
						const getImageData = _getImageData(x,y);
						const putImageData = _putImageData(x,y);
						const me = { x, y, i }
						const neighbors = {
							up: () => me.y!==0
								? blocks[me.i-blocksPerRow]
								: blocks[totalBlocks-blocksPerRow+me.i],
							down:() => me.y+by!==iy
								? blocks[me.i+blocksPerRow]
								: blocks[blocksPerRow-(totalBlocks-me.i)],
							left: () => me.x!==0
								? blocks[me.i-1]
								: blocks[me.i+blocksPerRow-1],
							right: () => me.x+bx!==ix
								? blocks[me.i+1]
								: blocks[me.i-blocksPerRow+1],
						};

						blocks.push({
							i, x, y, getImage: getImage(x,y),
							getImageData, putImageData,
							width: blockSize, height: blockSize,
							kmeans: this.kmeans,
							edges: getEdges(x,y),
							average: () => {
								const id = getImageData().data;
								const rgb = idToRGBA(id);
								return skmeans(rgb, 1).centroids[0]
							},
							neighbors
						})
					}
				}
				return blocks;
			};

			this.blocks = allCanvasBlocks({
				bx: blockSize, by: blockSize,
				ix: width, iy: height
			});
			
			this.trainBig = async () => {
				const tdata = await storage.getItem('clusterNN-train-set');
				if(tdata){
					console.log('already trained');
					return;
				}
				console.log('training big')
				const trainBlocks = this.blocks
					.map((x, i) => ({ ...x, next: this.blocks[i+1]}))
					.filter(x => x.next && x.next.x !== 0);

				const getEdges = ([block, side]) => idToRGBA(block.edges[side]().data);
				const kmeansMap = x => this.kmeans.test(x).centroid;
				const colorDiffRows = (a1, a2) => a1.reduce((all, one, i) => {
					const colorArray = ([first, second, third]) => [first, second, third];
					all.push(chroma.deltaE(colorArray(a1[i]), colorArray(a2[i])) / MAX_COLOR_DIFF);
					return all; 
				}, [])

				const bigSet = [];
				for(var i=0, len=trainBlocks.length; i<len; i+=2){
					const block = trainBlocks[i];
					const diffBetweenAverages = (b1, b2) => chroma.deltaE(b1.average(), b2.average()) / MAX_COLOR_DIFF;
					const edgeDiffs = colorDiffRows(
						getEdges([block, "right"]), getEdges([block.next, "left"])
					);
					const input = [diffBetweenAverages(block, block.next), ...edgeDiffs];
					const output = [1];
					bigSet.push({ input, output });
				}
				const trainResult = await this.network.trainer.trainAsync(bigSet, this.trainingOptions);
				await this.storage.setItem('clusterNN-train-set', bigSet)
				console.log('done training big!');
			}

			if(this.set.length){
				await this.network.trainer.trainAsync(this.set, this.trainingOptions);
			}
		}
		async predict(blocks){
			const diffBetweenAverages = (b1, b2) => chroma.deltaE(b1.average(), b2.average()) / MAX_COLOR_DIFF;
			const getEdges = ([blockNumber, side]) => idToRGBA(blocks[blockNumber].edges[side]().data);
			const kmeansMap = x => this.kmeans.test(x).centroid;
			const colorDiffRows = (a1, a2) => a1.reduce((all, one, i) => {
				const MAX_DIFF = 200; // maximum color diff possible
				const colorArray = ([first, second, third]) => [first, second, third];
				all.push(chroma.deltaE(colorArray(a1[i]), colorArray(a2[i])) / MAX_DIFF);
				return all; 
			}, [])
			const getInput = (source, target) => {
				const edgeDiffs = colorDiffRows(
					getEdges(source), getEdges(target)
				)
				const input = [diffBetweenAverages(blocks[source[0]], blocks[target[0]]), ...edgeDiffs];
				return input;
			};

			const edgeMap = ([source, target]=[]) => !source
				? 0
				: this.network.activate(getInput(source, target))[0];
			const edges = [
				undefined,
				[[4, 'top'], [1, 'bottom']],
				undefined,
				[[4, 'left'], [3, 'right']],
				undefined,
				[[4, 'right'], [5, 'left']],
				undefined,
				[[4, 'bottom'], [7, 'top']],
				undefined
			];

			const output = edges.map(edgeMap);
			//console.log(output.filter(x => !!x));

			return output;
		}
		async train(blocks, _output){
			const diffBetweenAverages = (b1, b2) => chroma.deltaE(b1.average(), b2.average()) / MAX_COLOR_DIFF;
			const getEdges = ([blockNumber, side]) => idToRGBA(blocks[blockNumber].edges[side]().data);
			const kmeansMap = x => this.kmeans.test(x).centroid;
			const colorDiffRows = (a1, a2) => a1.reduce((all, one, i) => {
				const MAX_DIFF = 200; // maximum color diff possible
				const colorArray = ([first, second, third]) => [first, second, third];
				all.push(chroma.deltaE(colorArray(a1[i]), colorArray(a2[i])) / MAX_DIFF);
				return all; 
			}, [])
			const getInput = (source, target) => {
				const edgeDiffs = colorDiffRows(
					getEdges(source), getEdges(target)
				)
				const input = [diffBetweenAverages(blocks[source[0]], blocks[target[0]]), ...edgeDiffs];
				return input;
			};
			const edges = [
				undefined,
				[[4, 'top'], [1, 'bottom']],
				undefined,
				[[4, 'left'], [3, 'right']],
				undefined,
				[[4, 'right'], [5, 'left']],
				undefined,
				[[4, 'bottom'], [7, 'top']],
				undefined
			];

			for(var i=0, len=edges.length; i<len; i++){
				const edge = edges[i];
				if(!edge) continue;
				//if(!_output[i]) continue;
				const output = [ _output[i] ];
				const [ source, target ] = edge;
				const input = getInput(source, target);
				this.set.push({ input, output });
			}
			await this.storage.setItem('clusterNN-train-set', this.set)

			const trainResult = await this.network.trainer.trainAsync(this.set, this.trainingOptions);
			return trainResult;
		}
	};
	window.ClusterNN = ClusterNN;
})();

// Test UI
const testTrainerUI = ({ getTest, train, swap }) => {
	const trainContainer = htmlToElement(`
<div class="train-container">
	<style>
		.train-container.training {
				filter: grayscale(1);
		}
		.train-container.training button {
			pointer-events: none;
			opacity: 0.25;
		}
		.train-images {
			display: grid; grid-gap: 0px;
			grid-template-columns: repeat(3, 1fr);
			margin-bottom: 1em
		}
		.test-image-container {
			position: relative;
			height: 0;
			padding-bottom: 100%;
		}
		.test-image-container img {
			pointer-events: none;
		}
		.test-image-container.joined:before {
			content: "✓";
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
			color: #f0f;
			display: flex;
			justify-content: center;
			align-items: center;
			text-shadow: 1px 1px 0px black;
			pointer-events: none;
		}
		.test-image-container.corner { background: #232323;}
		.test-image-container.corner img {
			opacity: 0;
		}
	</style>
	<div class="train-images"></div>
	<button class="shuffle-action">SKIP</button>
	<button class="train-action">TRAIN</button>
	<button class="swap-action">SWAP</button>
</div>
`);
	document.body.append(trainContainer);

	let blocks, prediction;
	trainContainer.querySelector('.shuffle-action').addEventListener('click', async () => {
		trainContainer.classList.remove('training');
		({ blocks, prediction } = await getTest());
		trainContainer.querySelector('.train-images').textContent = '';
		blocks.forEach((x, i) => {
			const im = x.getImage();
			const ic = htmlToElement(`<div class="test-image-container" data-index="${i}"></div>`);
			[0,2,6,8].includes(i) && ic.classList.add('corner')
			i === 4 && ic.classList.add('center')
			i !== 4 && prediction[i] > 0.5 && ic.classList.add('joined')
			ic.append(im)
			trainContainer.querySelector('.train-images').append(ic)
		});
	});
	trainContainer.querySelector('.train-action').addEventListener('click', async () => {
		trainContainer.classList.add('training');
		const allEls = Array.from(trainContainer.querySelectorAll('.train-images .test-image-container'));
		const input = blocks;
		const output = allEls.map(x => x.classList.contains('joined') ? 1 : 0)
		await train(input, output);
		trainContainer.querySelector('.shuffle-action').click()
	});
	trainContainer.querySelector('.swap-action').addEventListener('click', swap)
	trainContainer.addEventListener('click', (e) => {
		if(!e.target.classList.contains('test-image-container')) return;
		if(e.target.classList.contains('center')) return;
		if(e.target.classList.contains('joined')){
			e.target.classList.remove('joined');
		} else {
			e.target.classList.add('joined');
		}
	})
	trainContainer.querySelector('.shuffle-action').click()
}

//test
(async () => {
	if(window.Vue) return

	const blockSize = 25;
	const width = 1500;
	const height = 1000;
	
	const localForageUrl = 'https://www.unpkg.com/localforage@1.9.0/dist/localforage.min.js';
	const appCssUrl = '../vue-app.css';

	await appendUrls([ localForageUrl, appCssUrl ]);

	function getStorage(){
		const driverOrder = [
			localforage.INDEXEDDB,
			localforage.WEBSQL,
			localforage.LOCALSTORAGE,
		];
		const storage = localforage
			.createInstance({
					driver: driverOrder,
					name: 'vue-app',
					version: 1.0,
					storeName: 'general', // Should be alphanumeric, with underscores.
					description: 'general storage for vue app'
			});
		return storage;
	}
	const storage = getStorage();

	const canvas = htmlToElement(`<canvas id="imageCanvas" width="${width}" height="${height}"></canvas>`)
	const ctx = canvas.getContext('2d');
	document.body.append(canvas)


	const imageData = await convertURIToImageData(await storage.getItem('vue-image-cache'));

	ctx.putImageData(imageData, 0, 0);
	var id = ctx.getImageData(0, 0, width, height);

	const net = new ClusterNN();
	const loadingTrainer = htmlToElement(`<div id="loading-trainer">Loading Trainer...</div>`)
	document.body.append(loadingTrainer)
	await net.init({ storage, imageData, blockSize, width, height, ctx });
	document.body.removeChild(loadingTrainer)

	const getTest = async () => {
		let cs= (x,y)=>x+(y-x+1)*crypto.getRandomValues(new Uint32Array(1))[0]/2**32|0;
		const blocks = [];
		while (blocks.length !== 9){
			const newRand = cs(0, net.blocks.length-1);
			if(blocks.map(x => x.i).includes(newRand)) continue;
			blocks.push({ ...net.blocks[newRand], i: newRand })
		}
		let prediction = await net.predict(blocks);
		let tries = 0;
		while(tries++ < 200 && prediction[1] < 0.5){
			const newRand = cs(0, net.blocks.length-1);
			if(blocks.map(x => x.i).includes(newRand)) continue;
			blocks[1] = { ...net.blocks[newRand], i: newRand };
			prediction = await net.predict(blocks);
		}
		tries = 0;
		while(tries++ < 200 && prediction[3] < 0.5){
			const newRand = cs(0, net.blocks.length-1);
			if(blocks.map(x => x.i).includes(newRand)) continue;
			blocks[3] = { ...net.blocks[newRand], i: newRand };
			prediction = await net.predict(blocks);
		}
		return {
			blocks, prediction
		};
	};
	const train = async (blocks, output) => {
		return await net.train(blocks, output);
	};
	
	const cluster = (block) => {
		const Sneb = block.neighbors;
		return [
			undefined,   Sneb.up(),    undefined,
			Sneb.left(),  block,      Sneb.right(),
			undefined,   Sneb.down(),  undefined
		];
	};
	const isFitted = (prediction, threshold) => ![1,3,5,7].find(x => prediction[x] <= (threshold || 0.5));

	const isBetterFitted = (newPred, oldPred) => {
		const countThreshold = 0.5;
		const fitTotal = (pred) => [1,3,5,7].reduce((all, one) => pred[one] + all, 0);
		const fitTotalCount = (pred) => [1,3,5,7].reduce((all, one) => pred[one] > countThreshold ? all +1 : all, 0);
		const countBonus = 0.1;
		const improvedFit = ( fitTotal(newPred) + fitTotalCount(newPred)*countBonus ) > ( fitTotal(oldPred) + fitTotalCount(newPred)*countBonus );
		return improvedFit;
	};

	let previousSwapBlock;
	let previousSwapBlockTries = [];
	const swap = async () => {
		let nogoBlocks = [];
		//console.warn('will swap')
		let cs= (x,y)=>x+(y-x+1)*crypto.getRandomValues(new Uint32Array(1))[0]/2**32|0;
		
		let source, sourceCluster;
		
		const randomBlockIndexFromPrev = (prev) => {
			const nextPossible = [
				() => prev.neighbors.up().neighbors.left(),
				() => prev.neighbors.up(),
				() => prev.neighbors.up().neighbors.right(),
				() => prev.neighbors.left(),
				() => prev.neighbors.right(),
				() => prev.neighbors.down().neighbors.left(),
				() => prev.neighbors.down(),
				() => prev.neighbors.down().neighbors.right(),
			];
			const randArrayItem = items => items[items.length * Math.random() | 0];
			return randArrayItem(nextPossible)().i;
		};
		
		while(!source){
			if(!previousSwapBlock || previousSwapBlockTries.length >= 8){
				previousSwapBlock = undefined;
				previousSwapBlockTries = [];
			}
			const sourceIndex = previousSwapBlock
				? randomBlockIndexFromPrev(previousSwapBlock)
				: cs(0, net.blocks.length-1);
			if(!previousSwapBlockTries.includes(sourceIndex)){
				previousSwapBlockTries.push(sourceIndex);
			}

			//if(nogoBlocks.includes(sourceIndex)) continue;
			//nogoBlocks.push(sourceIndex);
			
			sourceCluster = cluster(net.blocks[sourceIndex]);
			//if(sourceCluster.filter(x => !!x).length !== 5){
			//	continue;
			//}
			const SpredictionOld = await net.predict(sourceCluster);
			if(isFitted(SpredictionOld, 0.7)) continue;

			const predictionSum = [1,3,5,7].reduce((all, one) => all + SpredictionOld[one], 0);
			if(0.5*predictionSum-1 > Math.random()) continue;

			source = net.blocks[sourceIndex];
		}
		let target, targetCluster;
		let targetIndex = cs(0, net.blocks.length-1);
		while(!target){
			targetIndex++;
			if(nogoBlocks.includes(targetIndex)) continue;
			if(!net.blocks[targetIndex]){
				targetIndex = 0;
				continue;
			}
			if(nogoBlocks.length > 1000){
				previousSwapBlock = undefined;
				console.warn('no swap')
				return;
			}
			nogoBlocks.push(targetIndex);
			
			targetCluster = cluster(net.blocks[targetIndex]);
			if(targetCluster.filter(x => !!x).length !== 5){
				continue;
			}

			const TpredictionOld = await net.predict(targetCluster);

			const TpredictionNew = await net.predict([
				undefined, targetCluster[1], undefined,
				targetCluster[3], sourceCluster[4], targetCluster[5],
				undefined, targetCluster[7], undefined
			]);
			if(!isBetterFitted(TpredictionNew, TpredictionOld)) {
				//console.warn('source does not fit target')
				continue;
			}

			const SpredictionOld = await net.predict(sourceCluster);
			const Sprediction = await net.predict([
				undefined, sourceCluster[1], undefined,
				sourceCluster[3], targetCluster[4], sourceCluster[5],
				undefined, sourceCluster[7], undefined
			]);
			if(!isBetterFitted(Sprediction, SpredictionOld)) {
				//console.log('target does not fit source')
				continue;
			}
			target = net.blocks[targetIndex];
		}
		//console.log('TODO: swap source and target');
		//console.log({ source, target });
		
		const sourceImgd = source.getImageData();
		const targetImgd = target.getImageData();
		
		target.putImageData(sourceImgd);
		source.putImageData(targetImgd);
		previousSwapBlock = target;
		console.warn('swapped');
	};
	 
	function setIntervalNTimes(callback, delay, times){
		callback();
		times > 0 && setTimeout(() => {
			console.warn(times)
			setIntervalNTimes(callback, delay, --times)
		}, delay);
	}
	const swapRepeat = () =>  setIntervalNTimes(swap, 1000, 10000);

	//console.log(net.blocks[0].neighbors.left())
	//console.log(net.blocks.length)

	testTrainerUI({ getTest, train, swap: swapRepeat })

	await net.trainBig();

})();
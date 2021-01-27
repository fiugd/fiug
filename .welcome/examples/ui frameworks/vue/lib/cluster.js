/*
	https://github.com/seanmtracey/quick-cluster-counts/blob/master/index.js
*/

const HUGE_BLOB_SIZE = 1000000;
const MIN_BLOB_SIZE = 100; //pixels
const MIN_BLOB_BLOCKS = 6;

(() => {
	function unique(arr){
	/// Returns an object with the counts of unique elements in arr
	/// unique([1,2,1,1,1,2,3,4]) === { 1:4, 2:2, 3:1, 4:1 }

			var value, counts = {};
			var i, l = arr.length;
			for( i=0; i<l; i+=1) {
					value = arr[i];
					if( counts[value] ){
							counts[value] += 1;
					}else{
							counts[value] = 1;
					}
			}

			return counts;
	}

	const ImageCluster = function FindBlobs(src, blockSize) {

		var xSize = src.width,
				ySize = src.height,
				srcPixels = src.data,
				x, y, pos;

		//console.log(xSize, ySize)
		
		// This will hold the indecies of the regions we find
		var blobMap = [];
		var label = 1;

		// The labelTable remembers when blobs of different labels merge
		// so labelTabel[1] = 2; means that label 1 and 2 are the same blob
		var labelTable = [0];

		// Start by labeling every pixel as blob 0
		for(y=0; y<ySize; y++){
			blobMap.push([]);
			for(x=0; x<xSize; x++){
				blobMap[y].push(0);
			}
		}

		// Temporary variables for neighboring pixels and other stuff
		var nn, nw, ne, ww, ee, sw, ss, se, minIndex;
		var luma = 0;
		var isVisible = 0;

		// We're going to run this algorithm twice
		// The first time identifies all of the blobs candidates the second pass
		// merges any blobs that the first pass failed to merge
		var nIter = 2;
		while( nIter-- ){

			// We leave a 1 pixel border which is ignored so we do not get array
			// out of bounds errors
			for( y=1; y<ySize-1; y++){
				for( x=1; x<xSize-1; x++){

					pos = (y*xSize+x)*4;

					// We're only looking at the alpha channel in this case but you can
					// use more complicated heuristics
					//(nIter === 2 ) || 
					isVisible = ((srcPixels[pos+2] + srcPixels[pos+1] + srcPixels[pos+0]) > 500); //nope, looking at all channels instead
					//isVisible = false
					
					if( isVisible ){

						// Find the lowest blob index nearest this pixel
						nw = blobMap[y-1][x-1] || 0;
						nn = blobMap[y-1][x-0] || 0;
						ne = blobMap[y-1][x+1] || 0;
						ww = blobMap[y-0][x-1] || 0;
						ee = blobMap[y-0][x+1] || 0;
						sw = blobMap[y+1][x-1] || 0;
						ss = blobMap[y+1][x-0] || 0;
						se = blobMap[y+1][x+1] || 0;
						minIndex = ww;
						if( 0 < ww && ww < minIndex ){ minIndex = ww; }
						if( 0 < ee && ee < minIndex ){ minIndex = ee; }
						if( 0 < nn && nn < minIndex ){ minIndex = nn; }
						if( 0 < ne && ne < minIndex ){ minIndex = ne; }
						if( 0 < nw && nw < minIndex ){ minIndex = nw; }
						if( 0 < ss && ss < minIndex ){ minIndex = ss; }
						if( 0 < se && se < minIndex ){ minIndex = se; }
						if( 0 < sw && sw < minIndex ){ minIndex = sw; }

						// This point starts a new blob -- increase the label count and
						// and an entry for it in the label table
						if( minIndex === 0 ){
							blobMap[y][x] = label;
							labelTable.push(label);
							label += 1;

						// This point is part of an old blob -- update the labels of the
						// neighboring pixels in the label table so that we know a merge
						// should occur and mark this pixel with the label.
						}else{
							if( minIndex < labelTable[nw] ){ labelTable[nw] = minIndex; }
							if( minIndex < labelTable[nn] ){ labelTable[nn] = minIndex; }
							if( minIndex < labelTable[ne] ){ labelTable[ne] = minIndex; }
							if( minIndex < labelTable[ww] ){ labelTable[ww] = minIndex; }
							if( minIndex < labelTable[ee] ){ labelTable[ee] = minIndex; }
							if( minIndex < labelTable[sw] ){ labelTable[sw] = minIndex; }
							if( minIndex < labelTable[ss] ){ labelTable[ss] = minIndex; }
							if( minIndex < labelTable[se] ){ labelTable[se] = minIndex; }

							blobMap[y][x] = minIndex;
						}

					// This pixel isn't visible so we won't mark it as special
					}else{
						blobMap[y][x] = 0;
					}

				}
			}

			// Compress the table of labels so that every location refers to only 1
			// matching location
			var i = labelTable.length;
			while( i-- ){
				label = labelTable[i];
				while( label !== labelTable[label] ){
					label = labelTable[label];
				}
				labelTable[i] = label;
			}

			// Merge the blobs with multiple labels
			for(y=0; y<ySize; y++){
				for(x=0; x<xSize; x++){
					label = blobMap[y][x];
					if( label === 0 ){ continue; }
					while( label !== labelTable[label] ){
						label = labelTable[label];
					}
					blobMap[y][x] = label;
				}
			}
		}

		// The blobs may have unusual labels: [1,38,205,316,etc..]
		// Let's rename them: [1,2,3,4,etc..]
		var uniqueLabels = unique(labelTable);
		var i = 0;
		for( label in uniqueLabels ){
			labelTable[label] = i++;
		}
		
		const blobs = {};

		// convert the blobs to the minimized labels
		for(y=0; y<ySize; y++){
			for(x=0; x<xSize; x++){
				label = blobMap[y][x];
				blobMap[y][x] = labelTable[label];
				blobs[label] = blobs[label] || [];
				blobs[label].push({ label, x, y });
			}
		}

		// Return the blob data:

		const allCanvasBlocks = ({ bx, by, ix, iy}) => {
			const blocks = [];
			for(var y=0; y+by <= iy;  y+=by){
				for(var x=0; x+bx <= ix;  x+=bx){
					blocks.push({ x, y })
				}
			}
			return blocks;
		};

		const blockIt = allCanvasBlocks({
			bx: blockSize, by: blockSize,
			ix: xSize, iy: ySize
		});

		let blocks = {};
		Object.entries(blobs).forEach(([key, value]) => {
			if(value.length > HUGE_BLOB_SIZE) return
			if(value.length < MIN_BLOB_SIZE) return
			const _blocks = {};
			value.forEach(p => {
				const { x, y } = p;
				const block = blockIt.find((b) =>
					(b.x <= x) && (b.x + blockSize > x) &&
					(b.y <= y) && (b.y + blockSize > y)
				);
				if(!block) return
				_blocks[`x=${block.x} y=${block.y}`] = block;
			})
			
			if(Object.keys(_blocks).length < MIN_BLOB_BLOCKS) return
			//console.log(Object.keys(_blocks).join('  '))
			blocks = { ..._blocks, ...blocks };
		})

		return { blobs, blocks };
	};

	window.ImageCluster = ImageCluster;
})();



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
	


	function setPixel(imD, x, y, r, g, b, a) {
		try{
			var index = 4 * (x + y * imD.width);
			imD.data[index+0] = r;
			imD.data[index+1] = g;
			imD.data[index+2] = b;
			imD.data[index+3] = a;
		} catch(e){
			console.log(e);
			debugger
		}
	}
	
	const imageData = await storage.getItem('temp-image-data');
	const { blocks, blobs } = ImageCluster(imageData, blockSize);

	ctx.putImageData(imageData, 0, 0);
	var id = ctx.getImageData(0, 0, width, height);


	function random_rgba() {
		var o = Math.round, r = Math.random, s = 255;
		return {
			r: 255, //o(r()*s),
			g: 0, //o(r()*s),
			b: 0, //o(r()*s),
			a: 255
		};
	}

	const { r, g, b, a } = random_rgba();
	ctx.globalAlpha = 0.5;
	ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
	Object.entries(blocks).forEach(([key, block]) => {
		ctx.fillRect(block.x, block.y, blockSize, blockSize);
	});
	
	ctx.globalAlpha = 0.3;
	ctx.fillStyle = `rgba(0,255,0,255)`;
	Object.entries(blobs).forEach(([key, value]) => {
		if(value.length > HUGE_BLOB_SIZE) return
		if(value.length < MIN_BLOB_SIZE) return
		value.forEach(p => {
			const { x, y } = p;
			ctx.fillRect(x, y, 1, 1);
		});
	});

})();
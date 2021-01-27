import Controls from './controls.mjs'

const { mapState } = Vuex;

const blockSize = 25;

/*
bx, by - block width and height
ix, iy - image width and height
*/
const allCanvasBlocks = ({ bx, by, ix, iy}) => {
	const blocks = [];
	for(var y=0; y+by <= iy;  y+=by){
		for(var x=0; x+bx <= ix;  x+=bx){
			blocks.push({ x, y })
		}
	}
	return blocks;
};
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

export default {
	template: `
		<div>
			<!-- img src="vue-logo.svg" style="width:4.5em;" / -->
			<!-- p>{{ message }}</p -->
			<canvas id="imageCanvas" ref="imageCanvas" class="hidden"></canvas>
			<input type="file" style="display:none;" @change="onFileSelected" ref="fileUpload">
			<button @click="$refs.fileUpload.click()">Upload</button>
			<!-- button @click="increment">INCREMENT {{count}}</button -->
			<button @click="processImage">process</button>
			<button @click="processWithBlobs">processWithBlobs</button>
			<!-- controls label="Controls"></controls -->
		</div>
	`,
	data() {
		return {
			message: 'Upload and image, cut it up, rearrange it'
		}
	},
	async mounted(){
		const previousImage = await this.$storage.getItem('vue-image-cache');
		if(!previousImage) return;
		var img = new Image();
		img.onload = () => this.drawCanvasImage(img, true);
		img.src = previousImage;
	},
	components: {
		Controls
	},
	computed: mapState([
		'count'
	]),
	methods: {
		increment() {
			this.$store.commit('increment')
			console.log(this.$store.state.count)
		},
		onFileSelected(e){
			console.log(this.message)
 			const reader = new FileReader();
			const files = e.target.files;

			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => this.drawCanvasImage(img);
				img.src = event.target.result;
			};
			reader.readAsDataURL(files[0]);
		},
		async drawCanvasImage(img, previous) {
			const canvas = this.$refs.imageCanvas;
			canvas.classList.remove('hidden');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(img,0,0);
			!previous && await this.$storage.setItem('vue-image-cache', canvas.toDataURL('image/png'))
			//this.processImage();
		},
		async processImage(){
			const canvas = this.$refs.imageCanvas;
			const ctx = canvas.getContext('2d');

			const blockIt = allCanvasBlocks({
				bx: blockSize, by: blockSize,
				ix: canvas.width, iy: canvas.height
			});
			const shuffled = shuffle(JSON.parse(JSON.stringify(blockIt)))
				.map(({x, y}) => ctx.getImageData(x, y, blockSize, blockSize));

			shuffled.forEach((imgData, index) => {
				const target = blockIt[index];
				ctx.putImageData(imgData, target.x, target.y);
			});
			const imageData = ctx.getImageData(0,0,canvas.width,canvas.height)
			await this.$storage.setItem('temp-image-data', imageData);
		},
		async processWithBlobs(){
			/*console.log(`
				identify which blocks are part of blobs
				shufffle each block that is not part of blob
				write the blocks that were shuffled
			`);*/
			const canvas = this.$refs.imageCanvas;
			const ctx = canvas.getContext('2d');
			const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
			
			const { blocks } = ImageCluster(imageData, blockSize);
			
			const blockIt = allCanvasBlocks({
				bx: blockSize, by: blockSize,
				ix: canvas.width, iy: canvas.height
			});
			const filteredBlockIt = blockIt.filter(b => {
				return !blocks[`x=${b.x} y=${b.y}`]
			});
			
			console.log(`${blockIt.length - filteredBlockIt.length} stay in place`)
			
			const shuffled = shuffle(JSON.parse(JSON.stringify(filteredBlockIt)))
				.map(({x, y}) => ctx.getImageData(x, y, blockSize, blockSize));

			shuffled.forEach((imgData, index) => {
				const target = filteredBlockIt[index];
				ctx.putImageData(imgData, target.x, target.y);
			});
			const writeImageData = ctx.getImageData(0,0,canvas.width,canvas.height)
			await this.$storage.setItem('temp-image-data', writeImageData);
		}
		
	}
}

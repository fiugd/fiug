/*

the goal of this thread is to find libraries/modules/functions which make numerical exploration simple

example tasks

- creating a graph of array items
- plotting the derivative/integral of that array
- manipulating that array of items
	- stretch it into a bigger array (interpolation?)
	- filter it
	- hi-pass/low-pass it
	- ..
- listen to it as an audio signal
- apply it to an image
- identify features of it (spikes, etc)
- something, something probabily/statistics with it
- fractal deformation of it

some libs:
	- http://borischumichev.github.io/everpolate/
	- ...

wish list:
	- integral
	- z-transforms
	- FFT, DFT, and/or discrete cosine transform (DCT)
	- eigenvalues (stuff I did not learn well in enough in college)
	- linear regression
	- monte carlo
	- markov chains
	- lots of probability stuff
	- lots of matrix and graph stuff
	- k-means

*/


const module = {};

const deps = [
	"https://unpkg.com/plotly.js@1.56.0/dist/plotly.min.js",
	"../shared.styl",
	"./mathematics.css"
];

Array.prototype.range = function(a, b, step){
		var A = [];
		if(typeof a == 'number'){
				A[0] = a;
				step = step || 1;
				while(a+step <= b){
						A[A.length]= a+= step;
				}
		}
		else {
				var s = 'abcdefghijklmnopqrstuvwxyz';
				if(a === a.toUpperCase()){
						b = b.toUpperCase();
						s = s.toUpperCase();
				}
				s = s.substring(s.indexOf(a), s.indexOf(b)+ 1);
				A = s.split('');        
		}
		return A;
}

// color invert
function invert([hex]) {
		function padZero(str, len) {
				len = len || 2;
				var zeros = new Array(len).join('0');
				return (zeros + str).slice(-len);
		}
		if (hex.indexOf('#') === 0) {
				hex = hex.slice(1);
		}
		if (hex.length === 3) {
				hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}
		var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
				g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
				b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
		// pad each with zeros and return
		return '#' + padZero(r) + padZero(g) + padZero(b);
}

function interpolate(mult, array){
	if(!mult){ return array; }
	const newArray = [];
	for(var i=0; i<array.length; i++){
		const arrVal = array[i];
		const nextVal = array[i+1];
		(new Array(mult+1)).fill()
			.map((x,j)=>j+1)
			.forEach(x => {
				newArray.push( arrVal + ((nextVal - arrVal) * (x/(mult+1)))  )
			});
	}
	return newArray;
}

// https://gist.github.com/bsudekum/93da2c80cf439aee4c08
function numerical_int(dx, y_array) {
		var maxy = Math.max.apply(null, y_array);
		var dy_array = y_array.map(function(num) {
				return Math.abs(maxy - num);
		});
		var profile_integral = 0;
		var n = dy_array.length;
		for (i = 1; i < n; i++) {
				var dy_init = dy_array[i - 1];
				var dy_end = dy_array[i];
				var darea = dx * (dy_init + dy_end) / 2.;
				profile_integral = profile_integral + darea;
		}
		return profile_integral;
}

function createGraph({
	data=[], color="a33"
}){
	const key = `tester-${Math.random().toString().replace('0.','')}`;
	module[key] = htmlToElement(`<div id="${key}"></div>`);
	document.body.appendChild(module[key]);

	const STEP = 1;

	//https://gist.github.com/andersonfreitas/11055882
	function derivative(f) {
	 //var h = 0.001;
	 var h = STEP;
	 return function(x) {
		 return (f(x + h) - f(x - h)) / (2 * h);
	 };
	}

	const range = [].range(0, data.length*STEP, STEP);

	const line1fn = (x) => {
		const index = range.indexOf(x);
		//interpolation
		if(index === -1){
			const ITSTEP = 0.01;
			const BAILOUT = 10000;

			const upper = (() => {
				let it = x + ITSTEP;
				let bail = 0;
				while(range.indexOf(it) === -1 && bail < BAILOUT){
					it = Number(Number(it + ITSTEP).toFixed(2));
					bail++;
				}
				return { it, value: data[range.indexOf(it)] };
			})();
			const lower = (() => {
				let it = x - ITSTEP;
				let bail = 0;
				while(range.indexOf(it) === -1 && bail < BAILOUT){
					it = Number(Number(it - ITSTEP).toFixed(2));
					bail++;
				}
				return { it, value: data[range.indexOf(it)] };
			})();
			const ratio = (x-lower.it)/(upper.it - lower.it);
			return lower.value + ((upper.value - lower.value) * ratio);
		}
		return data[range.indexOf(x)]
	}

	var line1 = {
		name: 'source',
		x: range,
		y: range.map(line1fn),
		//y: range.map(Math.sin),
		mode: 'lines',
		fill: 'tonexty',
		fillcolor: invert([color])+'2f',
		marker: {
			color: invert`830`+'44',
			size: 5
		},
		line: {
			color: invert([color]),
			width: 1
		}
	};

	const derived = line1.x.map(derivative(line1fn));
	//console.info(derived.join(', '))

	var derivative = {
		name: 'derivative',
		x: line1.x,
		y: derived,
		mode: 'lines',
		fill: 'tozeroy',
		fillcolor: invert`05a`+'1f',
		marker: {
			color: invert`05f`+'44',
			size: 5
		},
		line: {
			color: invert`05a`,
			width: 1
		}
	};

	var data = [line1, derivative];

	const axisConfig = {
		mirror: 'ticks',

		showgrid: true,
		gridcolor: invert`#888`+'20',
		gridwidth: 1,

		zeroline: true,
		zerolinecolor: invert`#faa`+'11',
		zerolinewidth: 1,

		showline: false,
		linecolor: '#fff',
		linewidth: 20
	};
	const font = {
		family: 'sans-serif',
		size: '1em',
		color: invert`#fff`+'5a'
	};
	const layout = {
		font,
		margin: {
			l: 30,
			r: 30,
			t: 10,
			b: 50,
			pad: 7
		},
		showlegend: false,
		plot_bgcolor: 'transparent',
		paper_bgcolor: 'transparent',
		responsive: true,
		xaxis: axisConfig,
		yaxis: axisConfig
	};
	const options = {
		displaylogo: false,
		responsive: true,
		displayModeBar: false, // popover bar
		staticPlot: true       // no hover effects
	};


	const plot = Plotly.newPlot(module[key], data, layout, options);

	/*
	window.addEventListener('resize', () => {
		Plotly.relayout(key, {
			width: window.innerWidth-30 > 1010 ? 1010 : window.innerWidth-30,
			height: 400
		});
	})
	*/
}


const sampleData = [
	1.1,  2,  4,  4, 10,  4,  4,  5,  6, 10, 13, 20, 30, 22, 20, 45, 35, 60, 48, 34, 28,
	 30, 35, 28, 27, 23, 30, 30, 30, 27, 20, 21, 15, 20, 36, 35, 36, 48, 50, 54, 55, 60
];

(async()=>{
	await appendUrls(deps);

	createGraph({
		color: '#461',
		data: interpolate(0, sampleData)
	});
	createGraph({
		data: interpolate(3, sampleData),
		color: '#704',
	});
	createGraph({
		data: interpolate(10, sampleData),
		color: '#635',
	});
	createGraph({
		data: interpolate(10, sampleData.reverse()),
		color: '#563',
	});
	createGraph({
		data: interpolate(10, sampleData).sort((a,b) => a-b),
		color: '#055',
	});
	createGraph({
		data: interpolate(0, sampleData.sort((a,b) => a-b)),
		color: '#165',
	});
})();

/*

this is the brain.js that Heather Arthor started, stopped, and someone else picked up

here are more libs: https://analyticsindiamag.com/top-10-javascript-machine-learning-libraries/

*/

const deps = [
	'https://unpkg.com/brain.js@2.0.0-beta.2/dist/brain-browser.js',
	'../shared.styl'
];

;(async () => {
	await appendUrls(deps);
	await prism('javascript', '', 'prism-preload');

	/*
	// provide optional config object (or undefined). Defaults shown.
	const config = {
		binaryThresh: 0.5,
		hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
		activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
		leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
	};

	// create a simple feed forward neural network with backpropagation
	const net = new brain.NeuralNetwork(config);
	const gpunet = new brain.NeuralNetworkGPU(config);

	const trainingData = [
		{ input: [0, 0], output: [0] },
		{ input: [0, 1], output: [1] },
		{ input: [1, 0], output: [1] },
		{ input: [1, 1], output: [0] },
	];
	net.train(trainingData);
	gpunet.train(trainingData);

	const output = net.run([1, 0]); // [0.987]
	console.info(output)
	
	const gpuoutput = gpunet.run([1, 0]); // [0.987]
	console.info(gpuoutput)
	*/
	
	const net = new brain.recurrent.LSTMTimeStep({
		inputSize: 2,
		hiddenLayers: [10],
		outputSize: 2,
	});

	// Same test as previous, but combined on a single set
	const trainingData = [
		[
			[1, 5],
			[2, 4],
			[3, 3],
			[4, 2],
			[5, 1],
		],
		[
			[1, 5.2],
			[2, 4],
			[3, 3],
			[4, 2],
			[5, 1],
			[8,7],
			[10,10],
			[2,1]
		],
	];

	net.train(trainingData, { log: false, errorThresh: 0.09 });

	const closeToFiveAndOne = net.run([
		[1, 5],
		[2, 4],
		[3, 3],
		[4, 2],
	]);

	console.log(closeToFiveAndOne);

	// now we're cookin' with gas!
	const forecast = net.forecast(
		[
			[1, 5],
			[2, 4],
		],
		10
	);

	console.log(JSON.stringify(forecast, null, 2));
})()

/*

https://github.com/karpathy/recurrentjs

the idea here is to explore RNN's

using convnet, also by karpathy

not sure it's working properly

https://cs.stanford.edu/people/karpathy/convnetjs/

*/

const deps = [
	'https://unpkg.com/convnetjs@0.3.0/build/convnet.js',
	'../shared.styl'
];

;(async () => {
	await appendUrls(deps);
	await prism('javascript', '', 'prism-preload');
	
	/*
	const { Net, Vol, Trainer } = convnetjs;
	var layer_defs = [
		// input layer of size 1x1x2 (all volumes are 3D)
		{type:'input', out_sx:1, out_sy:1, out_depth:2},
		
		// some fully connected layers
		{type:'fc', num_neurons:20, activation:'relu'},
		{type:'fc', num_neurons:20, activation:'relu'},
		
		// a softmax classifier predicting probabilities for two classes: 0,1
		{type:'softmax', num_classes:2}
	];
	const net = new Net();
	net.makeLayers(layer_defs);
	const x = new Vol([0.5, -1.3])
	const probability_volume = net.forward(x);
	console.info('probability that x is class 0: ' + probability_volume.w[0]);

	const trainer = new Trainer(net, {learning_rate:0.01, l2_decay:0.001});
	trainer.train(x, 0);

	const probability_volume2 = net.forward(x);
	console.info('probability that x is class 0: ' + probability_volume2.w[0]);
	*/
	
	var layer_defs = [];
	layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2});
	layer_defs.push({type:'fc', num_neurons:5, activation:'sigmoid'});
	layer_defs.push({type:'regression', num_neurons:1});
	var net = new convnetjs.Net();
	net.makeLayers(layer_defs);

	var x = new convnetjs.Vol([0.5, -1.3]);

	// train on this datapoint, saying [0.5, -1.3] should map to value 0.7:
	// note that in this case we are passing it a list, because in general
	// we may want to  regress multiple outputs and in this special case we 
	// used num_neurons:1 for the regression to only regress one.
	var trainer = new convnetjs.SGDTrainer(net, 
								{learning_rate:0.01, momentum:0.0, batch_size:1, l2_decay:0.001});
	trainer.train(x, [0.7]);

	// evaluate on a datapoint. We will get a 1x1x1 Vol back, so we get the
	// actual output by looking into its 'w' field:
	var predicted_values = net.forward(x);
	console.log('predicted value: ' + predicted_values.w[0]);
	
})()

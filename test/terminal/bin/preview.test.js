import {operation} from '/crosshj/fiug-beta/terminal/bin/preview.js';

const createElement = () => ({
	classList: {
		add: () => {},
		remove: () => {}
	},
	prepend: () => {}
});

self.document = {
	location: self.location,
	querySelector: createElement,
	createElement
};

const args = {
	eventName: 'init',
	cwd: "crosshj/fiug-beta",
	file: "*.js",
	//file: "index.html",
	watch: true,
	event: {
		cwd: "crosshj/fiug-beta",
		file: "index.html",
		watch: true
	}
};

class Resolver {
	constructor(callback){
		this.done = undefined;
		this.promise = new Promise((resolve, reject) => {
			this.done = (response) => {
				callback(response);
				resolve();
			};
		})
	}
}

const resolver = new Resolver(
	(res) => console.log(res || 'preview done')
);
const response = await operation(args, resolver.done);
console.log(response);

await resolver.promise;

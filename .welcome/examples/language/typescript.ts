/*
*/

const deps = [
	'../../shared.styl'
];

(async () => {
	await appendUrls(deps);

	function fib(n: number): number {
		let a = 0;
		let b = 1;
		if (n <= 0){
			return a;
		}
		while (--n) {
			const t = a + b;
			a = b;
			b = t;
		}
		return b;
	}
	
	let results: number[] = [];
	for(var i=0, len=10; i<len; i++){
		results.push(fib(i))
	}
	console.log(results.join('\n'))

})();

/*
	https://en.wikipedia.org/wiki/Operational_transformation
*/

const deps = [
	'../shared.styl'
];

(async () => {
	await appendUrls(deps);
	await prism('javascript', '', 'prism-preload');

	class TransformString {
		value='';
		position=0;

		constructor(value){
			this.value = value
		}

		skip = ({ count }={}) => {
			if(this.position+count > this.value.length) throw new Error('skip past end');
			this.position += count;
		}

		delete = ({ count }={}) => {
			if(this.position+count > this.value.length) throw new Error('delete past end');
			this.value = this.value.slice(0, this.position) + this.value.slice(this.position+count);
		}

		insert = ({ chars }={}) => {
			this.value = this.value.slice(0, this.position) + chars + this.value.slice(this.position);
			this.position += chars.length
		}

		equals = (str) => this.value === str
	}

	function isValid(stale, latest, otjson) {
		try {
			const ot = JSON.parse(otjson);
			if(!Array.isArray(ot)){
				throw new Error('malformed transform');
			}
			const tstring = new TransformString(stale);
			for(let i=0; i < ot.length; i++){
				const { op, ...args } = ot[i];
				tstring[op](args);
			}
			return [tstring.equals(latest)];
		} catch (e) {
			return [false, e.message]
		}
	}

	const tests = [
		[
			'Repl.it uses operational transformations to keep everyone in a multiplayer repl in sync.',
			'Repl.it uses operational transformations.',
			'[{"op": "skip", "count": 40}, {"op": "delete", "count": 47}]',
			true
		], [
			'Repl.it uses operational transformations to keep everyone in a multiplayer repl in sync.',
			'Repl.it uses operational transformations.',
			'[{"op": "skip", "count": 45}, {"op": "delete", "count": 47}]',
			false,
			'delete past end'
		], [
			'Repl.it uses operational transformations to keep everyone in a multiplayer repl in sync.',
			'Repl.it uses operational transformations.',
			'[{"op": "skip", "count": 40}, {"op": "delete", "count": 47}, {"op": "skip", "count": 2}]',
			false,
			'skip past end'
		], [
			'Repl.it uses operational transformations to keep everyone in a multiplayer repl in sync.',
			'We use operational transformations to keep everyone in a multiplayer repl in sync.',
			'[{"op": "delete", "count": 7}, {"op": "insert", "chars": "We"}, {"op": "skip", "count": 4}, {"op": "delete", "count": 1}]',
			true
		], [
			'Repl.it uses operational transformations to keep everyone in a multiplayer repl in sync.',
			'Repl.it uses operational transformations to keep everyone in a multiplayer repl in sync.',
			'[]',
			true
		]
	];

	for(let i=0; i < tests.length; i++){
		const [stale, latest, otjson, expect, reason] = tests[i];
		const [result, fault] = isValid(stale, latest, otjson);
		await prism('json', JSON.stringify({
			stale, latest,
			ops:JSON.parse(otjson).map(({op,count,chars})=>`${op}: ${count||chars}`).join(', '),
			expect, reason, result, fault
		},null,2))
	}

})();
//NOTE: sucks that I am stuck with this instance of chalk
import chalk2 from "https://cdn.skypack.dev/-/chalk@v2.4.2-3J9R9FJJA7NuvPxkCfFq/dist=es2020,mode=imports/optimized/chalk.js";
import colorize from 'https://cdn.skypack.dev/json-colorizer';

// enable browser support for chalk
const levels = {
	disabled: 0,
	basic16: 1,
	more256: 2,
	trueColor: 3
}
chalk2.enabled = true;
chalk2.level = levels.trueColor;

// json colors
const colors = {
	BRACE: '#BBBBBB',
	BRACKET: '#BBBBBB',
	COLON: '#BBBBBB',
	COMMA: '#BBBBBB',
	STRING_KEY: '#dcdcaa',
	STRING_LITERAL: '#ce9178',
	NUMBER_LITERAL: '#b5cea8',
	BOOLEAN_LITERAL: '#569cd6',
	NULL_LITERAL: '#569cd6',
};

const jsonColors = (json) => colorize(json, { colors, pretty: true });

const chalk = chalk2;

export { chalk, jsonColors };

export const fetchJSON = url => fetch(url).then(x => x.json());

export const readDir = async (serviceName, dir, cwd) => {
	let response, error;
	try {
		const { result: allServices } = await fetchJSON('/service/read');
		if(!serviceName && !cwd) return { repsonse: allServices.map(x => x.name) };
		const { id: serviceId } = serviceName
			? allServices.find(x => x.name === serviceName )
			: allServices.reduce((all, one) => {
				const svcMatches = new RegExp("^"+one.name).test(cwd) ||
					new RegExp("^/"+one.name).test(cwd);
				if(!svcMatches) return all;
				if(!all || !all.name) return one;
				if(one.name.length > all.name.length) return one;
				return all;
			}, '');
		const { result: [service] } = await fetchJSON(`/service/read/${serviceId}`)
		const tree = service.tree[serviceName || service.name];
		const theDir = dir.includes(service.name)
			? dir.split(service.name)[1]
			: dir;
		if(theDir === '/'){
			return { response: Object.keys(tree).map(name => ({ name })) };
		}
		const response = Object.keys(
			theDir.split('/')
				.filter(x=>x)
				.reduce((all,one) => all[one], tree)
		).map(name => ({ name }));
		return { response };
	} catch(error) {
		return { error };
	}
};
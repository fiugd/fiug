//NOTE: sucks that I am stuck with this instance of chalk
//import chalk2 from "https://cdn.skypack.dev/-/chalk@v2.4.2-3J9R9FJJA7NuvPxkCfFq/dist=es2020,mode=imports/optimized/chalk.js";
import chalk2 from "https://cdn.skypack.dev/chalk@2.4.2";
import colorize from 'https://cdn.skypack.dev/json-colorizer';
import ansiEscapes from 'https://cdn.skypack.dev/ansi-escapes';
const {
	cursorHide, cursorShow,
	cursorPrevLine, cursorBackward,
	eraseLine, eraseDown,
	cursorSavePosition, cursorRestorePosition
} = ansiEscapes;

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
//const jsonColors = (obj) => JSON.stringify(obj,null,2);

const chalk = chalk2;

export { chalk, jsonColors };

export const fetchJSON = url => fetch(url).then(x => x.json());

export const getServices = async (id) => {
	const url = typeof id !== 'undefined'
		? `/service/read/` + id
		: `/service/read`;
	const { result: services } = await fetch(url, {
		"headers": {
			"accept": "application/json",
			"content-type": "application/json",
		},
	}).then(x => x.json());
	return services;
};

export const getCurrentService = async (prop="name") => {
	const currentServiceId = localStorage.getItem('lastService');
	if(!currentServiceId || currentServiceId === "0"){
		if(prop==="all") return { id: 0, name: '~'};
		return '~';
	}
	const { result: [ service ] } = await fetch(`/service/read/${currentServiceId}`, {
		"headers": {
			"accept": "application/json",
			"content-type": "application/json",
		},
	}).then(x => x.json());
	if(prop==="all") return service;
	return service[prop];
};

export const readDir = async (serviceName, dir, cwd) => {
	let response, error;
	try {
		const { result: allServices } = await fetchJSON('/service/read');
		if(!serviceName && !cwd) return { response: allServices };
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

export const addFile = async (target, source, service={}) => {
	const currentService = await getCurrentService("all");
	const serviceName = service.name || currentService.name;
	const serviceId = (service.id+'') || currentService.id;
	const body = JSON.stringify({
		name: serviceName,
		id: serviceId,
		operation: { name: "addFile", source, target }
	});
	try {
		return fetch("https://beta.fiug.dev/service/update/"+serviceId, {
			method: "POST",
			headers: {
				"accept": "application/json",
				"content-type": "application/json",
			},
			body,
		}).then(x => x.json());
	} catch(e){
		console.log(e);
		return { error: 'failed to write file: ' + target }
	}
}

export const addFolder = async (target, service={}) => {
	const currentService = await getCurrentService("all");
	const serviceName = service.name || currentService.name;
	const serviceId = (service.id+'') || currentService.id;
	const body = JSON.stringify({
		name: serviceName,
		id: serviceId,
		operation: { name: "addFolder", target }
	});
	try {
		return fetch("https://beta.fiug.dev/service/update/"+serviceId, {
			method: "POST",
			headers: {
				"accept": "application/json",
				"content-type": "application/json",
			},
			body,
		}).then(x => x.json());
	} catch(e){
		console.log(e);
		return { error: 'failed to create folder: ' + target }
	}
}

// thanks @ https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json
const spinners = {
	"dots": {
		"interval": 80,
		"frames": [
			"⠋",
			"⠙",
			"⠹",
			"⠸",
			"⠼",
			"⠴",
			"⠦",
			"⠧",
			"⠇",
			"⠏"
		]
	},
	"aesthetic": {
		"interval": 80,
		"frames": [
			"▰ ▱ ▱ ▱ ▱ ▱ ▱",
			"▰ ▰ ▱ ▱ ▱ ▱ ▱",
			"▰ ▰ ▰ ▱ ▱ ▱ ▱",
			"▰ ▰ ▰ ▰ ▱ ▱ ▱",
			"▰ ▰ ▰ ▰ ▰ ▱ ▱",
			"▰ ▰ ▰ ▰ ▰ ▰ ▱",
			"▰ ▰ ▰ ▰ ▰ ▰ ▰",
			"▰ ▱ ▱ ▱ ▱ ▱ ▱"
		]
	},
	"bouncingBall": {
		"interval": 80,
		"frames": [
			"( ●    )",
			"(  ●   )",
			"(   ●  )",
			"(    ● )",
			"(     ●)",
			"(    ● )",
			"(   ●  )",
			"(  ●   )",
			"( ●    )",
			"(●     )"
		]
	},
	"pong": {
		"interval": 80,
		"frames": [
			"▐⠂       ▌",
			"▐⠈       ▌",
			"▐ ⠂      ▌",
			"▐ ⠠      ▌",
			"▐  ⡀     ▌",
			"▐  ⠠     ▌",
			"▐   ⠂    ▌",
			"▐   ⠈    ▌",
			"▐    ⠂   ▌",
			"▐    ⠠   ▌",
			"▐     ⡀  ▌",
			"▐     ⠠  ▌",
			"▐      ⠂ ▌",
			"▐      ⠈ ▌",
			"▐       ⠂▌",
			"▐       ⠠▌",
			"▐       ⡀▌",
			"▐      ⠠ ▌",
			"▐      ⠂ ▌",
			"▐     ⠈  ▌",
			"▐     ⠂  ▌",
			"▐    ⠠   ▌",
			"▐    ⡀   ▌",
			"▐   ⠠    ▌",
			"▐   ⠂    ▌",
			"▐  ⠈     ▌",
			"▐  ⠂     ▌",
			"▐ ⠠      ▌",
			"▐ ⡀      ▌",
			"▐⠠       ▌"
		]
	},
	"point": {
		"interval": 125,
		"frames": [
			"∙∙∙∙",
			"●∙∙∙",
			"∙●∙∙",
			"∙∙●∙",
			"∙∙∙●",
			"∙∙∙∙",
			"∙∙∙∙",
			"∙∙∙●",
			"∙∙●∙",
			"∙●∙∙",
			"●∙∙∙",
			"∙∙∙∙",
		]
	},
};

export class Spinner {
	constructor(args={}){
		const name = args.name || 'point';
		const { interval, frames } = spinners[name];
		this.frames = frames;
		this.interval = interval;

		this.color = args.color || '#aff';
		this.doneColor = args.doneColor || '#aff';
		this.message = args.message || 'loading';
		this.doneMsg = args.doneMsg || 'done';
		this.stdOut = args.stdOut;
	}

	async until(unresolved){
		const {
			interval, color, frames, message, stdOut, doneColor, doneMsg
		} = this;
		let done;
		let i = 0;

		stdOut(
			cursorHide +
			cursorSavePosition +
			message + ': ' +
			eraseDown
		);

		const drawFrame = () => {
			i++;
			if(frames.length === i) i = 0;
			const frame = frames[i];
			stdOut(
				eraseDown +
				cursorRestorePosition +
				message + ': ' +
				chalk.hex(color)(frame)
			);
		};
		drawFrame();
		const timer = setInterval(drawFrame, interval);

		unresolved.then(() => {
			clearInterval(timer);
			stdOut(
				cursorRestorePosition +
				eraseLine + 
				message + ': ' +
				chalk.hex(doneColor)(doneMsg) +
				cursorShow
				//cursorPrevLine
			);
			done();
		})

		return new Promise((resolve) => {
			done = resolve;
		});
	}
}


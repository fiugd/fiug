const configUrl = 'zydeco.config.json';
const deps = [
	'../shared.styl'
];

/*
https://gitlab.com/-/ide/project/crosshj/dropbox-migrate/tree/master/-/CODE/%5B%5D_utk/UTK_backup/cgi-bin/poetry/poem.c/
*/

function parseConfig(configText){
	const config = {};
	const lines = configText.split('\n')
	
	let currentList;
	lines.forEach(line => {
		if(!line) return;
		if(line.trim().indexOf('/*') === 0) return;
		if(line.trim().indexOf('//') === 0) return;
		
		if(line.includes('###')){
			currentList = line.split('###')[1].trim()
			return;
		}
		if(!currentList) {
			return;
		}
		if(line.includes('=')){
			config[currentList] = config[currentList] || {};
			const [prop, value] = line.split('=');
			if(['bg_colors', 'speech_parts', 'sources'].includes(prop)){
				config[currentList][prop] = value.split(',')
				return;
			}
			if(prop.indexOf('template') === 0){
				config[currentList].templates = config[currentList].templates || [];
				config[currentList].templates.push(value);
				return;
			}
			config[currentList][prop] = value
			return;
		} else {
			config[currentList] = config[currentList] || [];
			config[currentList].push(line);
			return;
		}
	})
	return config;
}

function randItem(items){
	var item = items[Math.floor(Math.random() * items.length)];
	return item;
}

function getPoem(config){
	let thepoem = '';
	let { templates } = config['zydeco_bones_v1'];
	const template = templates[0];
	template.split(' ').forEach(part => {
		if(part === 'comma'){
			thepoem = thepoem.trim();
			thepoem += ',\n';
			return;
		}
		if(part === 'period'){
			thepoem = thepoem.trim();
			thepoem += '.  ';
			return;
		}
		thepoem += randItem(config[part]) + ' ';
	})
	return thepoem;
}

(async () => {
	const proxy = 'http://localhost:3333/proxy/';
	const fontstyle = htmlToElement(`
		<style>
			@import url('${proxy}https://fonts.googleapis.com/css2?family=Amatic+SC&display=swap');
			@import url('${proxy}https://fonts.googleapis.com/css2?family=Lobster+Two:ital@1&display=swap');
			@import url('${proxy}https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');

			@font-face {
				font-family: 'Amatic SC';
				font-style: normal;
				font-weight: 400;
				font-display: swap;
				src: url(${proxy}https://fonts.gstatic.com/s/amaticsc/v15/TUZyzwprpvBS1izr_vO0DQ.ttf) format('truetype');
			}
			@font-face {
				font-family: 'Lobster Two';
				font-style: italic;
				font-weight: 400;
				font-display: swap;
				src: url(${proxy}https://fonts.gstatic.com/s/lobstertwo/v13/BngOUXZGTXPUvIoyV6yN5-fI5qA.ttf) format('truetype');
			}
			@font-face {
				font-family: 'Special Elite';
				font-style: normal;
				font-weight: 400;
				font-display: swap;
				src: url(${proxy}https://fonts.gstatic.com/s/specialelite/v11/XLYgIZbkc4JPUL5CVArUVL0nhnc.ttf) format('truetype');
			}

			.info {
				font-family: 'Lobster Two', cursive;
				font-family: 'Amatic SC', cursive;
				font-family: 'Special Elite', cursive;
				font-size: 2em;
			}
		</style>
	`);
	document.body.append(fontstyle)
	await addUrls(deps);

	const config = parseConfig(await(await fetch(configUrl)).text());
	
	const poem = getPoem(config);
	console.info(poem);

	//await prism('json', JSON.stringify(config, null, 2));

})();

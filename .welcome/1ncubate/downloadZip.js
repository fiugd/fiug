//show-preview
import { appendUrls, consoleHelper } from '../.tools/misc.mjs';
consoleHelper();

/*

download a zip of the entire project

the only thing left is working this in to the service request handler

*/

const deps = [
	"../shared.styl",
	"https://unpkg.com/jszip@3.1.5/dist/jszip.min.js",
	"https://unpkg.com/jszip-utils@0.1.0/dist/jszip-utils.js",
	"https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js"
];

const pretty = async (x) => await prism("json", JSON.stringify(x, null, 2));

const flattenTree = (tree) => {
	const results = [];
	const recurse = (branch, parent = '/') => {
		const leaves = Object.keys(branch);
		leaves.map(key => {
			const children = Object.keys(branch[key]);
			if(!children || !children.length){
				results.push({
						name: key,
						code: parent + key,
						path: parent + key
				});
			} else {
				if(!branch[key]){ debugger; }
				recurse(branch[key], `${parent}${key}/`);
			}
		});
	};
	recurse(tree);
	return results;
};

async function zipService(service){
	var zip = new JSZip();
	for(var k=0; k < service.length; k++){
		const { name, code, binary } = service[k];
		zip.file(name, code, { binary });
	}
	return zip;
};

(async() => {
	await appendUrls(deps);

	const saveButton = document.createElement('button');
	saveButton.innerText = 'save as ZIP'

	saveButton.onclick = async (e) => {
		const exampleService = (await (await fetch('../../service/read/778')).json()).result[0];

		let flat = flattenTree(exampleService.tree);
		flat = flat.map(x => ({
			name: x.path.slice(1),
			code: (exampleService.code.find(y => x.name === y.name)||{}).code
		}));
		for(var f=0; f < flat.length; f++){
			const { name, code } = flat[f]
			if(typeof code === "object" && Object.keys(code).length === 0){
				flat[f].code = await (await fetch('../../' + name)).blob();
				flat[f].binary = true;
			}
		}

		const zip = await zipService(flat)
		/*
		const contents = [];
		zip.folder("").forEach((path, file) => contents.push({ path, file}));
		for(var i=0; i<contents.length; i++){
			const { file, path } = contents[i]
			if(!file.dir){
				//file.text = await zip.file(path).async('string')
			} else {
				continue;
			}
			await pretty({ file });
		}
		*/

		const binary = await zip.generateAsync({type:"blob"})
		saveAs(binary, `${exampleService.name}.zip`);
	}
	document.body.appendChild(saveButton)
})();

const defaultCode = (_name) => [{
	name: "index.js",
	code:
`const serviceName = '${_name}';

const send = (message) => {
	const serviceMessage = \`\${serviceName}: \${message}\`;
	(process.send || console.log)
		.call(null, \`\${serviceName}: \${message}\`);
};

process.on('message', parentMsg => {
	const _message = parentMsg + ' PONG.';
	send(_message);
});
`
}, {
	name: "package.json",
	code: JSON.stringify({
		name: _name,
		main: "react-example.jsx",
		description: "",
		template: "",
		port: ""
	}, null, '\t')
}, {
	name: 'react-example.jsx',
	code: exampleReact()
}];

const defaultTree = (_name) => ({
	[_name]: {
		"index.js": {},
		"package.json": {},
		"react-example.jsx": {}
	}
});


const defaultServices = [{
	id: 1,
	name: 'API Server',
	tree: defaultTree('API Server'),
	code: defaultCode('API Server')
}, {
	id: 10,
	name: 'UI Service',
	tree: defaultTree('UI Service'),
	code: defaultCode('UI Service')
}, {
	id: 777,
	name: 'welcome',
	tree: [{
		welcome: {
			"service.json": {}
		}
	}],
	code: [{
		name: "service.json",
		code: JSON.stringify({
			id: 777,
			type: "frontend",
			persist: "filesystem",
			path: ".welcome",
			version: 0.4,
			tree: null,
			code: null
		}, null, 2)
	}]
}];

const dummyService = (_id, _name) => ({
	id: _id+"",
	name: _name,
	code: defaultCode(_name),
	tree: defaultTree(_name)
});

const getServicesFromLS = () => {
	try{
		return JSON.parse(localStorage.getItem('localServices'));
	} catch(e){
		return;
	}
};

const saveServiceToLS = (currentServices=[], service) => {
	try{
		const serviceToUpdate = currentServices.find(x => Number(x.id) === Number(service.id));
		if(!serviceToUpdate){
			currentServices.push(service);
		} else {
			serviceToUpdate.name = service.name;
			serviceToUpdate.id = service.id;
			serviceToUpdate.code = JSON.parse(service.code).files;
			serviceToUpdate.tree = JSON.parse(service.code).tree;
		}
		localStorage.setItem('localServices', JSON.stringify(currentServices));
	} catch(e){
		return;
	}
};

let lsServices = [];

//TODO: this is intense, but save a more granular approach for future
async function fileSystemTricks({ result }){
	if(!result.result[0].code.find){
		const parsed = JSON.parse(result.result[0].code);
		result.result[0].code = parsed.files;
		result.result[0].tree = parsed.tree;
		console.log('will weird things ever stop happening?');
		return;
	}
	const serviceJSONFile = result.result[0].code.find(item => item.name === 'service.json');
	if(serviceJSONFile && !serviceJSONFile.code){
		const fetched = await fetch(`./.${result.result[0].name}/service.json`);
		serviceJSONFile.code = await fetched.text();
	}
	if(serviceJSONFile){
		let serviceJSON = JSON.parse(serviceJSONFile.code);
		if(!serviceJSON.tree){
			const fetched = await fetch(`./${serviceJSON.path}/service.json`);
			serviceJSONFile.code = await fetched.text();
			serviceJSON = JSON.parse(serviceJSONFile.code);
		}
		result.result[0].code = serviceJSON.files;
		result.result[0].tree = {
			[result.result[0].name]: serviceJSON.tree
		}
	}
	const len = result.result[0].code.length;
	for(var i=0; i < len; i++){
		const item = result.result[0].code[i];
		if(!item.code && item.path){
			const fetched = await fetch('./' + item.path);
			item.code = await fetched.text();
		}
	}
}

async function externalStateRequest(op){
	//debugger
	//console.log(op.name);

	let result;
	let readId, updateId;
	try {
		readId = op.name === "read" && op.url.split('read/')[1];
		if(readId){
			localStorage.setItem('lastService', readId);
			//console.log(`should set: ${readId}`);
		}
		updateId = op.name === "update" && ((o) => {
			try{
				return JSON.parse(o.config.body).id;
		  }catch(e){
				return;
			}
		})(op);

		if(document.location.href.includes('apps.crosshj.com')){
			throw new Error('Server not implemented for apps.crosshj.com');
		}

		op.config.headers = op.config.headers || {};
		if(localStorage.getItem("reloadServices") === "true"){
			op.config.headers['x-cache'] = 'reload';
		} else {
			op.config.headers['x-cache'] = 'force-cache';
		}

		const response = await fetch(op.url, op.config);
		result = await response.json();

		if(result.message === 'read' && readId){
			await fileSystemTricks({ result });
		}
	} catch (e) {
		console.log(e)
		lsServices = getServicesFromLS() || defaultServices;

		if(op.name === "update"){
			if(!op.config || !op.config.body){
				console.error("when updating, should have an operation body");
				return;
			}
			let serviceToUpdate;
			try {
				serviceToUpdate = JSON.parse(op.config.body);
			}catch(e){}

			if(!serviceToUpdate){
				console.error("when updating, operation body should be service to update");
				return;
			}
			if(!serviceToUpdate.name || !serviceToUpdate.id){
				console.error("service to update is malformed!");
				return;
			}


			const untrickCode = JSON.parse(serviceToUpdate.code);
			//TODO: this is where diff between filesytem backed files would be useful
			untrickCode.files.forEach(f => {
				if(f.path && f.name === "service.json"){
					f.code = '';
				}
			});
			serviceToUpdate.code = JSON.stringify(untrickCode);

			//debugger
			if(window.DEBUG){
				const c = JSON.parse(serviceToUpdate.code);
				debugger;
				serviceToUpdate.code = JSON.stringify(c);
			}


			saveServiceToLS(lsServices, serviceToUpdate);
			lsServices = getServicesFromLS() || [];
			//console.log(JSON.stringify(op, null, 2));
		}

		if(op.name === "create"){
			const { id, name, code } = JSON.parse(op.config.body);

			saveServiceToLS(lsServices, dummyService(id, name));
			lsServices = getServicesFromLS() || [];
			//debugger
		}

		if(op.name === "delete"){
			const { id } = JSON.parse(op.config.body);
			lsServices = getServicesFromLS() || [];
			lsServices = lsServices
				.filter(x => Number(x.id) !== Number(id));
			localStorage.setItem('localServices', JSON.stringify(lsServices));
		}

		if(readId){
			const result = {
				result: lsServices.filter(x => Number(x.id) === Number(readId))
			}
			await fileSystemTricks({ result });
			return result;
		}
		if(updateId){
			return {
				result: lsServices.filter(x => Number(x.id) === Number(updateId))
			};
		}

		result = {
			result: lsServices //.sort((a, b) => Number(a.id)-Number(b.id))
		};

	}
	return result;
}

function exampleReact(){ return `
// (p)react hooks
function useStore() {
  let [value, setValue] = useState(1);

  const add = useCallback(
    () => setValue(value+2),
    [value]
  );

  return { value, add };
}

const Style = () => (
<style dangerouslySetInnerHTML={{__html: \`
  body { display: flex; font-size: 3em; }
  body > * { margin: auto; }
  #clicker {
    cursor: pointer;
    background: url("data:image/svg+xml,%3Csvg width='100%' height='100%' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3E%3Cpath d='m11.61724,2.39725c0,0.78044 -0.39092,1.94771 -0.92661,2.95967c0.00514,0.00382 0.01027,0.00764 0.01538,0.01151c0.73296,-0.83424 0.95997,-2.34561 2.82973,-2.46949c1.86977,-0.12388 4.76668,5.72251 1.72228,6.863c-0.72347,0.27102 -0.16185,0.31797 -1.28384,0.14343c0.99502,0.4928 0.39169,0.19741 0.83213,0.81656c1.90904,2.68368 -4.33675,7.09457 -6.24582,4.41089c-0.44902,-0.63121 -0.30316,-0.19483 -0.45163,-1.33693l-0.00042,0.00003l-0.00624,0c-0.1,1 0.1,0.65 -0.4,1.3c-1.9,2.7 -7.9,-2.6 -6,-5.3c0.4,-0.6 0.9,-0.2 1.9,-0.7c-1.1,0.2 -1.4,-0.1 -2,-0.3c-3,-1.1 -0.3,-6.7 2.7,-5.6c0.7,0.3 0.8,0 1.5,1l0,0c-0.5,-1 -0.6,-0.9 -0.6,-1.7c0,-3.3 6.5,-3.2 6.5,0z' fill='%238f0047' stroke-miterlimit='23' stroke-width='0' transform='rotate(118.8 8.3,8)'/%3E%3C/svg%3E") 50% no-repeat;
    text-align: center;
    padding: 45px;
    padding-top: 150px;
    user-select: none;
    height: 200px;
    width: 280px;
    background-color: #002e00;
  }
  #clicker p { margin-top: 2px; margin-left: -50px }
  #clicker * { filter: drop-shadow(3px 13px 4px #006600); }
\`}} />);


//(p)react
const App = () => {
  const { value, add } = useStore();

  return (
    <div onClick={add} id="clicker" title="just click the flower already...">
      <Style />
      <span>kiliki aʻu</span>
      <p>{value}</p>
    </div>
  );
};`;}

/*

- don't want to update this code every time I want new stuff to exist by default

- would like to have a folder of default stuff, though

- would like that to update at different times for different situations

- not ready to go full-on with Service Worker to get to this


*/

export { externalStateRequest };
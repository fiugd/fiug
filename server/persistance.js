// https://www.codementor.io/@teodeleanu/how-to-use-sequelize-orm-in-your-express-application-u5d78po6f

let Service;

class Persistence {
	constructor(){

	}

	async init(){
		const db = require('./db').init();
		Service = db.Service;
		this.Service = db.Service;
		// creates/overwrites(if force is true)
		await Service.sync({ force: false });
		return this;
	}

	async create(service={}){
		try {
			if(!service.name){
				service.name = `${Math.random()}`;
			}
			//process.stdout.write('create - ')
			let serviceDef = JSON.parse(JSON.stringify(service));

			 // creates/overwrites(if force is true)
			//await Service.sync({ force: true });

			if(Array.isArray(serviceDef.code) && service.tree){
				serviceDef.code = JSON.stringify({
					code: service.code,
					tree: service.tree
				}, null, 2);
			}

			console.log({ code: serviceDef.code })


			// if(Array.isArray(serviceDef.code)){
			// 	console.log(JSON.stringify({
			// 		code: serviceDef.code,
			// 		tree: serviceDef.tree
			// 	}, null, 2))
			// 	console.trace("looking for tree")
			// }

			// console.log(`${serviceDef.name} : ${typeof serviceDef.code} ${Array.isArray(serviceDef.code) ? 'ARRAY' : 'OBJECT'}`)

			const newService = await Service.create(serviceDef);
			return newService;
		} catch(e){
			console.log(e.toString().split('\n')[0]);
			return;
		}
	}

	async read(id){
		try {
			//process.stdout.write('read - ')
			// console.log();
			let services;
			if(id){
				let service = await Service.findOne({where: {id}})
				services = [ service ];
			} else {
				services = await Service.findAll({});
			}
			//console.log({ services })
			return services;
		} catch(e){
			console.log(e.toString().split('\n')[0]);
			return;
		}
	}

	async update(){
		process.stdout.write('update - ')
	}

	async delete(){
		process.stdout.write('delete - ')
	}
}

async function init(config = {}){
	const persist = new Persistence(config);
	const instance = await persist.init();
	return instance;
}

module.exports = { init };
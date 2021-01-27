const Persist = require('./persistance');
const express = require('express');
const app = express();
const port = 3080;
const managerInit = require('./manager').init;
const { handler, cors } = require('./utilities');

async function setupExpress({ manager }){
	app.use(cors);
	app.use(express.json({ limit: '50MB' }));
	app.use(express.urlencoded({extended: true}));

	app.get('/', handler(manager, 'hello'));

	app.post('/service/create', handler(manager, 'create'));
	app.get('/service/read/:id*?', handler(manager, 'read'));
	app.post('/service/update', handler(manager, 'update'));
	app.post('/service/delete', handler(manager, 'delete'));

	app.get('/manage', handler(manager, 'manage'));
	app.get('/monitor', handler(manager, 'monitor'));
	app.get('/persist', handler(manager, 'persist'));

	await app.listen(port, () => console.log(`Example app listening on port ${port}!\n`));
}

(async () => {
	try {
		const dbConfig = {};
		const db = await Persist.init(dbConfig);
		const manager = await managerInit({ db });
		await setupExpress({ manager });
	} catch(e) {
		console.log(e);
	}
})();

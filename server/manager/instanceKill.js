const fs = require('fs');

const dirname = `${__dirname}/../../__services`;

var deleteFolderRecursive = function (path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function (file, index) {
			var curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	} else {
		console.error();
		console.error(`WARNING: unfound: ${path}!`);
		console.error();
	}
};

function instanceKill(services, callback) {

	(async () => {
		//console.log({ servicesToKill: services.map(x => x.id) })
		//console.log( services )

		for(var i=0, len=services.length; i < len; i++){
			const instance = services[i].instance;
			if(!instance){
				console.error();
				console.error(`Why does this service not have an instance?`);
				console.error(services[i]);
				console.error();
				continue;
			}
			await services[i].instance.kill();
			// TODO: should also delete file(s) for service
			// next is a bad way to do that?
			const dirToDelete = `${dirname}/.${services[i].name.replace(/\s/g, '_')}.service`;
			//console.log({ dirToDelete });
			deleteFolderRecursive(dirToDelete);
		}
		callback && callback();
	})();
}

exports.instanceKill = instanceKill;

const plugin = (entry) => ({
	name: 'service worker build', // this name will show up in warnings and errors
	resolveId ( source ) {
		if (source === 'virtual-module') {
			return source; // this signals that rollup should not ask other plugins or check the file system to find this id
		}
		if(source.startsWith('https://')) return source;
		if(source.startsWith('./')) return source;
		if(source.startsWith('/')) return source;

		console.log(source);
		return null; // other ids should be handled as usually
	},
	load: async ( id ) => {
		if (id === 'virtual-module') {
			return entry; // the source code for "virtual-module"
		}
		if(id.startsWith('https://')){
			return await fetch(id)
				.then(x => x.text())
		}
		if(id.startsWith('./')){
			return await fetch('https://beta.fiug.dev/crosshj/fiug-beta/service-worker/'+id)
				.then(x => x.text())
		}
		if(id.startsWith('/')){
			return await fetch('https://beta.fiug.dev/crosshj/fiug-beta'+id)
				.then(x => x.text())
		}
		return null; // other ids should be handled as usually
	}
});

export default plugin;

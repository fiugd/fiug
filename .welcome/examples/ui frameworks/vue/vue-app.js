/*
	https://vuejs.org/v2/guide/
*/
import HelloComponent from './components/hello.mjs'
import Router from './router/vue-router.mjs'

function getStorage(){
	const driverOrder = [
		localforage.INDEXEDDB,
		localforage.WEBSQL,
		localforage.LOCALSTORAGE,
	];
	const storage = localforage
		.createInstance({
				driver: driverOrder,
				name: 'vue-app',
				version: 1.0,
				storeName: 'general', // Should be alphanumeric, with underscores.
				description: 'general storage for vue app'
		});
	return storage;
};

(function(){
	if(typeof Vue === 'undefined') return;

	const Bar = { template: '<div>bar</div>' }
	const NotFound = { template: '<div>not found</div>' }
	const RootComponent = {
		setup() {
			return { };
		}
	};

	const store = new Vuex.Store({
		state: {
			count: 0
		},
		mutations: {
			increment (state) {
				state.count++
			}
		}
	});

	const routes = [
		{ path: '/:pathMatch(.*)', component: NotFound },
		{ path: '/foo', name: 'Home', component: HelloComponent },
		{ path: '/bar', name: 'Example Page', component: Bar }
	];

	const router = Router({ routes, store });

	const app = Vue.createApp(RootComponent);

	app.config.globalProperties.$storage = getStorage();
	app.use(router);
	app.use(store);
	app.mount('#app');
	
	router.replace('/foo');
	
	document.getElementById('app').classList.remove('hidden')
})()
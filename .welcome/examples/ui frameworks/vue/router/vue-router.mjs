const { createRouter, createMemoryHistory } = VueRouter;

export default function ({ routes, store }){
	const router = createRouter({
		routes,
		history: createMemoryHistory()
	});
	router.beforeEach((to, from, next) => {
		console.log(`Do things with route protection here`)
		console.log({ to, from, next, state: store.state.count })
		next()
	});
	return router;
};

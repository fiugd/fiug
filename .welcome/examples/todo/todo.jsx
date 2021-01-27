import './todo.styl';

import { Header } from './todo-header.jsx';
import { Body } from './todo-body.jsx';
import { Footer } from './todo-footer.jsx';
import { Actions } from './todo-actions.jsx';

import { getState } from './todo-state.mjs';
const useStore = getState({ useState, useCallback });

const App = () => {
	const {
		value, ...actions
	} = useStore();
	const {
		todos=[], counts, activeFilter='all', searchTerm
	} = value || {};

	return (
		<div class="app">
			<div class="container">
				<Header name="⚡ todo ⚡"/>
				<Actions
					{ ...actions }
					useStore={useStore}
				/>
				<Body
					active={activeFilter}
					{ ...value }
					{ ...actions }
				/>
				<Footer
					{ ...actions }
					active={activeFilter}
					counts={counts}
				/>
			</div>
		</div>
	);
};

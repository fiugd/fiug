const paramsPattern = /\[(.*?):(.*?)\]/g;
const extractParams = (s) => {
	let extracted = s.match(paramsPattern);
	return extracted.map(x => {
		const split = x.replace(/^\[/,'').replace(/\]$/,'').split(':');
		return {
				[split[0].trim()]: split[1].trim()
		}
	});
};

const ignoreParams = (s) =>  (s||'').replace(paramsPattern, '').trim();

export const Body = ({ todos=[], active, addTodo, searchTodo, searchTerm, checkItem, reorder }) => {
	const isSearchView = ['all', 'completed'].includes(active)
	
	const drop = (e) => {
		const item = e.dataTransfer.getData('text');
		e.dataTransfer.clearData();
		e.target.classList.remove('dragOver');
		const to = event.target.dataset.order;
		reorder({ item, order: Number(to) - 0.1});
	};

	const seperatorRowClass = ({ value }) => {
		if(!value) return '';
		const seperators = [
			'-----', '=====', '*****', '~~~~~', '#####'
		];
		const isSeperator = seperators.find(x => value.includes(x));
		return isSeperator
			? ' seperator'
			: '';
	};

	const getTodoClass = todo => {
		const sepClass = seperatorRowClass(todo);
		const isInvisible = todo.hidden
			|| (
				isSearchView
				&& !sepClass
				&& searchTerm
				&& !todo.value.toLowerCase().includes(searchTerm.toLowerCase())
			)
			|| (
				isSearchView && sepClass && searchTerm
			)
		return todo.status + sepClass +
			(isInvisible ? ' invisible' : '')
	};

	const spacer = {
		order: todos.length,
		value: '',
		status: 'dragSpacer'
	};

	const searchBarAction = {
		active: {
			text: 'ADD',
			value: '',
			handler: (event) => {
				const inputText = document.getElementById('inputBox').value;
				addTodo(inputText);
				event.preventDefault();
			}
		},
		all: {
			text: 'SEARCH',
			value: searchTerm,
			handler: (event) => {
				const inputText = document.getElementById('inputBox').value;
				searchTodo(inputText);
				event.preventDefault();
			}
		},
		completed: {
			text: 'SEARCH',
			value: searchTerm,
			handler: (event) => {
				const inputText = document.getElementById('inputBox').value;
				searchTodo(inputText);
				event.preventDefault();
			}
		}
	}[active];
	isSearchView && (searchBarAction.onChange = searchBarAction.handler);

	return (
		<div class="todo-body">
			<div class="input-container">
				<form onSubmit={searchBarAction.handler}>
					<input
						id="inputBox"
						type="text"
						value={searchBarAction.value}
						autocomplete="off"
						onInput={searchBarAction.onChange || (() => {})}
					/>
					<button
						onClick={searchBarAction.handler}
						className={searchBarAction.text.toLowerCase()}
					>{searchBarAction.text}</button>
				</form>
			</div>
			<ul>
				{[...(todos||[]), spacer].map((todo, i) => (
					<li
						data-order={todo.order}
						class={getTodoClass(todo)}
						draggable="true"
						onDragStart={ (e) => {
							e.dataTransfer
							 .setData('text/plain', todo.value);
						}}
						onDragOver={ (e) => {
							e.preventDefault();
							e.target.classList.add('dragOver');
						}}
						onDragLeave={ e => e.target.classList.remove('dragOver') }
						onDrop={drop}
						key={todo.value}
					>
						{ !todo.hidden && <input
							type="checkbox"
							droppable="false"
							defaultChecked={todo.status==="completed"}
							onChange={() => checkItem(todo.value)}
						/> }
						<span
							droppable="false"
						>{isSearchView ? todo.value : ignoreParams(todo.value)}</span>
					</li>
				))}
			</ul>
		</div>
	);
};

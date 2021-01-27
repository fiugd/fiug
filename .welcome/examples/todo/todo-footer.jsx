export const Footer = ({ filterTodos, active, counts={} }) => {
	const buttons = ['all', 'active', 'completed'];
	return (
		<div class="todo-footer">
			{buttons.map((menuItem, i) => (
				<div
					className={active===menuItem && 'active'}
					onClick={() => filterTodos(menuItem)}
				>
					<span>{menuItem}</span>
					<span class="todo-count">
						{counts[menuItem] || ''}
					</span>
				</div>
			))}
		</div>
	);
};

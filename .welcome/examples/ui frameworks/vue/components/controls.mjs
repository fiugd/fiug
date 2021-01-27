export default {
	props: {
		label: {
			type: String
		}
	},
	template: `
		<div>
			<label>{{ label }}</label>
			<ul>
				<li>image cut size (x,y)</li>
				<li>cut size variance</li>
				<li>join tolerance</li>
				<li>seed position (x,y,position)</li>
				<li>isn't this a lot like granular synthesis (audio)</li>
			</ul>
		</div>
	`
}
const notes = `
### Simulations
	- N-copter
		- quad copter
		- copter with any given number of rotors
		- real physics for rotors
	- biped - n-ped
		- biped locomotion
		- n-legged locomotion
	- wheeled vehicles kenematics
		- [pros-and-cons-for-different-types-of-drive-selection](https://robohub.org/pros-and-cons-for-different-types-of-drive-selection/)
		- differential drive robot
		- ackerman steering (car)
		- holonomic robot
		- ball robot
		- treaded

### Machine Learning
	- when should bank account be checked? (predict likliehood of change)

### Reinforcement Learning
	- wtf happened in my college class on this?

### Control Theory
	- PID tuning
	- wtf happened in my college class on this?

### Signal Processing
	- Kalman filter
		- [kalmanjs](https://github.com/wouterbulten/kalmanjs)
		- [Kalman.js](https://github.com/infusion/Kalman.js/)
	- sensor fusion
		- [wtf is sensor fusion](https://towardsdatascience.com/wtf-is-sensor-fusion-part-2-the-good-old-kalman-filter-3642f321440)

### Image Processing | Manipulation | Creation
	- object detection
	- background removal
	- chop and remix and shuffle an image
	- basic operations I want to do all the time
		- crop
		- paste and add text or speech bubble
		- graph of nodes with connections
		- slideshows
		- scan multiple pages into a pdf document
	- procedural art

### Game Helpers
	- Line Rangers
		- whats the best ranger to upgrade?
		- how often do certain rewards drop?
		- is it worth it to purchase something?
		- what is the best gear to place on ranger?

### Math (see mathematics.js)
	- convolution - [intuitive convolution](https://betterexplained.com/articles/intuitive-convolution/)
	- z-transform
	- eigenvalues
	- fourier transform

### Bookmarks | Read Later | Wish List | Todo
	- all of this in one place
	- can be searched easily
	- can be globbed together
	- can be shared
	- will remind me to come back to it

`.replace(/	/g, '  ');

const deps = [
	'../shared.styl',
	'https://unpkg.com/marked@0.3.6/marked.min.js'
];

const styles = `
	<style>
		li { line-height: 1.3em; }
		h1,h2,h3,h4,h5 { color: #888; }
		a { color: #3090b0; text-decoration: none; }
		a:hover { text-decoration: underline; }
	</style>
`;

(async () => {
	await appendUrls(deps);
	document.body.append(htmlToElement(styles))
	const notesEl = htmlToElement(`
		<div class="block info">${marked(notes)}</div>
	`);
	document.body.append(notesEl);
})()


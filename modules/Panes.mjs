/*


https://iamakulov.com/notes/resize-scroll/


*/

function saveAllPositions(op){
	// explorer
	//   ----   left/right << --- pixels
	// editor
	//   ----   left/right << --- percentage
	// terminal

	try {
		if(op === 'resize' && restoreAllPositions()){
			return;
		}

		const seperator1 = document.getElementById("seperator1");
		const seperator2 = document.getElementById("seperator2");

		const windowWidth = document.documentElement.clientWidth;
		const nearest100 = Math.round(windowWidth / 100) * 100;

		sessionStorage.setItem(`panes-${nearest100}`, [
			seperator1.style.left.replace('px', ''),
			seperator2.style.left.replace('%', '')
		].join(','));
	} catch(e){
		console.error(e);
	}
}

function restoreAllPositions(){
		try {
		const windowWidth = document.documentElement.clientWidth;
		const nearest100 = Math.round(windowWidth / 100) * 100;
		const storedPanePositions = sessionStorage.getItem(`panes-${nearest100}`);
		if(!storedPanePositions){
			return false;
		}
		const [sep1, sep2] = storedPanePositions.split(',');
		if(!sep1 || !sep2){
			return false;
		}
		const explorerPane = document.getElementById("explorer");
		const explorerCover = document.getElementById("explorer-cover");

		const editorPane = document.getElementById("editor");
		const editorCover = document.getElementById("editor-cover");

		const terminalPane = document.getElementById("terminal");
		const terminalCover = document.getElementById("terminal-cover");

		const seperator1 = document.getElementById("seperator1");
		const seperator2 = document.getElementById("seperator2");

		explorerPane.style.right = windowWidth - sep1 + 'px';
		explorerCover.style.right = windowWidth - sep1 + 'px';
		seperator1.style.left = sep1 + 'px';
		editorPane.style.left = sep1 + 'px';
		editorCover.style.left = sep1 + 'px';

		editorPane.style.right = 100 - sep2 + '%';
		editorCover.style.right = 100 - sep2 + '%';
		seperator2.style.left = sep2 + '%';
		terminalPane.style.left = sep2 + '%';
		terminalCover.style.left = sep2 + '%';
		return true;
	}catch(e){
		console.error(e);
	}
}

// function is used for dragging and moving
function dragElement(element, direction, handler, first, second, firstUnder, secondUnder, all) {

	//const firstRightX = document.documentElement.clientWidth * second.style.left.replace("%", "");
	// const secondWidthX = second.style.width.replace("px", "");

	//first.style.right = 100 * firstRightX / document.documentElement.clientWidth + "%";
	//second.style.right = 100 * (firstRightX - secondWidthX) / document.documentElement.clientWidth + "%";


	first.style.width = "";
	second.style.width = "";

	let firstEdge = first.style.left;
	let secondEdge = second.style.left;
	let thirdEdge = second.style.right;

	// Two variables for tracking positions of the cursor
	const drag = { x: 0, y: 0 };
	const delta = { x: 0, y: 0 };

	/* if present, the handler is where you move the DIV from
		 otherwise, move the DIV from anywhere inside the DIV */
	if (window.PointerEvent) {
		handler
			? (handler.onpointerdown = dragMouseDown)
			: (element.onpointerdown = dragMouseDown);
	} else {
		handler
			? (handler.onmousedown = dragMouseDown)
			: (element.onmousedown = dragMouseDown);
	}

	// function that will be called whenever the down event of the mouse is raised
	let dragging;
	function dragMouseDown(e) {
		if(dragging){
			return false;
		}
		dragging = true;
		//all.forEach(e => e.classList.add('blur'));

		//console.log("dragMouseDown");
		first.style.minWidth = "";
		second.style.minWidth = "";

		all.forEach(el => {
			el.style.pointerEvents = "none";
		});

		first.classList.add('active-pane-guide');
		second.classList.add('active-pane-guide');
		first.style.borderRight = "1px solid #555";
		second.style.borderLeft = "1px solid #555";
		// console.log(`Change right border for:`)
		// console.log(first);
		// console.log(`Change left border for:`)
		// console.log(second);

		// drag.x = e.clientX;
		// drag.y = e.clientY;
		const detachListeners = (e) => {
			onMouseUp(e);
			all.forEach(el => {
				el.style.pointerEvents = "initial";
			});
			first.classList.remove('active-pane-guide');
			second.classList.remove('active-pane-guide')
			document.onpointermove = document.onpointerup = null;
			document.onmousemove = document.onmouseup = null;
		}

		if (window.PointerEvent) {
			document.onpointermove = onMouseMove;
			document.onpointerup = detachListeners;
		} else {
			document.onmousemove = onMouseMove;
			document.onmouseup = detachListeners;
		}

		e.preventDefault();
		return false;
	}

	function onMouseUp(e) {
		//all.forEach(e => e.classList.remove('blur'));

		element.style.position = "absolute";
		element.style.left = second.style.left;

		firstUnder.style.position = "absolute";
		firstUnder.style.width = first.style.width;
		firstUnder.style.left = first.style.left;
		firstUnder.style.right = first.style.right;

		secondUnder.style.position = "absolute";
		secondUnder.style.width = second.style.width;
		secondUnder.style.left = second.style.left;
		secondUnder.style.right = second.style.right;

		first.style.borderRight = "";
		second.style.borderLeft = "";


		//convert explorer right edge & editor left edge to pixel values
		const setExplorerRightEdge = () => {
			const explorer = document.getElementById('explorer');
			//NOTE: this is lazy; should probably look at all edges for '%'
			if(!explorer.style.right.includes('%')){
				return;
			}
			const seperator1 = document.getElementById('seperator1');
			const editor = document.getElementById('editor');

			// NOTE: probably doesn't account for zoomed window properly
			const docWidth = document.body.clientWidth;
			const pixelLeftOffset = Number(seperator1.style.left.replace('%','')) * 0.01 * docWidth;

			explorer.style.right = (docWidth - pixelLeftOffset) + 'px';
			seperator1.style.left = pixelLeftOffset + 'px';
			editor.style.left = pixelLeftOffset + 'px';
		};
		setExplorerRightEdge();

		saveAllPositions();

		window.termResize && window.termResize();
		dragging = false;
	}

	let timeout;
	function onMouseMove(e) {

		let currentX = e.clientX;

		// min-width for explorer and snap to zero to completely hide
		if(currentX < 250 && currentX > 150){
			return;
		}
		if(currentX <= 150){
			currentX = 50;
		}

		// If there's a timer, cancel it
		if (timeout) {
			window.cancelAnimationFrame(timeout);
		}

		//TODO: pause codemirror rendering while resizing
		//https://discuss.codemirror.net/t/force-repaint-of-entire-cm-instance/498/2

		// Setup the new requestAnimationFrame()
		timeout = window.requestAnimationFrame(function () {
			//TODO: debounce/change the width of under elements!?!?

			//console.log("onMouseMove");


			// secondEdge = currentX + "px";
			const firstRightPercent = 100 * (1 - (currentX / document.documentElement.clientWidth));
			const secondStyleLeft = 100 * (currentX / document.documentElement.clientWidth);

			//TODO: set min and max sizing bounds
			first.style.right = firstRightPercent + "%";
			second.style.left = secondStyleLeft + "%";

			element.style.position = "absolute";
			element.style.left = second.style.left;

			firstUnder.style.position = "absolute";
			firstUnder.style.width = first.style.width;
			firstUnder.style.left = first.style.left;
			firstUnder.style.right = first.style.right;

			secondUnder.style.position = "absolute";
			secondUnder.style.width = second.style.width;
			secondUnder.style.left = second.style.left;
			secondUnder.style.right = second.style.right;

			//window.termResize()

			timeout = undefined;
		});


		e.preventDefault();
		return false;
	}
}

function onResize(){
	try {
		const explorerPane = document.getElementById("explorer");
		const explorerCover = document.getElementById("explorer-cover");

		const editorPane = document.getElementById("editor");
		const editorCover = document.getElementById("editor-cover");
		const seperator = document.getElementById("seperator1");

		const windowWidth = document.documentElement.clientWidth;
		const handleLeft = Math.floor(
			seperator.style.left.includes('%')
				? 0.01 * windowWidth * Number(seperator.style.left.replace('%', ''))
				: Number(seperator.style.left.replace('px', ''))
		);

		seperator.style.left = handleLeft + 'px';
		editorPane.style.left = handleLeft + 'px';
		editorCover.style.left = handleLeft + 'px';

		const rightOffset = windowWidth - handleLeft;
		explorerPane.style.right = rightOffset + 'px';
		explorerCover.style.right = rightOffset + 'px';

		saveAllPositions('resize');
	} catch(e){
		console.log(e);
	}
}

function attachListeners() {
	const explorerPane = document.getElementById("explorer");
	const explorerCover = document.getElementById("explorer-cover");

	const editorPane = document.getElementById("editor");
	const editorCover = document.getElementById("editor-cover");

	const terminalPane = document.getElementById("terminal");
	const terminalCover = document.getElementById("terminal-cover");

	const allPanes = [
		explorerPane, editorPane, terminalPane
	];

	dragElement(
		document.getElementById("seperator1"),
		"H", null,
		explorerCover,
		editorCover,
		explorerPane,
		editorPane,
		allPanes
	);
	dragElement(
		document.getElementById("seperator2"),
		"H", null,
		editorCover,
		terminalCover,
		editorPane,
		terminalPane,
		allPanes
	);

	window.onresize = onResize;
}

// TODO: resizeStart and resizeEnd events should be triggered so contents can adjust!!
// TODO: should also be listening to window.resize event and adjusting panes!!!
let panes;
function Panes() {
	if (panes) {
		return panes;
	}
	const splitter = document.createElement('div');
	splitter.id = "project-splitter";
	splitter.classList.add('splitter');

	const explorerRight = 100 * (1 - (300 / document.documentElement.clientWidth));

	const editorRight = 40;
	const terminalLeft = 100 - editorRight;

	splitter.innerHTML = `
		<style>
			#cover-container{
				position: absolute;
				left: 0;
				right: 0;
				top: 0;
				bottom: 0;
				z-index: 99999;
				display: flex;
				justify-content: space-evenly;
				pointer-events: none;
			}
			#terminal-cover {
				right: 0 !important;
			}
			div.pane-cover {
				background: transparent;
				height: 100%;
				opacity: 0;
				position: absolute;
				top: 0px;
				bottom: 0px;
				transition: opacity .25s ease-in;
			}
			div.pane-cover.active-pane-guide {
				opacity: 1;
			}
		</style>
		<div id="actionbar"></div>

		<div id="explorer" tabindex="-1" style="position: absolute; left: 50px; right: ${explorerRight}%;"></div>
		<div class="seperator" id="seperator1" style="position: absolute; left: ${100-explorerRight}%;"></div>
		<div id="editor" style="position: absolute; left: ${100-explorerRight}%; right: ${editorRight}%;"></div>
		<div class="seperator" id="seperator2" style="position: absolute; left: ${terminalLeft}%;"></div>
		<div id="terminal" style="position: absolute; left: ${terminalLeft}%; right: 0;"></div>

		<div id="cover-container">
			<div id="actionbar-cover" class="pane-cover" style="background: transparent;"></div>
			<div id="explorer-cover" class="pane-cover" style="position: absolute; left: 50px; right: ${explorerRight}%;"></div>
			<div id="editor-cover" class="pane-cover" style="position: absolute; left: ${100-explorerRight}%; right: ${editorRight}%;"></div>
			<div id="terminal-cover" class="pane-cover"style="position: absolute; left: ${terminalLeft}%; right: 0;"></div>
		</div>

		<div id="services"></div>
	`;

	//TODO: panes should be remembered (and percentages in the first place)

	document.body.appendChild(splitter);

	// const explorer = splitter.querySelector("#explorer");
	// const explorerCover = splitter.querySelector("#explorer-cover")
	// explorerCover.style.left = "50px"; explorer.offsetLeft + "px";
	// explorerCover.style.width = explorer.offsetWidth - 2 + "px";

	// const editor = splitter.querySelector("#editor")
	// const editorCover = splitter.querySelector("#editor-cover");
	// editorCover.style.left = "22%";
	// editorCover.style.right = "38%";

	// const terminal = splitter.querySelector("#terminal");
	// const terminalCover = splitter.querySelector("#terminal-cover")
	// terminalCover.style.left = 50 + explorer.offsetWidth + editor.offsetWidth - 4 + "px";
	// terminalCover.style.width = terminal.offsetWidth + "px";

	onResize();
	attachListeners();
	restoreAllPositions();
}

export default Panes;
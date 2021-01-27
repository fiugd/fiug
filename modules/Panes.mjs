function onload() {
	dragElement(
		document.getElementById("seperator1"),
		"H", null,
		document.getElementById("explorer"),
		document.getElementById("second")
	);
	dragElement(
		document.getElementById("seperator2"),
		"H", null,
		document.getElementById("editor"),
		document.getElementById("terminal")
	);
}

// function is used for dragging and moving
function dragElement(element, direction, handler, first, second) {

	// Two variables for tracking positions of the cursor
	const drag = { x: 0, y: 0 };
	const delta = { x: 0, y: 0 };
  /* if present, the handler is where you move the DIV from
     otherwise, move the DIV from anywhere inside the DIV */
	handler
		? (handler.onmousedown = dragMouseDown)
		: (element.onmousedown = dragMouseDown);

	// function that will be called whenever the down event of the mouse is raised
	function dragMouseDown(e) {
		first.style.minWidth = "";
		second.style.minWidth = "";
		//console.log("dragMouseDown");
		drag.x = e.clientX;
		drag.y = e.clientY;
		document.onmousemove = onMouseMove;
		document.onmouseup = () => {
			document.onmousemove = document.onmouseup = null;
			window.termResize();
		}
		e.preventDefault();
		return false;
	}

	// function that will be called whenever the up event of the mouse is raised
	function onMouseMove(e) {
		//console.log("onMouseMove");

		const currentX = e.clientX;
		const currentY = e.clientY;

		delta.x = currentX - drag.x;
		delta.y = currentY - drag.y;

		const offsetLeft = element.offsetLeft;


		let firstWidth = first.offsetWidth;
		let secondWidth = second.offsetWidth;

		if (direction === "H") {
			element.style.left = offsetLeft + delta.x + "px";
			firstWidth += delta.x;
			secondWidth -= delta.x;
		}
		drag.x = currentX;
		drag.y = currentY;
		first.style.width = firstWidth + "px";
		second.style.width = secondWidth + "px";
		// e.preventDefault();
		// return false;
	}
}

function Panes() {
	const splitter = document.createElement('div');
	splitter.id = "project-splitter";
	splitter.classList.add('splitter');
	splitter.innerHTML = `
		<div id="actionbar"></div>
		<div id="explorer"></div>
		<div class="seperator" id="seperator1"></div>
		<div id="second">
			<div id="editor"></div>
			<div class="seperator" id="seperator2"></div>
			<div id="terminal"></div>
		</div>
		<div id="services">
		</div>
	`;
	document.body.appendChild(splitter);
	onload()
}

export default Panes;
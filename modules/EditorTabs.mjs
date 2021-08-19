import { attachListener } from "./editorTabsEvents.mjs";
import ext from "/shared/icons/seti/ext.json.mjs";

let triggers;

function log() {
	return console.log.call(
		null,
		arguments.map((x) => JSON.stringify(x, null, 2))
	);
}

function scrollToChild(child) {
	window.parent = child.parentNode;
	const parentWindowMin = parent.scrollLeft;
	const parentWindowMax = parent.scrollLeft + parent.clientWidth;
	const parentMaxScrollLeft = parent.scrollWidth - parent.clientWidth;

	const childMin = child.offsetLeft;
	const childMax = child.offsetLeft + child.clientWidth;
	const childCenter = (childMin + childMax) / 2;
	const idealScrollLeft = childCenter - parent.clientWidth / 2;

	const idealScrollMin =
		childMax > parentWindowMin && childMin < parentWindowMin
			? parent.scrollLeft - (parentWindowMin - childMin) - 20
			: undefined;

	const idealScrollMax =
		childMax > parentWindowMax && childMin < parentWindowMax
			? parent.scrollLeft + (childMax - parentWindowMax) + 20
			: undefined;

	// console.log({
	// 	childMin, childMax, parentWindowMin, parentWindowMax, parentMaxScrollLeft
	// });

	if (childMin === 0) {
		//parent.scrollLeft = 0;
		parent.scrollTo({
			top: 0,
			left: 0,
			behavior: "smooth",
		});
		return;
	}

	if (childMax === parent.scrollWidth) {
		//parent.scrollLeft = parentMaxScrollLeft;
		parent.scrollTo({
			top: 0,
			left: parentMaxScrollLeft,
			behavior: "smooth",
		});
		return;
	}

	const childVisible =
		childMin >= parentWindowMin && childMax <= parentWindowMax;

	if (childVisible) return;

	if (idealScrollMin) {
		console.log({ idealScrollMin });
		parent.scrollTo({
			top: 0,
			left: idealScrollMin,
			behavior: "smooth",
		});
		return;
	}

	if (idealScrollMax) {
		console.log({ idealScrollMax });
		parent.scrollTo({
			top: 0,
			left: idealScrollMax,
			behavior: "smooth",
		});
		return;
	}

	// console.log({
	// 	childCenter, idealScrollLeft, parentMaxScrollLeft
	// });

	if (idealScrollLeft <= 0) {
		//parent.scrollLeft = 0;
		parent.scrollTo({
			top: 0,
			left: 0,
			behavior: "smooth",
		});
		return;
	}
	if (idealScrollLeft <= parentMaxScrollLeft) {
		//parent.scrollLeft = idealScrollLeft;
		parent.scrollTo({
			top: 0,
			left: idealScrollLeft,
			behavior: "smooth",
		});
		return;
	}
	//parent.scrollLeft = parentMaxScrollLeft;
	parent.scrollTo({
		top: 0,
		left: parentMaxScrollLeft,
		behavior: "smooth",
	});

	///window.child = child;
	//parent.scrollLeft = child.offsetLeft; // - child.clientWidth/2;
	// console.log({
	// 	left: parent.scrollLeft,
	// 	width: parent.clientWidth,
	// 	scroll: parent.scrollWidth
	// })
}

function getFileType(fileName = "") {
	let type = "default";
	const extension = ((fileName.match(/\.[0-9a-z]+$/i) || [])[0] || "").replace(
		/^\./,
		""
	);

	//console.log(extension)
	if (ext[extension]) {
		type = ext[extension];
	}
	if (extension === "md") {
		type = "info";
	}
	return type;
}

const createTab = (parent, init) => (tabDef) => {
	const tab = document.createElement("div");
	tab.id = tabDef.id;
	tab.classList.add("tab");
	if (!init) {
		tab.classList.add("new");
	} else {
		tab.classList.remove("new");
	}
	tabDef.changed && tab.classList.add("changed");
	tabDef.touched && tab.classList.add("touched");

	const fileType = getFileType(tabDef.name);
	let systemType, systemName, systemClass;
	if (tabDef.name.includes("system::")) {
		systemType = "config";
		systemName = {
			"add-service-folder": "Open Folder",
			"connect-service-provider": "Connect to a Provider",
			"open-previous-service": "Open Previous Service",
			"open-settings-view": "Settings",
		}[tabDef.name.replace("system::", "")];
		systemClass = "italic";
	}
	tab.innerHTML = `
		<span style="pointer-events: none;"
			class="${systemClass ? systemClass + " " : ""}icon-${systemType || fileType}"
		>${systemName || tabDef.name.split('/').pop()}</span>
		<div class="tab-close">
		<div class="monaco-action-bar animated">
			<ul class="actions-container" role="toolbar" aria-label="Tab actions">
				<li class="action-item" role="presentation">
					<a class="action-label icon close-editor-action"
						data-name="${tabDef.name}"
						data-parent="${tabDef.parent||''}"
						role="button"
						title="Close"
					>
					</a>
				</li>
			</ul>
		</div>
	`;
	//	const oldScroll = parent.scrollLeft;
	parent.appendChild(tab);
	//parent.scrollLeft = oldScroll;
	//parent.scrollLeft = parent.scrollWidth;
	//setTimeout(() => scrollToChild(tab), 100);
	scrollToChild(tab);
	if (tabDef.active) {
		tab.classList.add("active");
		tab.classList.remove("new");
	}

	const remainingTabs = Array.from(parent.querySelectorAll(".tab"));
	if (!remainingTabs.length) {
		return;
	}
};

const updateTab = (parent) => (tabDef) => {
	const child = parent.querySelector("#" + tabDef.id);
	if (!child) return;
	if (!tabDef.active && child.classList.contains("active")) {
		child.classList.remove("active");
	}
	if (tabDef.active && !child.classList.contains("active")) {
		child.classList.add("active");
		scrollToChild(child);
	}
	if (tabDef.changed && !child.classList.contains("changed")) {
		child.classList.add("changed");
		scrollToChild(child);
	}
	if (!tabDef.changed && child.classList.contains("changed")) {
		child.classList.remove("changed");
	}

	if (!tabDef.touched && child.classList.contains("touched")) {
		child.classList.remove("touched");
	}
	if (tabDef.touched) {
		child.classList.add("touched");
	}
};

const removeTab = (parent) => async (tabDef) => {
	if(!tabDef) return console.error('attempt to remove tab without a tab definition');

	const child = parent.querySelector("#" + tabDef.id);
	child.parentNode.removeChild(child);

	const remainingTabs = Array.from(parent.querySelectorAll(".tab"));
	if (!remainingTabs.length) {
		return;
	}
	//TODO: scroll parent to put newly active tab in view
};

// const removeTab = (parent) => (tabDef) => {
// 	//console.log(tabDef)
// 	if(tabDef.parentNode){
// 		tabDef.parentNode.removeChild(tabDef);
// 		return;
// 	}
// 	const child = parent.querySelector(tabDef.id);
// 	console.log(child)
// 	child && parent.removeChild(child)
// };

const scrollHorizontally = (el) =>
	function (e) {
		e = window.event || e;
		el.scrollLeft -= e.wheelDelta || -e.detail;
	};

function attachWheel(el) {
	if (!el) return;

	if (el.addEventListener) {
		el.addEventListener("mousewheel", scrollHorizontally(el), {
			passive: true,
		});
		el.addEventListener("DOMMouseScroll", scrollHorizontally(el), {
			passive: true,
		});
	} else {
		el.attachEvent("onmousewheel", scrollHorizontally(el));
	}
}

function attachDoubleClick(el) {
	if (!el) return;
	el.addEventListener("dblclick", (e) => triggers.addFileUntracked(e));
}

const initTabs = (parent) => (tabDefArray = []) => {
	Array.from(parent.querySelectorAll(".tab")).map(removeTab(parent));
	const init = true;
	tabDefArray.map(createTab(parent, init));
	setTimeout(() => {
		const tabs = document.querySelector("#editor-tabs");
		attachWheel(tabs);
		attachDoubleClick(tabs);
		const activeTab = document.querySelector("#editor-tabs-container .active");
		if (activeTab) {
			activeTab.scrollIntoView();
		}
	}, 1000); //TODO: this sucks
};

let tabsContainer;
let tabsList;
function EditorTabs(tabsArray = [{ name: "loading...", active: true }]) {
	if (tabsContainer) {
		//console.log('already exists');
		tabsList = tabsList || tabsContainer.querySelector("#editor-tabs");
		//should not be doing this, rely on event instead!!!
		//tabsArray && initTabs(tabsList)(tabsArray);
		return tabsContainer;
	}
	tabsContainer = document.createElement("div");
	tabsContainer.innerHTML = `
		<style>
			#editor-tabs-container .scrollbar {
				position: absolute;
				width: 575px;
				height: 3px;
				left: 0px;
				bottom: 0px;
				background: transparent;
				right: -3px;
				width: auto;
			}
			#editor-tabs-container .slider {
				position: absolute;
				top: 0px;
				left: 0px;
				height: 3px;
				will-change: transform;
				width: 508px;
			}
			#editor-tabs-container:hover .slider {
				background: #ffffff20;
				display: none;
			}
			#editor-tabs-container .tab:not(.touched):not(.changed) > span {
				font-style: italic;
			}
		</style>
		<div class="scrollable hide-native-scrollbar" id="editor-tabs-container">
			<div id="editor-tabs" class="row no-margin">
			</div>
			<div class="invisible scrollbar horizontal fade">
				<div class="slider">
				</div>
			</div>
		</div>
	`;

	tabsList = tabsList || tabsContainer.querySelector("#editor-tabs");

	/*

	TODO:
	when tabs change, update the width of slider

	when editor tabs scroll position changes, move the slider with it

	when this is done, change from display: none

	ALSO:
	there is something very screwed up happening with tab bar
	for example, when I try to add padding or margin to left/right of tabs, left works and right fails
	I have tried mulitple ways of fixing this, including first-child/last-child and wrapping in a container div
	nothing seems to work and I don't have time for the frustration right now

	one idea I have not tried is to put padding divs to the left and right of tabs list; maybe later
	*/

	triggers = attachListener(tabsContainer, {
		initTabs: initTabs(tabsList),
		createTab: createTab(tabsList),
		updateTab: updateTab(tabsList),
		removeTab: removeTab(tabsList),
	});

	//'modal-menu-show'

	//should not be doing this, rely on event instead!!!
	//tabsArray && initTabs(tabsList)(tabsArray);

	return tabsContainer;
}

export default EditorTabs;

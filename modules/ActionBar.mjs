import { attach, attachTrigger as connectTrigger } from "./Listeners.mjs";

let actionBar;
function ActionBar() {
	if (actionBar) {
		return;
	}
	actionBar = document.getElementById("actionbar");
	// actionBar.style = "flex: 1; display: flex; flex-direction: column;"
	actionBar.innerHTML = `
	<style>
		#project-splitter #actionbar {
			flex: 1;
			display: flex;
			flex-direction: column;
			width: 50px;
			min-width: 50px;
			max-width: 50px;
			justify-content: space-between;
			padding: 10px 0px;
			background-color: var(--main-theme-background-color);
			height: 100%;
			z-index: 999999;
		}
		#actionbar a {
			display: flex;
			overflow: hidden;
			height: 40px;
			line-height: 40px;
			margin-right: 0;
			padding: 0px 0 0 50px;
			-webkit-mask: url();
			color: var(--main-theme-text-color);
		}
		#actionbar ul {
			margin: 0;
		}
		#actionbar li.hidden { display: none; }
		#actionbar li {
			display: block;
			position: relative;
			padding: 5px 0;
			opacity: 1;
			text-align: center;
			user-select: none;
		}
		#actionbar li i {
			font-size: 28px;
		}
		#actionbar a:before {
			content: '■';
			font-size: 62px;
			position: relative;
			left: -45px;
		}
		#actionbar li:not(.checked) {
			opacity: 0.4;
		}
		#actionbar li:not(.checked):hover {
			opacity: 1;
		}
		#actionbar li.explorer a {
			mask: url("data:image/svg+xml;charset=utf-8,%3Csvg fill='none' height='28' viewBox='0 0 28 28' width='28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14.965 7H6.049S4 7.078 4 9v15s0 2 2.049 2l11.267-.004C19.364 26 19.364 24 19.364 24V12.509zm-1.746 2v5h4.097v10H6.049V9zm5.642-6h-8.699s-2.065.016-2.08 2h8.21v.454L20.317 10h1.095v12c2.048 0 2.048-1.995 2.048-1.995V8.648z' fill='%23fff'/%3E%3C/svg%3E") no-repeat 50% 50%;
			-webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg fill='none' height='28' viewBox='0 0 28 28' width='28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14.965 7H6.049S4 7.078 4 9v15s0 2 2.049 2l11.267-.004C19.364 26 19.364 24 19.364 24V12.509zm-1.746 2v5h4.097v10H6.049V9zm5.642-6h-8.699s-2.065.016-2.08 2h8.21v.454L20.317 10h1.095v12c2.048 0 2.048-1.995 2.048-1.995V8.648z' fill='%23fff'/%3E%3C/svg%3E") no-repeat 50% 50%;
		}
		#actionbar li.search a {
			-webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg fill='none' height='28' viewBox='0 0 28 28' width='28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17.125 2c-4.913 0-8.897 3.985-8.897 8.899 0 1.807.547 3.48 1.47 4.885 0 0-5.562 5.535-7.206 7.206-1.644 1.67 1.016 4.13 2.64 2.444 1.626-1.683 7.109-7.107 7.109-7.107a8.853 8.853 0 0 0 4.884 1.471c4.916 0 8.9-3.987 8.9-8.899 0-4.915-3.984-8.899-8.9-8.899zm0 15.254a6.356 6.356 0 1 1 0-12.711 6.355 6.355 0 1 1 0 12.711z' fill='%23fff'/%3E%3C/svg%3E") no-repeat 50% 50%
		}
		#actionbar li.settings a {
			-webkit-mask: url("data:image/svg+xml;charset=utf-8,%3Csvg fill='none' height='28' viewBox='0 0 28 28' width='28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.662 16.39L25 15.834v-3.666l-3.333-.557a8.05 8.05 0 0 0-.556-1.342l1.964-2.75-2.593-2.592-2.753 1.965c-.215-.113-.412-.25-.641-.344-.23-.094-.472-.136-.698-.209L15.834 3h-3.666l-.557 3.333c-.463.145-.912.33-1.342.556L7.52 4.925 4.927 7.518l1.965 2.753c-.113.215-.25.412-.344.641-.094.23-.136.472-.209.698L3 12.166v3.666l3.333.557c.145.463.33.912.556 1.342l-1.964 2.75 2.593 2.592 2.753-1.967c.215.113.412.25.641.346.23.096.472.136.698.209L12.166 25h3.666l.557-3.333a8.05 8.05 0 0 0 1.342-.556l2.75 1.964 2.592-2.593-1.967-2.753c.113-.215.25-.413.344-.643.094-.23.14-.463.212-.696zM14 17.476a3.477 3.477 0 1 1 0-6.953 3.477 3.477 0 0 1 0 6.953z' fill='%23fff'/%3E%3C/svg%3E") no-repeat 50% 50%;
		}
		#actionbar li.full-screen a {
			-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='28' viewBox='0 0 24 24' width='28'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'/%3E%3C/svg%3E") no-repeat 50% 50%;
		}
		#actionbar li.full-screen-exit a {
			-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='28' viewBox='0 0 24 24' width='28'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z'/%3E%3C/svg%3E") no-repeat 50% 50%;
		}
	</style>
	${
		/*
		queue_music, play_arrow, device_hub, headset, speaker, cloud, play_arrow
	*/ ""
	}
	<div class="action-bar-top">
		<ul role="toolbar" class="">
				<li class="explorer checked" role="button" title="Code">
					<i class="material-icons">code</i>
				</li>
				<li class="search" role="button" title="Search">
					<i class="material-icons">search</i>
				</li>
				<!-- <li class="services" role="button" title="Services">
					<i class="material-icons">device_hub</i>
				</li> -->
				<!-- li class="services" role="button" title="">
					<i class="material-icons">queue_music</i>
				</li -->
		</ul>
	</div>

	<div class="action-bar-bottom">
		<ul role="toolbar" class="">
				<li class="full-screen-exit hidden" role="button">
					<a></a>
				</li>
				<li class="full-screen" role="button">
					<a></a>
				</li>
				<!--
				<li id="open-settings-view" class="settings" role="button">
					<i class="material-icons">settings</i>
				</li>
				-->
			</ul>
	</div>
	`;
	actionBar.querySelector(".full-screen").addEventListener("click", () => {
		actionBar.querySelector(".full-screen").classList.add("hidden");
		actionBar.querySelector(".full-screen-exit").classList.remove("hidden");
		document.documentElement.requestFullscreen();
	});

	actionBar.querySelector(".full-screen-exit").addEventListener("click", () => {
		actionBar.querySelector(".full-screen").classList.remove("hidden");
		actionBar.querySelector(".full-screen-exit").classList.add("hidden");
		document.exitFullscreen();
	});

	const triggers = [
		{
			query: "li.explorer",
			action: "showServiceCode",
		},
		{
			query: "li.search",
			action: "showSearch",
		},
		/*
		{
			query: "li.services",
			action: "showServicesMap",
		},
		*/
	];

	triggers.forEach((trigger) => {
		connectTrigger({
			name: "ActionBar",
			eventName: trigger.action,
			data: (e) => {
				const target =
					e.target.tagName === "I" ? e.target.parentNode : e.target;
				actionBar.querySelector(".checked").classList.remove("checked");
				target.classList.add("checked");
				return;
			},
			filter: (e) =>
				actionBar.contains(e.target) &&
				["LI", "I"].includes(e.target.tagName) &&
				(e.target.parentNode.className.includes(
					trigger.query.replace("li.", "")
				) ||
					e.target.className.includes(trigger.query.replace("li.", ""))),
		});
	});

	/*
	connectTrigger({
		name: "ActionBar",
		eventName: "open-settings-view",
		filter: (e) =>
			actionBar.contains(e.target) &&
			["LI", "I"].includes(e.target.tagName) &&
			(e.target.parentNode.id === "open-settings-view" ||
				e.target.id === "open-settings-view"),
	});
	*/

	attach({
		name: "ActionBar",
		eventName: "ui",
		listener: (event) => {
			const { detail = {} } = event;
			const { operation } = detail;
			if (operation !== "searchProject") {
				return;
			}
			actionBar.querySelector(".checked").classList.remove("checked");
			actionBar.querySelector("li.search").classList.add("checked");
		},
	});

}

export default ActionBar;

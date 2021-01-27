import Loading from '../../shared/modules/loading.mjs';

let config = {};

const userMenu = `
	<li class="hide-on-large-only user-sidebar">
	<div class="user-view">
			<div class="background">
					<!-- http://png-pixel.com/ -->
					<img style="width: 100%; height: 100%"
							src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88R8AAtUB6S/lfiQAAAAASUVORK5CYII=">
			</div>
			<a href="#user"><img class="circle"
							src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNcsHz5fwAGzALvecGDrgAAAABJRU5ErkJggg=="></a>
			<a href="#name"><span class="name">User Name</span></a>
			<a href="#email"><span class="email">username@gmail.com</span></a>
	</div>
	</li>
`;

const brandLogo = (title, icon) => `
	<li class="hide-on-med-and-down">
		<a href="#" class="brand-logo" style="
			display: flex;
			align-items: center;
		">
			${icon
					? `<img src="${icon}" height="20" style="
							padding-right: 8px;
						"/>`
					: ''
			}
			${title}
		</a>
	</li>
`;

const subHeader = (title) => `
	<li><a class="subheader">${title}</a></li>
`;

const menuItem = ({ href, onclick, icon, text }) => `
	<li>
		<a data-target="modal1"
			class="waves-effect sidenav-close modal-trigger"
			${href ? 'href="' + href + '"' : ''}
			${onclick ? 'onclick="' + onclick + '"' : ''}
		>
			<i class="material-icons">${icon}</i>${text}
		</a>
	</li>
`;

const defaultMenuItems = {
	"Actions": [{
			text: "Toggle Dark",
			onclick: "window.Theme.toggleDark()",
			icon: "settings_brightness"
		}, {
			text: "Open Fullscreen",
			onclick: "window.App.openFullscreen(event)",
			icon: "fullscreen"
		}, {
			text: "Exit Fullscreen",
			onclick: "window.App.closeFullscreen(event)",
			icon: "fullscreen_exit"
		}, {
			text: "Show Console",
			onclick: "window.App.console.show(event)",
			icon: "view_agenda"
		}, {
			text: "Hide Console",
			onclick: "window.App.console.hide(event)",
			icon: "view_agenda"
	}],
	"Other Apps": [
		{
			text: "Assistant",
			href: "https://assistant.crosshj.com",
			icon: "assistant"
		}, {
			text: "Broken Clock",
			href: "https://crosshj.com/experiments/brokenClock",
			icon: "av_timer"
		}, {
			text: "Template App",
			href: "https://crosshj.com/experiments/template-app",
			icon: "filter_none"
		}, {
			text: "Traffic Sim",
			href: "https://crosshj.com/experiments/traffic",
			icon: "traffic"
		}, {
			text: "pixi.js",
			href: "https://crosshj.com/experiments/pixi",
			icon: "games"
		}, {
			text: "bartok",
			href: "https://crosshj.com/experiments/bartok",
			icon: "account_balance"
		}
	]
};

function sideMenu({ menu = {} } = {}) {
	let menuString = '';

	menuString += '<ul id="slide-out" class="sidenav sidenav-fixed">';
	menuString += userMenu;
	menuString += brandLogo(config.title || 'template', config.icon);

	const preserveOrder = Object.keys(menu).reduce((all, one) => {
		all[one] = null;
		return all;
	}, {});

	let combinedMenu = { ...preserveOrder, ...defaultMenuItems, ...menu };
	// if menu prop overwrote default, do something about it

	Object.keys(combinedMenu).forEach(key => {
		menuString += subHeader(key);
		Object.keys(combinedMenu[key]).forEach(subKey => {
			const subMenuConfig = combinedMenu[key][subKey];
			//console.log(subMenuConfig, config.title);
			if(subMenuConfig.href && subMenuConfig.text === config.title){
			} else {
				menuString += menuItem(subMenuConfig);
			}

		});
	});

	menuString += '</ul>';
	return menuString;
}

function getHtml(callback) {
	fetch('./app.html')
		.then(r => r.text())
		.then(htmlText => {
			let domText = '';
			if(!htmlText.includes('id="slide-out"')){
				domText += sideMenu(config);
			}
			domText += htmlText;
			domText = domText
				.replace(/{{title}}/g, config.title || 'template')
				.replace(/{{icon}}/g, config.icon || '');
			document.body.innerHTML += domText;
			callback();
		})
}

function AppDom(callback) {
	document.title = config.title || document.title;
	Loading((loadingError, loading) => {
		getHtml((domError, dom) => {
			callback(null, {
				loading, dom,
				error: {
					loading: loadingError,
					dom: domError
				}
			});
		});
	});
}

AppDom.config = (_config) => {
	config = _config;
};

export default AppDom;

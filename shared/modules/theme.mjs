// https://www.w3.org/wiki/Dynamic_style_-_manipulating_CSS_with_JavaScript

const safeFn = (fn, fallback) => {
	try{
		return fn();
	} catch(e) {
		return fallback;
	}
};

function addStyle(styles, { id }) {

	/* Create style element */
	var css = document.createElement('style');
	css.type = 'text/css';
	if(id){
		css.id = id;
	}

	if (css.styleSheet)
			css.styleSheet.cssText = styles;
	else
			css.appendChild(document.createTextNode(styles));

	/* Append style to the head element */
	document.getElementsByTagName("head")[0].appendChild(css);
	return css;
}

var metaThemeColorEl = document.querySelector("meta[name=theme-color]");

const lightColor = safeFn(() =>
	document.querySelector("meta[name=light-theme-color]").content,
	metaThemeColorEl.content || 'white'
);
const darkColor = safeFn(() =>
	document.querySelector("meta[name=dark-theme-color]").content,
	metaThemeColorEl.content || '#363238'
);

function changeStyleVariable(name, value){
    document.documentElement.style.setProperty('--' + name, value);
}

const themeCSS = `
	ul#slide-out {
		background-color: var(--main-theme-background-color);
		filter: brightness(0.80) contrast(1.2);
	}
	:root.dark-enabled ul#slide-out {
		background-color: var(--main-theme-background-color);
		filter: brightness(0.95) contrast(1.3);
	}

	.user-sidebar a,
	#slide-out.sidenav li>a,
	#slide-out.sidenav li>a>i.material-icons,
	#slide-out.sidenav .subheader {
		color: var(--main-theme-text-color);
		opacity: 0.5;
	}
	.user-sidebar a:hover,
	#slide-out.sidenav li>a:hover,
	#slide-out.sidenav li>a>i.material-icons:hover,
	#slide-out.sidenav .subheader:hover {
		opacity: 1;
	}
	#slide-out.sidenav .brand-logo {
		opacity: 1;
	}
	a {
		color: var(--main-theme-highlight-color);
	}
	#slide-out.sidenav .user-sidebar {
		min-height: 165px;
	}
`;

function setThemeCSS(){
	const id = 'theme-base-css';
	addStyle(themeCSS, { id })
}

function toggleDark(){
    var _themeColor;
    const darkEnabled = window.localStorage.getItem('themeDark') === "true";
    window.localStorage.setItem('themeDark', !darkEnabled);
    const loadingScreenEl = document.getElementById('loading-screen');
    if(loadingScreenEl){

        loadingScreenEl.classList.remove('hidden');
        document.body.style.overflow = "hidden";
        loadingScreenEl.style.background = !darkEnabled
            ? document.querySelector("meta[name=dark-theme-color]").content || "#363238"
            : "white";
        //loadingScreenEl.style.color = "white";
        //loadingScreenEl.style.fill = "white";
    }

    setTimeout(() => {
        if(!darkEnabled){
            window.Editor && window.Editor.setOption("theme", "vscode-dark");
            window.Editor && window.Editor.setOption("mode", "javascript");
            document.body.style.backgroundColor = document.querySelector("meta[name=dark-theme-color]").content || "#363238";
            document.querySelector(":root").classList.add("dark-enabled");
            _themeColor = darkColor;
        } else {
            window.Editor && window.Editor.setOption("theme", "default");
            document.body.style.backgroundColor = "white";
            document.querySelector(":root").classList.remove("dark-enabled");
            _themeColor = lightColor;
        }
        metaThemeColorEl.setAttribute("content", _themeColor);

        setTimeout(() => {
            document.body.style.overflow = "auto";
            if(loadingScreenEl){
                loadingScreenEl.classList.add('hidden');
                loadingScreenEl.style.background = undefined;
                //loadingScreenEl.style.color = undefined;
                //loadingScreenEl.style.fill = undefined;
            }
        }, 1000);

    }, 500);

}

function theme({
    themeColor
} = {}){
    var _themeColor;

    //const preferDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    //TODO: use this if themeDark is undefined ^^^
    const darkEnabled = window.localStorage.getItem('themeDark') === "true";

    if(darkEnabled){
        window.Editor && window.Editor.setOption("theme", "vscode-dark");
        document.body.style.backgroundColor = (document.querySelector("meta[name=dark-page-color]")||{}).content || "#363238";
        document.querySelector(":root").classList.add("dark-enabled");
        _themeColor = darkColor;
    } else {
        document.body.style.backgroundColor = (document.querySelector("meta[name=light-page-color]")||{}).content || "white";
        window.Editor && window.Editor.setOption("theme", "default");
        _themeColor = lightColor;
    }

    metaThemeColorEl.setAttribute("content", _themeColor);
    //console.log(`--- main color should be: ${_themeColor}`);
    //changeStyleVariable('main-theme-color', mainColor);

    setThemeCSS();

    return {
        toggleDark
    }
}

export default theme;

const loadingStyle = `
body.loading {
    overflow: hidden;
}

#loading-screen.hidden {
    display: none;
}

@keyframes rotate {
    from {
        transform: rotateZ(0deg)
    }

    to {
        transform: rotateZ(360deg)
    }
}

#loading-screen svg.spinner {
    /* background-color: red; */
    transform-origin: center;
    animation: rotate 1s infinite linear;
}

#loading-screen {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: {{BACKGROUND_COLOR}};
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: #03A9F4;
    fill: #00BCD4;
    padding-bottom: 200px;
    transition: background-color 0.4s, color 0.4s, fill 0.4s;
}

#loading-screen p {
    margin-left: 5px;
    font-size: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}

#loading-screen svg.spinner {
    width: 130px;
    height: 130px;
    filter: blur(0.5px);
}

#loading-screen svg.spinner path {
    fill: inherit;
}
`;

const loadingDiv = `
<div id="loading-screen">
    <svg version="1.1" class="spinner" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="10.2 5.169 20 29.9"
    enable-background="new 0 0 40 40" xml:space="preserve">
    <path opacity="0.2"
        d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946
                s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634
                c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z">
    </path>
    <path
        d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0 C22.32,8.481,24.301,9.057,26.013,10.047z"
        transform="rotate(-17 20 20)">

    </path>
    </svg>
    <p>loading...</p>
</div>
`;

function addStyle(styles) {

    /* Create style element */
    var css = document.createElement('style');
    css.type = 'text/css';

    if (css.styleSheet)
        css.styleSheet.cssText = styles;
    else
        css.appendChild(document.createTextNode(styles));

    /* Append style to the head element */
    document.getElementsByTagName("head")[0].appendChild(css);
    return css;
}

function createLoadingDiv(callback){
    document.body.classList.add('loading');
    const bodyBackgroundColor = document.body.style.backgroundColor || "white";
    const style = addStyle(loadingStyle.replace('{{BACKGROUND_COLOR}}', bodyBackgroundColor));
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.outerHTML = loadingDiv;
    callback(null, {
        el, style
    });
}


export default createLoadingDiv;

import { attachListener } from './events/loader.mjs';

let bar;
function LoaderBar(){
	if(bar){
		return bar;
	}
	bar = document.createElement('div');
	bar.id = "loader-bar";
	bar.style.display = 'none';

	bar.innerHTML = `
		<style>
			#loader-bar {
				display: block;
				position: absolute;
				bottom: 21px;
				left: 0;
				right: 0;
				background: transparent;
				height: 1px;
				z-index: 99;
				overflow: hidden;
			}
			#loader-bar .progress{
				display: block;
				/* background: #00BCD4; */
				height: 2px;
				width: 0%;
				margin: 0px;
				animation-name: grow;
				animation-duration: 1.8s;
				/ * animation-iteration-count: infinite; */
				animation-timing-function: linear;
			}
			@keyframes grow {
				0%   { width: 0%; background-color: #00BCD4; }
				25%  { width: 25%; background-color: limegreen; }
				50%  { width: 50%; background-color: yellow; }
				75%  { width: 75%; background-color: orange; }
				100% { width: 100%; background-color: violet; }
			}
		</style>
		<div class="progress">
		</div>
	`;

	// bad debounce... meh
	let timer;
	const showBar = () => {
		if(timer){
			clearTimeout(timer);
			timer = undefined;
		} else {
			//console.log('show bar');
		}
		bar.style.display = 'block';
	};
	const hideBar = () => {
		timer = setTimeout(() => {
			//console.log('hide bar');
			bar.style.display = 'none';
			timer = undefined;
		}, 2700)
	};
	attachListener({ showBar, hideBar });

	document.body.appendChild(bar);
	return bar;
}

export default LoaderBar;
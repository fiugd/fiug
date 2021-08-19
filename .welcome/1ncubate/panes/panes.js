import * as goldenLayout from 'https://cdn.skypack.dev/golden-layout';

const pre = (x) => document.body.innerHTML += `<div class="pre">${x}</div>`.replace(/^\t\t\t/gm, '');
//pre('goldenLayout:\n'+Object.keys(goldenLayout).join('\n'));

const config = {
	settings: {
		showCloseIcon: true,
		showMaximiseIcon: true,
		showPopoutIcon: true,
		hasHeaders:true,
	},
	dimensions: {
		headerHeight: 30
	},
	content: [{
		type: 'row',
		content: [{
			id: 'explorer',
			type:'component',
			isClosable: false,
			componentName: 'explorer',
			width: 17,
			componentState: { text: 'tree' }
		},{
			type: 'column',
			name: 'editor',
			content: [{
			type: 'stack',
			id: 'editor',
			content: [{
					type:'component',
					isClosable: true,
					componentName: 'h2component',
					title: 'scratch.md',
					componentState: { text: 'scratch.md' }
				}, {
					type:'component',
					isClosable: false,
					componentName: 'h2component',
					title: 'foo.jpg',
					componentState: { text: 'foo.jpg' }
				}, {
					type:'component',
					isClosable: false,
					componentName: 'h2component',
					title: 'funky.mp4',
					componentState: { text: 'funky.mp4' },
				}]
			}]
		},{
			type: 'column',
			name: 'terminal',
			width: 35,
			content: [{
				type: 'column',
				content: [{
					type:'component',
					isClosable: false,
					componentName: 'terminal',
					id: 'terminal1',
					title: 'terminal 1',
					componentState: { text: 'terminal 1' }
				}, {
					type:'component',
					isClosable: false,
					componentName: 'terminal',
					id: 'terminal2',
					title: 'terminal 2',
					componentState: { text: 'terminal 2' }
				}]
			}]
		}]
	}]
};

const createLayout1 = ({ GoldenLayout }) => {
	const root = document.createElement('div');
	root.id="root";
	document.body.appendChild(root);

	var myLayout = new GoldenLayout( config, root );

	myLayout.registerComponent( 'test', () => {})
	myLayout.registerComponent( 'explorer', (container) => {
		container.element.parentNode.innerHTML = `<iframe
			src=".explorer.html"
			class="explorer"
			width="100%" height="100%"
		>explorer</iframe>`
		//debugger
		//container.element.closest('.lm_item').querySelector('.lm_header')
	});
	myLayout.registerComponent( 'h2component', function( container, state ){
		container.element.innerHTML = `
		<div
			class="editor"
		>
			<iframe
				src="../cm-mode-helper/mode-helper.html"

				width="100%" height="100%"
			></iframe>
		</div>
		`;
	});
	myLayout.registerComponent( 'terminal', function( container, state ){
		container.element.parentNode.innerHTML = `
		<div
			class="terminal"
		>
			<iframe
				src="/_/modules/terminal/index.html"
				width="100%" height="100%"
			></iframe>
		</div>
		`;

	});

	/*
	myLayout.on( 'itemCreated', function( item ){
		console.log(item)
		if( ['explorer', 'editor'].includes(item.config.id)){
			item.element.addClass(item.config.id);
		}
		if( ['terminal1', 'terminal2'].includes(item.config.id)){
			item.element.closest('.lm_item').addClass(item.config.id);
		}
	});
	*/

	myLayout.on( 'initialised', function(){
		console.log(
			myLayout.root
				.getAllContentItems()
				.find(x=>x.id === 'explorer')
				//.getArea()
		);
		return
		var noDropStack = myLayout.root.getItemsById( 'no-drop-target' )[ 0 ];
		var originalGetArea = noDropStack._$getArea;
		noDropStack._$getArea = function() {
			var area = originalGetArea.call( noDropStack );
			delete noDropStack._contentAreaDimensions.header;
			return area;
		}; 
	});

	try {
		myLayout.init();
	} catch(e){
		console.trace(e);
	}

	/**/
	window.addEventListener('resize', () => myLayout.setSize(
		root.outerWidth,
		root.outerHeight
	));
	/**/
};

createLayout1(goldenLayout);

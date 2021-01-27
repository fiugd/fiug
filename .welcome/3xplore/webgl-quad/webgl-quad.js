/*
  @author mrdoob / http://mrdoob.com/ <-- from http://threejs.org/editor/

  
  - matlab, quadcopter dynamics - http://andrew.gibiansky.com/blog/physics/quadcopter-dynamics/

  X translateOnAxis - http://math.hws.edu/eck/cs424/notes2013/15_Threejs_Intro.html

  - infinite floor - http://stackoverflow.com/questions/16346063/never-ending-floor-in-three-js-scene

  X camera / light follows quad (look at)

  - better shadows

  - position / rotation stats


 */

window.addEventListener( 'resize', onWindowResize, false );

window.resetQuad = function(copter){
	const { x, y, z } = copter.originalPosition;
	copter.position.set(x, y, z);
	copter.rotation.set(0, 0, 0);
}

var updateQuad = function(copter){
	var FORCE = 1;
	// delay	
	//if (new Date().getMilliseconds() < 900){ return; }
	
	// rotation cause by motor noise
	var randomRadians = (Math.floor(Math.random() * 3) - 1) * Math.PI / 180;
	copter.rotation.x+=randomRadians/5;	

	randomRadians = (Math.floor(Math.random() * 5) - 2) * Math.PI / 180;
	copter.rotation.y+=randomRadians/10;	

	randomRadians = (Math.floor(Math.random() * 3) - 1) * Math.PI / 180;
	copter.rotation.z+=randomRadians/5;	

	// force of rotors summed
	copter.translateOnAxis( new THREE.Vector3(0,1,0).normalize(), FORCE );
	
	// Gravity
	copter.position.y-=FORCE;

	camera.lookAt(quadcopter.position);
	if(light.target){
		light.target.position.x = copter.position.x;
		light.target.position.z = copter.position.z;
		light.target.updateMatrixWorld();
	}
	if(copter.position.y < 0){ 
		resetQuad(copter)
	}
}

var updateCopter = function({ copter, controller, camera, light } = {}){
	if(!copter || !light || !camera) return;
	var FORCE = 1.5;
	const SCALE = 0.1;
	const randR = () => ( [-1,1][Math.random()*2|0] * Math.PI / 180 ) * SCALE;
	
	const { xC=0, yC=0, zC=0, aC } = controller(copter);
	
	// rotation cause by motor noise + controller adjust
	copter.rotation.x += randR() + xC;
	copter.rotation.y += randR() + yC;
	copter.rotation.z += randR() + zC;

	// force of rotors summed
	copter.translateOnAxis( new THREE.Vector3(0,1,0).normalize(), FORCE + aC );
	
	// Gravity
	copter.position.y -= FORCE;
	
	light.position.set(copter.position.x, light.position.y, copter.position.z);
	if(light.target){
		light.target.position.x = copter.position.x;
		light.target.position.z = copter.position.z;
		light.target.updateMatrixWorld();
	}

	//camera.lookAt(copter.position);

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	//render();
}

function Player({ OrbitControls }) {
		var loader = new THREE.ObjectLoader();

		window.camera=null;
		window.scene=null;
		window.renderer=null;

		var scripts = {};
		this.dom = undefined;

		this.width = 500;
		this.height = 500;
	
	

		this.load = function ( json ) {
			renderer = new THREE.WebGLRenderer({
				antialias: true,
				alpha: true
			});
			renderer.setPixelRatio( window.devicePixelRatio );
			if(json.camera){
				camera = loader.parse( json.camera );
			}
			try {
				scene = loader.parse( json.scene );
			}catch(e){}
			try {
				scene = loader.parse( json );
				camera = scene.children[4];
			} catch(e){}
			
			window.quadcopter = scene.getObjectByName( 'quadcopter' )
			window.light = scene.getObjectByName( 'PointLight' )

			// to antialias the shadow
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			renderer.shadowMap.enabled = true;
			//renderer.shadowMapSoft = true;
			//renderer.shadowMapAutoUpdate = true;
			//renderer.shadowMapCullFace = THREE.CullFaceBack;

			const controls = new OrbitControls(camera, renderer.domElement);
			controls.addEventListener( 'change', this.renderer.render.bind(this) );
			controls.target = new THREE.Vector3(0, 0, 0);

			/*
				scene.children.forEach(function(a,b,c){
					console.log(a.name)
					if (a instanceof THREE.Mesh && a.name == "Ground"){
						console.log('ground set to receive shadow')
						a.receiveShadow = true; 
					} 
					if (a instanceof THREE.SpotLight){ 
						window.light = a;
						a.castShadow = true; 
						//debugger;
						a.shadow.camera.fov=100;
						a.shadow.mapSize.width=400;
						a.shadow.mapSize.height=400;

						//use for troubleshooting shadow map camera
						const helper = new THREE.CameraHelper(a.shadow.camera)
						scene.add( helper );
					}
					if (a instanceof THREE.Group){ 
						a.children.forEach(function(item,b,c){
							console.log(item.name)
							if (!(item instanceof THREE.SpotLight)) { 
								item.castShadow = true;
							} 
						});
						a.castShadow = true; 
					}
				});
			*/
			//debugger;

			scripts = {
				keydown: [],
				keyup: [],
				mousedown: [],
				mouseup: [],
				mousemove: [],
				update: []
			};

			for ( var uuid in json.scripts ) {
				var object = scene.getObjectByProperty( 'uuid', uuid, true );
				var sources = json.scripts[ uuid ];
				for ( var i = 0; i < sources.length; i ++ ) {
					var script = sources[ i ];
					var events = ( new Function( 'player', 'scene', 'keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'update', script.source + '\nreturn { keydown: keydown, keyup: keyup, mousedown: mousedown, mouseup: mouseup, mousemove: mousemove, update: update };' ).bind( object ) )( this, scene );

					for ( var name in events ) {
						if ( events[ name ] === undefined ) continue;
						if ( scripts[ name ] === undefined ) {
							console.warn( 'APP.Player: event type not supported (', name, ')' );
							continue;
						}
						scripts[ name ].push( events[ name ].bind( object ) );
					}
				}
			}
			this.dom = renderer.domElement;
		};

		this.setCamera = function ( value ) {
			window.camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();
		};

		this.setSize = function ( width, height ) {
			this.width = width;
			this.height = height;
			//camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();
			window.renderer.setSize( width, height );
		};

		var dispatch = function ( array, event ) {
			for ( var i = 0, l = array.length; i < l; i ++ ) {
				array[ i ]( event );
			}
		};

		var request;
		var animate = function ( time ) {
			updateQuad(quadcopter);
			request = requestAnimationFrame( animate );
			dispatch( scripts.update, { time: time } );
			renderer.render( scene, camera );
		};

		this.play = function () {
			document.addEventListener( 'keydown', onDocumentKeyDown );
			document.addEventListener( 'keyup', onDocumentKeyUp );
			document.addEventListener( 'mousedown', onDocumentMouseDown );
			document.addEventListener( 'mouseup', onDocumentMouseUp );
			document.addEventListener( 'mousemove', onDocumentMouseMove );
			request = requestAnimationFrame( animate );
		};

		this.stop = function () {
			document.removeEventListener( 'keydown', onDocumentKeyDown );
			document.removeEventListener( 'keyup', onDocumentKeyUp );
			document.removeEventListener( 'mousedown', onDocumentMouseDown );
			document.removeEventListener( 'mouseup', onDocumentMouseUp );
			document.removeEventListener( 'mousemove', onDocumentMouseMove );
			cancelAnimationFrame( request );
		};

		var onDocumentKeyDown = function ( event ) {
			dispatch( scripts.keydown, event );
		};

		var onDocumentKeyUp = function ( event ) {
			dispatch( scripts.keyup, event );
		};

		var onDocumentMouseDown = function ( event ) {
			dispatch( scripts.mousedown, event );
		};

		var onDocumentMouseUp = function ( event ) {
			dispatch( scripts.mouseup, event );
		};

		var onDocumentMouseMove = function ( event ) {
			dispatch( scripts.mousemove, event );
		};

	}

class NewPlayer {
	constructor({ OrbitControls }){
		this.OrbitControls = OrbitControls;
	}
	load(scene){
		this.loader = new THREE.ObjectLoader();
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false,
			powerPreference: 'high-performance'
		});
		//this.renderer.setPixelRatio( window.devicePixelRatio );
		try {
			this.scene = this.loader.parse(scene);
			//this.scene.background = new THREE.Color(0x1a1a1a);
			this.camera = this.scene.getObjectByName( 'Camera 1' )
			this.copter = this.scene.getObjectByName('quadcopter')
			this.copter.originalPosition = JSON.parse(JSON.stringify(this.copter.position));
			this.light = this.scene.getObjectByName('Light');
			
			//console.log(JSON.stringify(this.scene.toJSON(), null, 2))
		} catch(e){
			console.log(e)
			console.log('error setting up scene or camera ^^^')
		}
		/*
		this.scene.traverse(function( child ){
			if ( child.isMesh ) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		*/
		
		this.dom = this.renderer.domElement;
		this.onSize();
		
		const controls = new this.OrbitControls(this.camera, this.dom);
		controls.addEventListener('change', (...args) => {
			//TODO: adjust camera far here
			this.renderer.render( this.scene, this.camera );
		});
		controls.target = new THREE.Vector3(0, 0, 0);
		
		window.renderer = this.renderer;
		window.camera = this.camera;
		
		//this.renderer.gammaOutput = true;
		//this.renderer.gammaFactor = 1.2;
		this.renderer.shadowMap.enabled = true;
	}
	onSize(){
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	}
	setSize( width, height ) {
	}
	animate( time ) {
		if(this.copter.position.y < -2.5){ 
			resetQuad(this.copter);
			this.camera.lookAt(this.copter.position);
		} else {
			updateCopter(this);
		}
		this.renderer.render( this.scene, this.camera );
		setTimeout(() => {
			this.request = requestAnimationFrame( this.animate.bind(this) );
		}, 50);
	}
	play({ controller }){
		this.controller = controller;
		//console.log(this.camera.position)
		this.request = requestAnimationFrame( this.animate.bind(this) );
	}
}

var APP = {
	Player: NewPlayer, NewPlayer
};

export { APP };

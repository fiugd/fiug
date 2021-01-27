
function attrsFromLevelType(type){
		return {
				'Very Easy': {
						color: 'green'
				},
				'Easy': {
						color: 'green'
				},
				'Normal': {
						color: 'yellow'
				},
				'Hard': {
						color: 'orange'
				},
				'Very Hard': {
						color: 'orange'
				}
		}[type];
}

// https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

var renderLevelsBound;
function renderLevels(target, model){
		var levelNodes = document.querySelectorAll('Level');
		var levelList = Array.apply([], levelNodes);

		var feathersToSpend = document.querySelector('Situation .field input').value;
		var backupParent;
		var targetType;
		if(target){
				var nearestLevel = target.closest('level');
				targetType = nearestLevel.getAttribute('type')
				backupParent = document.createElement('div');
				backupParent.appendChild(target.parentNode);
		}

		levelList.forEach((node, levIndex) => {
				var props = getProps(node);
				var levelType = props.type;
				var attrs = attrsFromLevelType(levelType);
				node.addEventListener('updateModel',
						function (e) { /* ... */
								console.log(`--- update ${levelType} level node: ${e.data}`);
						},
				false);

				if(target && targetType !== props.type){
						return;
				}

				// TODO: probably better to just replace fields that will change!!
				node.innerHTML = `
						<div class="${attrs.color} cell">
								<svg>
										<use xlink:href="#icon-hex-${attrs.color}"></use>
								</svg>
								<span class="${levelType.length > 6 ? 'limited' : '' }">${levelType}</span>
						</div>
						<fieldsContainer></fieldsContainer>
				`;

				var fieldsContainer = node.querySelector('fieldsContainer');

				var chanceField;
				if(targetType === props.type){
						chanceField = target.parentNode;
				}
				if(!chanceField){
						chanceField = document.createElement('div');
						chanceField.className = 'field chance';
						chanceField.innerHTML = `
								<label class="highlight label">Chance</label>
								<input tabindex=${101} type="number" min="0.010" max="3.000" step="0.001" value="${props.chance}"></input>
						`;
				}

				// var chance500Field = document.createElement('div');
				// chance500Field.className = 'field';
				// chance500Field.innerHTML = `
				//     <input disabled tabindex=${0} value="${(2 * props.chance).toFixed(4)}"></input>
				//     <label>P500</label>
				// `;

				// var chance1000Field = document.createElement('div');
				// chance1000Field.className = 'field';
				// chance1000Field.innerHTML = `
				//     <input disabled tabindex=${0} value="${(3 * props.chance).toFixed(4)}"></input>
				//     <label>P1000</label>
				// `;

				var seperator = document.createElement('div');
				seperator.className = 'seperator';
				var tries = Math.floor(feathersToSpend / props.feathers);
				var feathersField = document.createElement('div');
				feathersField.className = 'field';
				feathersField.innerHTML = `
						<input disabled tabindex=${0} value="${tries}" class="highlight"></input>
						<label>Attempts</label>
						<input disabled tabindex=${0} value="${props.feathers}"></input>
						<label>Cost</label>
				`;

				fieldsContainer.appendChild(chanceField);
				if(target && targetType === props.type){
						target.focus();
				}

				fieldsContainer.appendChild(seperator);
				fieldsContainer.appendChild(feathersField);
				fieldsContainer.appendChild(seperator.cloneNode());

				var updateResults = {};
				['P1', 'P500', 'P1000'].forEach(p => {
						var resultsField = document.createElement('div');
						resultsField.className = 'field';
						var results = model.levels[levIndex].results[p].low + '\u2192' + model.levels[levIndex].results[p].high;
						var average = `\u03bc ${model.levels[levIndex].results[p].average.toFixed(1)}`;
						var stdDev = `\u03c3 ${model.levels[levIndex].results.P1.stdDev.toFixed(2)}`;

						resultsField.innerHTML = `
								${ p ==='P1' ? '<label class="highlight">Results</label>' : ''}
								<input class="results" disabled tabindex=${0} value="${results}"></input>
								<input class="highlight average" disabled tabindex=${0} value="${average}"></input>
								<input class="stdDev" disabled tabindex=${0} value="${stdDev}"></input>
								<label>${p}</label>
						`;
						updateResults[p] = (res) => {
								var vals = {
										results: res.low + ' \u2192 ' + res.high,
										average: `\u03bc ${res.average.toFixed(1)}`,
										stdDev: `\u03c3 ${res.stdDev.toFixed(2)}`
								};

								Object.keys(vals).forEach(f => {
										resultsField.querySelector(`.${f}`).value = vals[f];
								});
						}
						fieldsContainer.appendChild(resultsField);
				});

				const updateLevelResults = (model) => {
						const levelResults = model.levels[0].results;
						['P1', 'P500', 'P1000'].forEach(p =>
								updateResults[p](levelResults[p])
						);
				};

				chanceField.oninput = debounce((e) => {
						node.setAttribute('chance', e.target.value);
						e.target.levelType = levelType;
						renderLevelsBound(e.target, updateLevelResults);
				}, 250);

		});
}

function reseed(it, tries){
		var r = new Array(Number(it)).fill();
		r = r.map(x =>
				new Array(tries).fill()
						.map(y => [Math.random, Math.random,Math.random])
		);
		//console.log(r[0])
		return r;
}

function getProps(node){
		var attrsArray = Array.apply([], node.attributes);
		return attrsArray.reduce((all, one) => {
				all[one.name] = one.value;
				return all;
		}, {});
}

function domToObject(fromNode){
		fromNode=fromNode || document.body;
		var idOrClass = fromNode.id
				? fromNode.id
				: fromNode.classList && fromNode.classList.value;

		var name = idOrClass
				? idOrClass
				: fromNode.nodeName.toLowerCase();

		var props = getProps(fromNode)

		var obj = Object.assign({ name }, props);
		if(typeof fromNode.value !== 'undefined'){
				obj.value = fromNode.value;
		}

		if(name === '#text'){
				obj.value = (fromNode.nodeValue||'').trim();
				if(!obj.value){
						return;
				}
		}
		if([
				'h1', 'h2', 'h3', 'h4', 'h5', 'highlight label', 'label', 'span'
		].includes(name)){
				obj.value = fromNode.innerText;
				return obj;
		}

		if(fromNode.childNodes.length){
				var children = Array.from(fromNode.childNodes).map(domToObject);

				(children || []).forEach(x => {
						if(!x || typeof x === 'undefined' || !x.name){
								return;
						}
						var name = x.name;
						delete x.name;

						if(x.value){
								obj[name] = x.value;
								return
						}

						if(!obj[name]) {
								obj[name] = x;
								return;
						}
						if(Array.isArray(obj[name])){
								obj[name].push(x);
								return;
						}
						obj[name] = [ obj[name], x ];
				});
		}

		return obj;
}

function domToModel(dom){
		if(!dom.notes || !dom.notes.situation || !dom.levellist || !dom.levellist.level){
				return undefined;
		}
		//console.log('worker got dom!');
		var situation= dom.notes.situation;

		var levels = dom.levellist.level;
		var levelModel = {
				attempts: 0,
				cost: 0,
				results: {
						'P1': {
								low: 0,
								high: 0
						},
						'P500': {
								low: 0,
								high: 0
						},
						'P1000': {
								low: 0,
								high: 0
						},
				}
		};
		levels = levels.map(l => {
				var lev = Object.assign({}, levelModel, l)
				lev.cost = lev.feathers;
				delete lev.feathers;

				lev.chance = {
						'P1': Number(lev.chance).toFixed(4),
						'P500': (lev.chance * 2).toFixed(4),
						'P1000': (lev.chance * 3).toFixed(4),
				};
				lev.attempts = Math.floor(situation.feathers/lev.cost);

				lev.results = Object.keys(lev.results).reduce((all, key) => {
						all[key] = {
								low: Number.MAX_VALUE,
								high: 0
						};
						return all;
				}, {});

				return lev;
		});

		var model = {
				levels,
				situation,
				meta: {
						maxTries: levels[0].attempts,
						lowestCost: levels[0].cost,
						highestCost: levels[levels.length-1].cost,
				},
				randomSeed: {
						opts: {},
						values: []
				}
		};

		var iterations = situation.iterations
				? (new Array(Number(situation.iterations)))
						.fill()
				: [];
		iterations.forEach((it, itNum) => {
				const randArray = (new Array(model.meta.maxTries))
						.fill()
						.map(x => [
								Math.random(), Math.random(), Math.random()
						]);

				// counts drops per iteration
				var itResults = new Array(levels.length)
						.fill()
						.map(x => ({
								'P1': 0,
								'P500': 0,
								'P1000': 0
						}));

				//console.log(`iteration #${itNum+1}`);
				//console.log(`random array of length: ${randArray.length}`)
				//logJSON({itResults})

				// each iteration has an array of random numbers up to maxTries
				randArray.forEach((randNum, randIndex) => {

						levels.forEach((lev, levNum) => {
								// no more tries at this level
								if(randIndex >= lev.attempts){
										return;
								}
								//console.log(`One try at level: ${levNum+1}`);


								// check at for win at each pLevel
								if(lev.chance.P1 > randNum[0]){
										itResults[levNum].P1++;
										itResults[levNum].P500++;
										itResults[levNum].P1000++;
								}

								if(lev.chance.P1 > randNum[1]){
										itResults[levNum].P500++;
										itResults[levNum].P1000++;
								}
								if(lev.chance.P1 > randNum[2]){
										itResults[levNum].P1000++;
								}
						});
				});

				// adjust max, min ranger drops on level using itResults
				levels.forEach((lev, levNum) => {
						lev.results.P1.data = lev.results.P1.data || [];
						lev.results.P500.data = lev.results.P500.data || [];
						lev.results.P1000.data = lev.results.P1000.data || [];

						lev.results.P1.data.push(itResults[levNum].P1);
						lev.results.P500.data.push(itResults[levNum].P500);
						lev.results.P1000.data.push(itResults[levNum].P1000);
				});
				//logJSON({itResults})
		});

		const min = arr => arr.sort((a,b) => a - b)[0];
		const max = arr => arr.sort((a,b) => b - a)[0];
		const average = arr => arr.reduce((total, num) => total + num, 0) / arr.length;
		const stdDev = arr => {
				const avg = average(arr);
				const squareDiffs = arr.map(value => (value - avg) * (value - avg));
				const avgSquareDiff = average(squareDiffs);
				const stdDev = Math.sqrt(avgSquareDiff);
				return stdDev;
		}

		levels.forEach((lev, levNum) => {
				['P1', 'P500', 'P1000'].forEach(p => {
						lev.results[p].low = min(lev.results[p].data);
						lev.results[p].high = max(lev.results[p].data);
						lev.results[p].average = average(lev.results[p].data);
						lev.results[p].stdDev = stdDev(lev.results[p].data);

						delete lev.results[p].data;
				});
		});


		//console.log(iterations.length)
		//logJSON(levels[2]);
		//logJSON(model);

		return model;
}


function renderSituation(model){
		const feathers = model.situation.feathers;
		const iterations = model.situation.iterations;

		const situationNode = document.querySelector('Situation');

		situationNode.innerHTML = `
				<h4>Situation</h4>
				<div class="field">
						<div class="field-note">
								<span></span>
						</div>
						<input type"number" value="${feathers}" step=1></input>
						<label>Feathers To Spend</label>
						<button>${iterations} - iterations</button>
				</div>
		`;

		situationNode.querySelector('.field input').oninput =
				debounce((e) => updatePage(e), 250);
		situationNode.querySelector('.field button').onclick =
				debounce((e) => updatePage(e), 250);

		var timer = undefined;
		situationNode.addEventListener('updateModel',
				function (e) {
						if(e.data.note) {
								situationNode.querySelector('.field-note span').innerHTML = e.data.note;
								situationNode.querySelector('.field-note').style.display = 'block';
								if(timer){
										clearTimeout(timer);
								}
								timer = setTimeout(() => {
										situationNode.querySelector('.field-note').style.display = '';
								}, 3000)
						}
				},
		false);
}

function renderLoader(){
		const loader = document.createElement('div');
		loader.id = 'page-loader';
		loader.innerHTML = `
				<svg>
						<use xlink:href="#loader"></use>
				</svg>
				<div class='label'>
						<span>loading...</span>
				</div>
		`;
		document.body.appendChild(loader);
		document.body.classList.add('loading');
}

function hideLoader(){
		document.querySelector('#page-loader .label').classList.add('hidden');
		setTimeout(() => {
				document.getElementById('page-loader').classList.add('hidden');
				document.body.classList.remove('loading');
		}, 1);
}

function showLoader(){
		document.querySelector('#page-loader .label').classList.remove('hidden');
		document.getElementById('page-loader').classList.remove('hidden');
		document.body.classList.add('loading');
}

function clone(o){
		return JSON.parse(JSON.stringify(o));
}

function logJSON(obj){
		console.log(JSON.stringify(obj, null, '\t'));
}

function updatePageModel(event){
		var pageModel = {
				note: 'Sorry, this is out of order!'
		};
		return pageModel;
}

function applyPageModel(model, event){
		// set all values of page elements(except event.target) based on model
		var event = new Event('updateModel');
		event.data = model;
		var situationNode = document.querySelector('Situation');
		situationNode.dispatchEvent(event);
}

function updatePage(event){
		var model = updatePageModel(event);
		applyPageModel(model, event)
}

function WebWorker(fn) {
		const fnString = `(function(){
				onmessage = function(event) {
						const results = ${fn.name}(event.data);
						postMessage(results);
				}

				${fn.toString()}
		})()`;
		const worker = new Worker(URL.createObjectURL(new Blob([fnString])));

		const wrapped = function(args, cb){
				worker.onmessage = function (e){
						cb(e.data);
				}
				worker.postMessage(args);
		};
		wrapped.close = worker.terminate;
		wrapped.worker = worker;

		return wrapped;
}

function setupPage(){
		renderLoader();
		var dom = domToObject(document.querySelector('#content'));

		var domToModelWorker = WebWorker(domToModel);

		domToModelWorker(dom, model => {
				renderSituation(model);
				renderLevels(null, model);

				//applyPageModel(model);
				hideLoader();
		});
		window.domToModelWorker = domToModelWorker;

		renderLevelsBound = (target, callback) => {
				dom = domToObject(document.querySelector('#content'));
				dom.levellist.level = dom.levellist.level.filter(x => x.type === target.levelType);

				domToModelWorker(dom, callback);
		};
}
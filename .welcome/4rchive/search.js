import { appendUrls, addUrls, consoleHelper, htmlToElement, importCSS } from '../.tools/misc.mjs';
import '../shared.styl';
consoleHelper();

/*
- [ ] open a file at a given line and column
- [ ] proper icons for search result files
- [ ] right click on folder in explorer tree to search within folder
- [ ] context menu for searched items
- [ ] fix: saving with search active causes icons in tree to be default icon
- [ ] search initializes in current service directory (or recalls search directory)
- [ ] remember when search was active sidebar item

- [LATER] exclude files/directory
- [LATER] single character search terms (and maybe others) should result in collapsed file results which continue search after expanded
- [LATER] should use paging and inifinite scroll to increase perf on large results

*/

const utils = (() => {
	const unique = arr => Array.from(new Set(arr));
	const htmlEscape = html => [
		[/&/g, '&amp;'], //must be first
		[/</g, '&lt;'],
		[/>/g, '&gt;'],
		[/"/g, '&quot;'],
		[/'/g, '&#039;']
	].reduce((a,o) => a.replace(...o), html);
	const highlight = (term="", str="", limit) => {
		const caseMap = str.split('').map(x => x.toLowerCase() === x ? 'lower' : 'upper');

		const splitstring = str.toLowerCase().split(term.toLowerCase())
		let html = '<span>' + (
			limit === 1
				? splitstring[0] + 
					`</span><span class="highlight">${term.toLowerCase()}</span><span>` +
					splitstring.slice(1).join(term.toLowerCase())
				: splitstring
					.join(`</span><span class="highlight">${term.toLowerCase()}</span><span>`)
		) + '</span>';
		if(limit = 1){
		}
		html = html.split('');

		let intag = false;
		for (let char = 0, i=0; i < html.length; i++) {
			const thisChar = html[i];
			if(thisChar === '<'){
				intag = true;
				continue;
			}
			if(thisChar === '>'){
				intag = false;
				continue;
			}
			if(intag) continue;
			if(caseMap[char] === 'upper'){
				html[i] = html[i].toUpperCase();
			}
			char++;
		}
		return html.join('');
	};
	const debounce = (func, wait, immediate) => {
		var timeout;
		return async function() {
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

	return {
		unique,
		htmlEscape,
		highlight,
		debounce
	};
})();

const SearchBoxHTML = () => {
	const style = `
	<style>
		.highlight { background: #5f3000; }
		.form-container {
			position: absolute;
			top: 40px;
			left: 0;
			right: 0;
			bottom: 0;
			overflow: hidden;
		}
		.search-results {
			padding: 1em;
			padding-bottom: 15em;
			position: absolute;
			bottom: 0;
			top: 180px;
			overflow-y: auto;
			overflow-x: hidden;
			box-sizing: border-box;
			margin: 0;
			left: 15px;
			right: 15px;
			font-size: 0.9em;
		}
		.search-results > li {
			list-style: none;
			margin-bottom: 1em;
		}
		.search-results > li ul > li {
			font-size: .95em;
			list-style: none;
			white-space: nowrap;
			margin-top: 0.3em;
		}
		.search-summary {
			font-size: .85em;
			opacity: 0.7;
		}
		.search-results > li ul {
			padding-left: 1.4em;
		}
		.search-results .foldable {
			cursor: pointer;
		}
		.search-results span.doc-path {
			opacity: .5;
		}
		.search-results .foldable ul { display: none; }
		.search-results .foldable > div span {
			padding-left: 0.4em;
			pointer-events: none;
			user-select: none;
		}
		.search-results .foldable > div:before {
			margin-left: 0px;
			margin-right: 7px;
			content: '>';
			font-family: consolas, monospace;
			display: inline-block;
		}
		.search-results .foldable.open ul { display: block; }
		.search-results .foldable.open > div:before {
			margin-left: 2px;
			margin-right: 5px;
			content: '>';
			transform-origin: 5px 8.5px;
			transform: rotateZ(90deg);
		}
		.field-container label { font-size: .75em; }


		 @font-face {
			font-family: 'seti';
			src: url(/shared/fonts/seti.woff2) format('woff2');
			font-weight: normal;
			font-style: normal;
		}
		.icon-html:before,
		.icon-json:before,
		.icon-info:before {
			font-family: 'seti';
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			font-style: normal;
			font-variant: normal;
			font-weight: normal;
			text-decoration: none;
			text-transform: none;
			width: 22px;
			height: 22px;
			display: inline-block;
			-webkit-font-smoothing: antialiased;
			vertical-align: top;
			flex-shrink: 0;
			font-size: 21px;
			margin-top: -1px;
			margin-left: -7px;
		}
		.icon-info:before {
			content: '\\E048';
			color: #519aba;
		}
		.icon-json:before {
			content: '\\E043';
			color: #e37933;
		}
		.icon-html:before {
			content: '\\E050';
			color: #ff9800;
		}
	</style>
	`;

	const html = `
	<div class="form-container">
		${style}

		<div class="field-container">
			<input type="text" placeholder="Search" class="search-term" spellcheck="false"/>
		</div>

		<div class="field-container">
			<label>include</label>
			<input type="text" class="search-include"/>
		</div>

		<div class="field-container">
			<label>exclude</label>
			<input type="text" class="search-exclude"/>
		</div>

		<div class="field-container">
			<span class="search-summary"></span>
		</div>

		<ul class="search-results"></ul>
	</div>
	`;

	return html;
};

class SearchBox {
	dom

	constructor(){
		const main = htmlToElement(SearchBoxHTML());
		this.dom = {
			main,
			term: main.querySelector('.search-term'),
			include: main.querySelector('.search-include'),
			exclude: main.querySelector('.search-exclude'),
			summary: main.querySelector('.search-summary'),
			results: main.querySelector('.search-results')
		}
		this.attachListeners();
		document.body.appendChild(main);
	}

	attachListeners(){
		const debouncedInputListener = utils.debounce((event) => {
			const term = this.dom.term.value;
			const include = this.dom.include.value;
			const exclude = this.dom.exclude.value;
			this.updateResults([],'');
			this.updateSummary({});
			this.searchStream({ term, include, exclude })
		}, 250, false);
		this.dom.term.addEventListener('input', (e) => {
			this.updateSummary({ loading: true });
			this.updateResults({ loading: true });
			debouncedInputListener(e);
		});
		this.dom.include.addEventListener('input', (e) => {
			this.updateSummary({ loading: true });
			this.updateResults({ loading: true });
			debouncedInputListener(e);
		});
		this.dom.exclude.addEventListener('input', (e) => {
			this.updateSummary({ loading: true });
			this.updateResults({ loading: true });
			debouncedInputListener(e);
		});
		this.dom.results.addEventListener('click', (e) => {
			const handler = {
				'DIV foldable': () => e.target.parentNode.classList.add('open'),
				'DIV foldable open': () => e.target.parentNode.classList.remove('open')
			}[`${e.target.tagName} ${e.target.parentNode.className}`];
			
			if(handler) return handler();
		})
	}

	async searchStream({ term, include, exclude }){
		this.dom.results.innerHTML = '';;
		this.updateSummary({});

		const base = new URL('../../service/search', location.href).href
		const res = (await fetch(`${base}/?term=${term}&include=${include||''}&exclude=${exclude||''}`));
		const reader = res.body.getReader()
		const decoder = new TextDecoder("utf-8");
		const timer = { t1: performance.now() }
		let allMatches = [];
		let malformed;
		this.resultsInDom = false;
		while(true){
			const { done, value } = await reader.read();
			if(done) break;
			let results = decoder.decode(value, { stream: true });
			if(malformed){
				results = malformed.trim() + results.trim();
				malformed = '';
			}
			if(results.trim()[results.trim().length-1] !== '}'){
				results = results.split('\n');
				malformed = results.pop()
				results = results.join('\n');
			}
			results = results.split('\n').filter(x=>!!x);
			this.updateResults(results, allMatches, term);
			this.updateSummary({
				allMatches,
				time: performance.now() - timer.t1,
				searchTerm: term 
			});
		}
	}

	updateTerm(term){ this.dom.term.value = term; }

	updateInclude(path){ this.dom.include.value = path; }

	async updateResults(results, allMatches, term){
		const addFileResultsLineEl = (result) => {
			const limit = 1; //only highlight one occurence
			const listItemEl = (Array.isArray(result) ? result : [result])
				.map((r,i) => `
					<li>
						${utils.highlight(term, utils.htmlEscape(r.text.trim()), limit)}
					</li>
				`);
			return listItemEl;
		};
		const createFileResultsEl = (result, index) => {
			const items = ['html', 'json', 'info'];
			const iconClass = "icon-" + items[Math.floor(Math.random() * items.length)];
			const open = (term.length > 1 || !this.resultsInDom) ? 'open' : '';
			const fileResultsEl = htmlToElement(`
				<li class="foldable ${open}" data-path="${result.file}">
					<div>
						<span class="${iconClass}">${result.docName}</span>
						<span class="doc-path">${result.path}</span>
					</div>
					<ul>${addFileResultsLineEl(result).join('\n')}</ul>
				</li>
			`);
			return fileResultsEl;
		};
		for(var rindex=0; rindex<results.length; rindex++){
			const x = results[rindex];
			try {
				const parsed = JSON.parse(x)
				parsed.docName = parsed.file.split('/').pop();
				parsed.path = parsed.file.replace('/'+parsed.docName, '').replace(/^\.\//, '')
				allMatches.push(parsed)

				window.requestAnimationFrame(() => {
					const existingFileResultsEl = this.dom.results.querySelector(`li[data-path="${parsed.file}"] ul`);
					let newLineItems;
					if(existingFileResultsEl){
						newLineItems = addFileResultsLineEl(parsed);
					}
					if(newLineItems){
						const elementItems = newLineItems.map(htmlToElement);
						existingFileResultsEl.append(...elementItems);
						return;
					}
					const fileResultsEl = createFileResultsEl(parsed, rindex);
					this.dom.results.appendChild(fileResultsEl);
					this.resultsInDom = true;
				});
			} catch(e){
				console.warn(`trouble parsing: ${x}, ${e}`)
			}
		}
	}

	updateSummary({ allMatches, time, searchTerm, loading }){
		if(loading){
			this.dom.summary.innerHTML = '';
			return;
		}
		if(!allMatches || !allMatches.length){
			this.dom.summary.innerHTML = 'No results';
			return;
		}
		const totalFiles = utils.unique(allMatches.map(x=>x.docName))
			.map(x => ({
				filename: x,
				results: []
			}));
		const pluralRes = allMatches.length > 1 ? "s" : ''
		const pluralFile = totalFiles.length > 1 ? "s" : ''
		this.dom.summary.innerHTML = `${allMatches.length} result${pluralRes} in ${totalFiles.length} file${pluralFile}, ${time.toFixed(2)} ms`;
	}
}

(async () => {
	const searchTerm = "fo"+"rc";
	const path = './'

	const searchBox = new SearchBox({});
	searchBox.updateTerm(searchTerm);
	searchBox.updateInclude(path)
	searchBox.searchStream({ term: searchTerm, include: path })
})(); 

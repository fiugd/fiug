const deps =[
	'../shared.styl',
	'../../index.css'
];

const state = {
	merged: [
		{ title: 'assemblyscript.as', wasm: true },
		{ title: 'brainfuck.bf' },
		{ title: 'clojure.cljs' },
		{ title: 'cpp.cpp'},
		{ title: 'forth.fth', wasm: true },
		{ title: 'golang.go' },
		{ title: 'javascript.js' },
		{ title: 'julia.jl', wasm: true },
		{ title: 'lisp.lisp' },
		{ title: 'lua.lua', wasm: true },
		{ title: 'pascal.pas', wasm: true },
		{ title: 'php.php' },
		{ title: 'prolog.pro' },
		{ title: 'python.py' },
		{ title: 'ruby.rb' },
		{ title: 'scheme.scm' },
		{ title: 'sql.sql', wasm: true },
		{ title: 'typescript.ts' },
		{ title: 'wasm.wat', wasm: true }
	],
	maybe: [
		{ title: 'csharp.cs', heat: 8 },
		{ title: 'fsharp.fs', heat: 8 },
		{ title: 'java.java', heat: 3 },
		{ title: 'kotlin.kt', heat: 3 },
		{ title: 'ocaml.ml', heat: 6 },
		{ title: 'perl.pl' },
		{ title: 'raku.raku' }
	],
	meh: [
		{ title: 'ada.adb' },
		{ title: 'crystal.cr' },
		{ title: 'dart.dart', heat: 7 },
		{ title: 'dlang.d' },
		{ title: 'elixir.ex' },
		{ title: 'elm.elm' },
		{ title: 'erlang.erl' },
		{ title: 'haskell.hs' },
		{ title: 'ink.ink', heat: 10 },
		{ title: 'nim.nim' },
		{ title: 'pony.pony' },
		{ title: 'rlang.r' },
		{ title: 'rust.rs' },
		{ title: 'swift.swift' },
		{ title: 'windows.bat' },
		{ title: 'zig.zig' }
	]
};

const others = [
	'basic | vb', 'cobol', 'fortran', 'algol',
	'assembly', 'smalltalk', 'racket', 'octave',
	'autohotkey', 'objective c', 'haxe', 'pyret', 'befunge'
];

(async () => {

	await appendUrls(deps);

	const style = () => { return `
			<style>
				body {
					background: hsl(0 0% 8% / 1);
					height: 100vh;
					padding-left: 1em;
					padding-right: 1em;
				}
				@media (min-width: 1024px) {
					body {
						margin: 0 auto !important;
					}
				}
				#container {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					width: 100%;
					color: #bbb;
					font-size: 1.2em;
					box-sizing: content-box;
					padding-top: 2em;
					padding-bottom: 2em;
					margin-top: -10em;
				}
				.list {
					display: flex;
					flex-direction: column;
				}
				ul {
					list-style: none;
					display: flex;
					flex-direction: column;
					margin: auto;
					padding: 0;
					margin-top: 0;
				}
				li:not(.icon-assemblyscript):not(.icon-pascal):not(.icon-zig):not(.icon-erlang):not(.icon-pony):not(.icon-ada):not(.icon-raku):not(.icon-forth):not(.icon-brainfuck):before {
					margin-top: -4px !important;
				}
				.icon:before { padding-right: 5px !important; }
				li.icon-forth:before { margin-top: 3px !important; }
				li.icon-raku:before { margin-top: 3px !important; }
				li.icon-erlang:before { margin-top: 7px !important; }
				li.icon-ada:before { margin-left: 2px !important; margin-right: -2px !important; }
				li.icon-pascal:before { margin-left: 2.5px !important; margin-right: 2px !important; }
				li.icon-assemblyscript:before { margin-left: -3px !important; margin-right: 2.5px !important; }
				.title, .total {
					text-align: center;
					font-size: 1.25em;
					opacity: .5;
					margin: 0.5em;
					font-family: system-ui;
				}
				.title {
					border-bottom: 1px solid #444;
					width: 175px;
					margin: auto;
					margin-bottom: 0.8em;
					padding-bottom: .3em;
					font-variant: small-caps;
				}
				.total {
					flex: 1;
					font-size: 0.9em;
					border-top: 1px solid #444;
					width: 175px;
					margin: auto;
					margin-top: 1em;
					padding-top: 0.4em;
				}
				#list-merged li,
				#list-maybe li,
				#list-meh li {
					position: relative;
				}
				#list-maybe li:after,
				#list-meh li:after {
					content: '';
					width: 0.7em;
					height: 0.7em;
					border-radius: 50%;
					display: inline-block;
					position: absolute;
					left: -1.3em;
					top: 5px;
				}
				#list-maybe li:after { background: orange; }
				#list-meh li:after { background: #ff0000a6; }

				[data-heat="1"]:after  { opacity: 0.1; }
				[data-heat="2"]:after  { opacity: 0.2; }
				[data-heat="3"]:after  { opacity: 0.3; }
				[data-heat="4"]:after  { opacity: 0.4; }
				[data-heat="5"]:after  { opacity: 0.5; }
				[data-heat="6"]:after  { opacity: 0.6; }
				[data-heat="7"]:after  { opacity: 0.7; }
				[data-heat="8"]:after  { opacity: 0.8; }
				[data-heat="9"]:after  { opacity: 0.9; }
				[data-heat="10"]:after { opacity: 1; }

				#list-merged li.wasm:after {
					content: 'W';
					position: absolute;
					left: -1.3em;
					top: 4px;
					font-size: 0.7em;
				}

				.other-languages {
					color: grey;
					padding: 2em;
					width: 100%;
					margin-top: 2em;
				}
				.other-languages > span {
					width: 100%;
					text-align: center;
					display: block;
					color: #939292;
					font-variant: all-small-caps;
				}
				.other-languages > div {
					display: grid;
					margin-top: 1em;
					grid-template-columns: repeat(4, 1fr);
				}
				.other-languages > div div { margin: auto; margin-top: 0.5em; }
			</style>
	`};

	const app = htmlToElement(`
		<div id="container">
			${style()}
		</div>
	`);
	const extMap = (ext) => {
		const mapped = {
			js: 'javascript',
			jl: 'julia',
			fth: 'forth',
			cljs: 'clojure',
			bf: 'brainfuck',
			as: 'assemblyscript',
			pas: 'pascal',
			pro: 'prolog',
			py: 'python',
			rb: 'ruby',
			scm: 'scheme',
			ts: 'typescript',
			cs: 'csharp',
			fs: 'fsharp',
			kt: 'kotlin',
			ml: 'ocaml',
			pl: 'perl',
			adb: 'ada',
			cr: 'crystal',
			ex: 'elixir',
			erl: 'erlang',
			hs: 'haskell',
			rs: 'rust'
		}[ext];
		if(mapped) return mapped;
		return ext;
	};
	Object.keys(state).forEach(key => {
		const list = state[key];
		const el = htmlToElement(`
			<div id="list-${key}" class="list">
				<span class="title">${key}</span>
				<ul>${
					list.map(listItem => `
						<li
							class="${listItem.wasm?'wasm ':''}icon icon-${extMap(listItem.title.split('.').pop())}"
							data-heat="${listItem.heat||5}">${listItem.title}
						</li>
					`).join('\n')
				}</ul>
				<span class="total">${list.length}</span>
			</div>
		`);
		app.append(el)
	});
	document.body.append(app)

	document.body.append(htmlToElement(`
		<div class="other-languages">
			<span>Other Languages (possible future support):</span>
			<div>
				${others.map(x => `<div>${x}</div>`).join('\n')}
			</div>
		</div>
	`))
})();

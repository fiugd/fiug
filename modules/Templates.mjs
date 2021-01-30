import { attachListeners } from "./templatesEvents.mjs";

const jsxFirst = `
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>htm + preact</title>
		<meta name="description" content="Using rxjs with react in a fluxy (reduxy) and about-as-minimal-as-can-get kind of way">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="mobile-web-app-capable" content="yes">
	</head>

	<style>
		body {
			margin: 0px;
			margin-top: 40px;
			color: white;
			height: calc(100vh - 40px);
			overflow: hidden;
			color: #ccc;
			font-family: sans-serif;
		}
	</style>

	<script type="module">
		import {
			html, Component, render, useState, useCallback, h
		} from '../shared/vendor/preact.standalone.module.js';
		window.Component = Component;
		window.render = render;
		window.useState = useState;
		window.useCallback = useCallback;
		window.React = { createElement: h, createClass: h };
		window.h = h;
	</script>

	<script id="jsxScript" type="text/jsx">
	const React = window.React;
	const Component = window.Component;
	const render = window.render;
	const h = window.h;
	window.createClass = window.h;
	window.createElement = window.h;

	//console.log(window.h);
	`;

const jsxSecond = `
	render(<App />, document.body);
	</script>

	<script>
		const input = document.getElementById('jsxScript').innerText;
		const xfrmScript = document.createElement('script');
		xfrmScript.id = 'jsxScriptXfrm';

		const appendScript = (url, callback) => {
			var script = document.createElement('script');
			script.crossOrigin = "anonymous";
			script.onload = callback;
			script.src = url;
			document.head.appendChild(script);
		};

		const appendBabel = () => {
			const babelUrl = "../shared/vendor/babel.min.js";
			const babelAppendCallback = () => {
				const output = Babel.transform(input, { presets: ['es2015','react'] }).code;
				//console.log('BABELFY!');
				//console.log({ output });
				xfrmScript.innerHTML = output;
				document.head.appendChild(xfrmScript);
			};
			appendScript(babelUrl, babelAppendCallback);
		};

		const appendHscript = () => {
			const hscriptUrl = "https://rawgit.com/NerdGGuy/html2hscript/master/browser.js"
			const hscriptAppendCallback = () => {
				hscript(input, function(err, output) {
					console.log('HSCRIPTFY!');
					console.log({ output });
					xfrmScript.innerHTML = output;
					document.head.appendChild(xfrmScript);
				});
			};
			appendScript(hscriptUrl, hscriptAppendCallback);
		};

		const appendPlain = () => {
			xfrmScript.innerHTML = input;
			document.head.appendChild(xfrmScript);
		};

		setTimeout(() => {
			appendBabel();

			// this will require hyperscript -> react code (and maybe more)
			// https://github.com/mlmorg/react-hyperscript
			//appendHscript();

			//appendPlain();
		}, 1);
	</script>

	<body></body>
</html>
`;

const svc3First = `
<html>
	<script>
		let solution;
		const logIndent = 4;
		const logLeftSideSize = 5;
		let lastScopeId = 0;
		let lastLoggedScopeId = 0;

		const _writeLog = (str) => {
			const output = document.getElementById('output');
			output.innerHTML += \`\n\${str}\`;
		};

		const colors = [
			'green', 'yellow', '#3B8EEA', "magenta",
		].map(c => (...args) => \`<span style="color:\${c}">\${args}</span>\` );
		const style = (id) => {
			return colors[id % colors.length]
		};

		const _log = (type, given, scope, description) => {
			const isUninterruptedSequence = { [given.scopeId]: true, [scope.scopeId]: true }[lastLoggedScopeId];
			if (scope.scopeDepth === given.scopeDepth) var arrow = '↑'.padStart(scope.scopeDepth * logIndent);
			if (scope.scopeDepth < given.scopeDepth) arrow = '↗'.padStart(scope.scopeDepth * logIndent);
			if (scope.scopeDepth > given.scopeDepth) arrow = '↖'.padStart(scope.scopeDepth * logIndent);
			if (!isUninterruptedSequence) arrow = '←'.padEnd(scope.scopeDepth * logIndent, '─');
			if (!scope.scopeParentId) arrow = '→'.padStart(scope.scopeDepth * logIndent);
			lastLoggedScopeId = scope.scopeId;

			//if (type === 'catch') description = chalk.redBright(description);
			//try { description += \` (\${_logWatcher(scope)})\`; } catch (ignored) { /* do nothing */ }
			const id = String(isUninterruptedSequence && scope.scopeId || given.scopeId || scope.scopeId);

			_writeLog(\`\${style(id)(id.padStart(logLeftSideSize))} \${style(scope.scopeId)(arrow)} \${description}\n\`);

		};
		const _desc = ({ desc, ...scope }, n) =>
			 desc[n]
			 //desc[n].replace(/\${(.+?)}/g, (_, k) => get(scope, k));

		const _wrapClosureAroundNextStep = (prev, prevIndex, _onDone) => (...arg) => {
			let { type, func, desc, methodOpts, scopeDepth = -1, scopeId = ++lastScopeId } = prev;
			const error = arg.find((a, i) => a instanceof Error && arg.splice(i, 1));
			const given = Object.assign({ scopeDepth }, ...arg);

			// transfer scope
			const isFirstStep = prevIndex === -1;
			if (isFirstStep) scopeDepth = given.scopeDepth + 1;
			if (isFirstStep) methodOpts = arg.find(a => a.Model);
			const scopeParentId = isFirstStep ? given.scopeId : scopeId;
			if (isFirstStep && style(scopeId) === style(given.scopeId)) scopeId = ++lastScopeId;
			if (isFirstStep && style(scopeId) === style(lastLoggedScopeId)) scopeId = ++lastScopeId;
			const scope = { ...prev, ...given, ...methodOpts, methodOpts, type, func, desc, error, scopeDepth, scopeId, scopeParentId };

			// determine next step
			if (isFirstStep) _onDone = arg.find(o => typeof o === 'function') || _onDone;
			const index = type.indexOf(error ? 'catch' : 'step', prevIndex + 1);
			const nextStep = _wrapClosureAroundNextStep(scope, index, _onDone);

			// handle errors
			if (error && type[prevIndex] === 'step') error.message = \`couldn't \${_desc(scope, prevIndex)} : \${error.message}\`;
			if (typeof func[index] !== 'function') return void _onDone(error, ...arg, { scopeDepth, scopeId });

			// execute step function
			_log(type[index], given, scope, _desc(scope, index));
			try { return func[index](scope, nextStep, ...arg); } catch (e) { return nextStep(error || e, ...arg); }
		};

		window.Solution = (desc, func) => {
			solution = {};
			solution.desc = [desc];
			solution.func = [func];
			solution.type = ['step'];
			const onDone = error => error && console.log(error.stack);
			return _wrapClosureAroundNextStep(solution, -1, onDone);
		};

		window.Step = (desc, func) => {
			solution.func.push(func);
			solution.desc.push(desc);
			solution.type.push('step');
		};

	</script>

	<pre id="output" style="margin-top: 50px;color: #ddd;line-height: 10px;">
	</pre>

	<script>
`;

const svc3Second = `
</script>
</html
`;

// DEPRECATE
function templateSVC3(src) {
	return `${svc3First}${src}${svc3Second}`;
}

// DEPRECATE
function templateJSX(src) {
	//console.log('JSX TEMPLATE ACTIVATE');
	return `${jsxFirst}${src}${jsxSecond}`;
}

const convertRaw = (raw) => {
	const newTemp = {
		extensions: [],
		body: "",
		tokens: [],
		matcher: () => false, //TODO: matchers are not currently implemented
	};
	if (!raw || !raw.name || !raw.code) {
		return newTemp;
	}
	newTemp.extensions.push(raw.name.split(".")[0]);
	newTemp.tokens = [...new Set(raw.code.match(/{{.*}}/g))].map((x) =>
		x.replace(/{{|}}/g, "")
	);
	newTemp.body = raw.code;
	return newTemp;
};

let templates = [];
// get/save all the templates
function updateTemplates(rawTemplates) {
	templates = rawTemplates.map(convertRaw);
}

attachListeners({ updateTemplates });

// TODO: maybe cache this answer (and kill cache when updateTemplates is ran)
const isSupported = ({ name, contents }, returnMatched) => {
	return true;
	const extensionMatch = templates.find((t) =>
		t.extensions.find((ext) => (name || "").includes(`.${ext}`))
	);
	if (extensionMatch) {
		return returnMatched ? extensionMatch : !!extensionMatch;
	}

	const jsonMatch = (() => {
		if (!(name || "").includes(".json")) {
			return;
		}
		if (!contents.includes("file-type")) {
			return;
		}
		try {
			const parsed = JSON.parse(contents);
			const extensionMatch = templates.find((t) =>
				t.extensions.find((ext) => parsed["file-type"] === ext)
			);
			return extensionMatch;
		} catch (e) {
			console.log(e);
		}
	})();
	if (jsonMatch) {
		return returnMatched ? jsonMatch : !!jsonMatch;
	}

	const matcherMatch = templates.find((x) => x.matcher({ name, contents }));
	return returnMatched ? matcherMatch : !!matcherMatch;
};

const transform = ({ name, contents }) => {
	return contents;
	if (name.includes(".htm")) {
		return contents;
	}
	const template = isSupported({ name, contents }, "returnMatched");
	if (!template) {
		console.error("could not find a template that matched this file!");
		return;
	}
	return template.body.replace(`\{\{${template.tokens[0]}\}\}`, contents);
};

// [light] when asked if file/contents are supported by template, say so

// [heavy] transform code according to matching template

// Q: what if multiple templates match?

export { templateJSX, templateSVC3, isSupported, transform };

//show-preview
import { appendUrls, addUrls, consoleHelper, htmlToElement, importCSS, prism } from '../.tools/misc.mjs';
import { createGraph } from '../.tools/graph.mjs';
import '../shared.styl';
consoleHelper();

const ohmScript = "https://unpkg.com/ohm-js@15.2.1/dist/ohm.min.js";

const gmlExample = `
	graph [
		label "Hello, I am a graph"
		comment "This is a sample graph"
		directed 1
		id 42

		node [
			id 1
			label "node 1"
			script "() => {}"
			thisIsASampleAttribute 42
		]
		node [
			id 2
			label "node 2"
			thisIsASampleAttribute 43
		]
		node [
			id 3
			label "node 3"
			thisIsASampleAttribute 44
		]
		edge [
			source 1
			target 2
			label "Edge from node 1 to node 2"
		]
		edge [
			source 2
			target 3
			label "Edge from node 2 to node 3"
		]
		edge [
			source 3
			target 1
			label "Edge from node 3 to node 1"
		]
	]
`.trim().replace(/  /g, '');

const graphPEG = `
	Graph {
		Graph = graph "[" (Node | Edge | Attribute)* "]"
		Node = node "[" Attribute* "]"
		Edge = edge "[" Attribute* "]"

		graph = (~space "graph")
		node = (~space "node")
		edge = (~space "edge")

		Attribute = ~space letter* (String | Number)
		String = "\\"" char* "\\"" | "\\'" char* "\\'"
		Number = digit+

		char = ~(eol | "\\"" | "\\'") any
		eol = "\\r"? "\\n"
	}
`.trim().replace(/  /g, '');

//convert from GML to JSON using ohm.js
async function Template(){
	await appendUrls(ohmScript);
	//console.info(Object.keys(ohm).join('\n'))
	const g = ohm.grammar(graphPEG)
	//console.info(Object.keys(g).join('\n'))
	const match = g.match(gmlExample);
	//match.succeeded() ? console.info('Grammar Success') : console.error('Grammar Fail');

	const reduce = (c) => c.value().reduce((a,o) => o(a), {});
	const mapNodeOrEdge = (a,b,c,d) => g => ({
		...g,
		[a.sourceString+'s']:  [ ...(g[a.sourceString+'s'] || []), reduce(c) ]
	});
	const semantics = g.createSemantics().addOperation('value', {
		Graph: (a, b, c, d) => reduce(c),
		Node: mapNodeOrEdge,
		Edge: mapNodeOrEdge,
		Attribute: (a,b) => (p) => { p[a.sourceString] = JSON.parse(b.sourceString); return p; },
	});
	const parsed = semantics(match).value();
	parsed.links = parsed.edges;
	delete parsed.edges;
	[...parsed.links, ...parsed.nodes].forEach(x => {
		if(!x.label) return;
		x.name = x.label;
		delete x.label;
	})
	const message = '// GML -> JSON\n\n';
	prism('javascript', message + JSON.stringify(parsed, null, 2))
}


// THE FOLLOWING IS NOT COMPLETE
async function Syntax(){
	// import a grammar, output syntax highlighter (and use, of course)
	// https://github.com/foo123/codemirror-grammar

	// https://codemirror.net/demo/simplemode.html

	const CodeMirror = {
		defineMode: () => {},
		defineSimpleMode: () => {}
	};

	CodeMirror.defineMode("CurlyBraceWrappedText", function(config, parserConfig) {
		// Note you must add the following style to get the syntax to highlight:
		// .cm-CurlyBraceWrappedText {color: #CC0000; font-weight: bold;}
		var curlyBraceWrappedTextOverlay = {
			token: function(stream, state) {
				var ch;
				if (stream.match("{{")) {
					while ((ch = stream.next()) != null)
						if (ch == "}" && stream.next() == "}"){
							stream.eat("}");
							return "CurlyBraceWrappedText";
						}
				}
				while (stream.next() != null && !stream.match("{{", false)) {}
				return null;
			}
		};
		return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop ), curlyBraceWrappedTextOverlay);
	});

	// Example definition of a simple mode that understands a subset of Javascript
	CodeMirror.defineSimpleMode("simplemode", {
		// The start state contains the rules that are intially used
		start: [
			// The regex matches the token, the token property contains the type
			{regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
			// You can match multiple tokens at once. Note that the captured
			// groups must span the whole string in this case
			{regex: /(function)(\s+)([a-z$][\w$]*)/,
			 token: ["keyword", null, "variable-2"]},
			// Rules are matched in the order in which they appear, so there is
			// no ambiguity between this one and the one above
			{regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
			 token: "keyword"},
			{regex: /true|false|null|undefined/, token: "atom"},
			{regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
			 token: "number"},
			{regex: /\/\/.*/, token: "comment"},
			{regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3"},
			// A next property will cause the mode to move to a different state
			{regex: /\/\*/, token: "comment", next: "comment"},
			{regex: /[-+\/*=<>!]+/, token: "operator"},
			// indent and dedent properties guide autoindentation
			{regex: /[\{\[\(]/, indent: true},
			{regex: /[\}\]\)]/, dedent: true},
			{regex: /[a-z$][\w$]*/, token: "variable"},
			// You can embed other modes with the mode property. This rule
			// causes all code between << and >> to be highlighted with the XML
			// mode.
			{regex: /<</, token: "meta", mode: {spec: "xml", end: />>/}}
		],
		// The multi-line comment state.
		comment: [
			{regex: /.*?\*\//, token: "comment", next: "start"},
			{regex: /.*/, token: "comment"}
		],
		// The meta property contains global information about the mode. It
		// can contain properties like lineComment, which are supported by
		// all modes, and also directives like dontIndentStates, which are
		// specific to simple modes.
		meta: {
			dontIndentStates: ["comment"],
			lineComment: "//"
		}
	});
}

(async() => {
	await Template();
	await Syntax();
})();
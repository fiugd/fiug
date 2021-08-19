//show-preview
/*
- diff:
	- https://github.com/google/diff-match-patch
	- https://www.npmjs.com/package/diff
	- https://www.npmjs.com/package/git-diff
	- https://www.npmjs.com/package/diff-lines
	- algos: https://link.springer.com/article/10.1007/s10664-019-09772-z

https://codemirror.net/mode/diff/index.html
https://github.blog/2020-11-17-introducing-split-diffs-in-github-desktop/
https://github.com/desktop/desktop/blob/development/app/src/lib/diff-parser.ts

*/

import { appendUrls, consoleHelper, htmlToElement, importCSS, prism } from '../.tools/misc.mjs';
import 	'../shared.styl';
consoleHelper();

import DiffMatchPatch from 'https://cdn.skypack.dev/diff-match-patch';
import Diff from 'https://cdn.skypack.dev/diff-lines';

const logJSON = obj => console.log(JSON.stringify(obj, null, 2));

var text1 = 'The quick brown fox jumps over the lazy dog.';
var text2 = 'That quick brown fox jumped over a lazy dog.';

var text3 = `
these
lines
are
not
changed
//TODO: need to delete backwards (and up for overflowed lines) until reaching prompt
these
lines
are
not
changed
Let's change this in the next release.
these
lines
are
not
changed
const [,keyword, args] = new RegExp(\`^(.+?)(?:\\s|$)(.*)$\`).exec(buffer) || [];
these
lines
are
not
changed
`;
var text4 = `
these
lines
are
not
changed
//TODO: delete backwards (and up for overflowed lines) until reaching prompt
these
lines
are
not
changed
Let's change this in the next release to prod!
these
lines
are
not
changed
const [,keyword, args] = new RegExp(\`^(.+?)(?:\\s|$)(.*)$\`)
	.exec(buffer) || [];
these
lines
are
not
changed
final addition
`;

const showDiff = (t1,t2) => {
	const dmp = new DiffMatchPatch();
	const diff = dmp.diff_main(t1, t2);
	dmp.diff_cleanupSemantic(diff)

	const diffEl = document.createElement('pre');
	diffEl.className = 'info';
	diffEl.style.background = '#fff'
	diffEl.style.color = '#222';
	diffEl.style.filter = 'invert(.85) saturate(2) hue-rotate(175deg)'
	diffEl.innerHTML = dmp.diff_prettyHtml(diff);
	document.body.append(diffEl);
}

showDiff(text1,text2)
showDiff(text3,text4)

const showDiffLines = (t1,t2) => {
	const diff = Diff(text3, text4, {
		n_surrounding: 0
	})

	const diffEl = document.createElement('pre');
	diffEl.className = 'info';
	diffEl.innerHTML = `@@\n${diff}`.split('\n').map((x,i,all) => {
			const space = (str) => `${str[0]}  ${str.slice(1)}`;
		if(x[0] === '-') return `
			<div style="background:#4a1212;">${space(x)}</div>`.trim();
		if(x[0] === '+') return `
			<div style="background: #113111;">${space(x)}</div>`.trim();
		if(x.slice(0,2) === '@@') return `
			<div style="color:#B753B7;">\n...\n\n</div>`.trim();
		return `<div>  ${x}</div>`;
	}).join('');
	document.body.append(diffEl);
}

showDiffLines(text3, text4);

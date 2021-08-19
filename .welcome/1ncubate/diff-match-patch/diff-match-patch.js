import DiffMatchPatch from 'https://cdn.skypack.dev/diff-match-patch';
import chalk from 'https://cdn.skypack.dev/chalk';
const levels = {
	disabled: 0,
	basic16: 1,
	more256: 2,
	trueColor: 3
}
chalk.enabled = true;
chalk.level = levels.trueColor;

const logJSON = obj => console.log(JSON.stringify(obj, null, 2));

// logJSON(Object.keys(DiffMatchPatch));

const text1 = `
Here is a lesson for you:
dogs bark often

	this text should not change
	this text should not change either

but they do not meow
`;

const text2 = `
Here is a lesson for you:
cats do not bark

	this text should not change
	this text should not change either
	this line is added for cats

but they do meow
`;

const dmp = new DiffMatchPatch();
const diff = dmp.diff_main(text1, text2);

const patch = dmp.patch_make(text1, text2);

const patchText = dmp.patch_toText(patch);

const renderPatch = (patch) => {
	const prettyPatch = patch.split('\n')
		.map(x => {
			if(x.includes('@@')) x = '\n'+chalk.hex('#c781c7')(x);
			if(/^\-/.test(x)) x = chalk.red(x);
			if(/^\+/.test(x)) x = chalk.green(x);
			x = x.replace(/\%0A/g, ' ↵ ');
			x = x.replace(/\%09/g, ' → ');
			return x;
		})
		.join('\n')
	return prettyPatch;
}

//logJSON({diff, patch, patchText });
console.log(renderPatch(patchText));

const [ patchApplied, results ] = dmp.patch_apply(patch, text1);
console.log(patchApplied);

// see also https://github.com/crosshj/vermiculate/blob/browser-vermiculate/test/_framework.js

//https://api.qunitjs.com/QUnit/test/
import QUnit from 'https://cdn.skypack.dev/qunit';

//NOTE: sucks that I am stuck with this instance of chalk (due to json colorizer)
import chalk2 from "https://cdn.skypack.dev/-/chalk@v2.4.2-3J9R9FJJA7NuvPxkCfFq/dist=es2020,mode=imports/optimized/chalk.js";
import colorize from 'https://cdn.skypack.dev/json-colorizer';

import ansiEscapes from 'https://cdn.skypack.dev/ansi-escapes';

let finish;

const levels = {
	disabled: 0,
	basic16: 1,
	more256: 2,
	trueColor: 3
}
chalk2.enabled = true;
chalk2.level = levels.trueColor;

// json colors
const colors = {
	BRACE: '#BBBBBB',
	BRACKET: '#BBBBBB',
	COLON: '#BBBBBB',
	COMMA: '#BBBBBB',
	STRING_KEY: '#dcdcaa',
	STRING_LITERAL: '#ce9178',
	NUMBER_LITERAL: '#b5cea8',
	BOOLEAN_LITERAL: '#569cd6',
	NULL_LITERAL: '#569cd6',
};

const jsonColors = (json) => colorize(json, { colors, pretty: true });
const logJSON = x => {
	//TODO: would love to remove quotes from JSON keys
	// failing to do this because of json-colorizer
	//https://stackoverflow.com/questions/3651294/remove-quotes-from-keys-in-a-json-string-using-jquery/3651373
	const colored = jsonColors(x);
	console.log(colored)
};
const safe = (fn) => {
	try {
		return fn();
	} catch(e){
	}
};

const { test: it, module: describe } = QUnit;
//QUnit.config.autostart = false;

let allErrors = [];
const writeTest = (log, c) => test => {
	if(test.status === 'failed'){
		test.errors.forEach(e => {
			allErrors.push({
				...e,
				name: test.name
			})
		})
	} 
	const tab = '  ';
	const writer = {
		passed:  () => `${tab}${c.green('✓')} ${c.dull(test.name)}`,
		failed:  () => `${tab}${c.red('✗')} ${c.dullred(test.name)}`,
		skipped: () => `${tab}${c.yellow('○')} ${c.dullyellow(test.name)}`,
		todo:    () => `${tab}${c.purple('»')} ${c.dullpurple(test.name)}`,
		nothing: () => `${tab}${c.green('○')} ${c.dullyellow(test.name+' [NO ASSERTIONS]')}`,
	};
	if(writer[test.status])
		return log(writer[test.status]());
	log(`[ ${test.status.toUpperCase()} ] : ${test.name}`);
};
const writeSuite = (log, colors) => suite => {
	log(suite.name);
	suite.tests.forEach(writeTest(log, colors));
	log();
};
const testsRan = [];
const onlyShowTestsThatRan = (suite) => {
	suite.tests = suite.tests.filter(t => {
		const testWasRan = testsRan.find(x => x.name === t.name && x.suiteName === t.suiteName);
		if(testWasRan &&
			t.assertions.length === 1 &&
			t.assertions[0].message === "no expectations"
		){
			logJSON(t);
			t.status = 'nothing-'+t.status;
		}
		return testWasRan;
	});
};
const renderTest = (args) => {
	const { childSuites, testCounts, ...others } = args;

	const colorize = chalk2.hex.bind(chalk2);
	const mapToColorizer = (col) => Object.entries(col)
		.reduce((a, [k,v]) => ({ ...a, [k]:colorize(v) }), {});
	const colors = mapToColorizer({
		green: '#00ff00',
		dull: '#aabbbb',
		red: '#ff0000',
		dullred: '#f44',
		yellow: '#ff0',
		dullyellow: '#997',
		purple: '#f5f',
		dullpurple: '#a9a',
		orange: '#ff8867',
		dullorange: '#ce9178'
	});

	childSuites.forEach(suite => {
		onlyShowTestsThatRan(suite);
		suite.tests.length && writeSuite(console.log, colors)(suite);
	});

	allErrors.length && allErrors.forEach((e, i) => {
		console.log();
		console.log(colors.orange(`ERROR ${i+1}:\n  ${e.name}`));
		const { stack, message } = e.message && e.message.startsWith('{')
			? JSON.parse(e.message) : {};
		e.message && console.log(colors.orange(`  ${message || e.message}`));
		console.log(colors.dullorange(
			(stack || e.stack)
				.split('\n')
				.map(x => x
					.replace(/https:\/\/(.*)fiug.dev/, '')
				).join('\n')
				//.replace(/Object.<anonymous> /, '')
		));
	});

	testCounts.xxx = 'ignore';
	const summary = jsonColors(testCounts)
		.split('\n')
		.slice(1,-2)
		.map(x => x.trim()
			.replace(/"/g, '')
			.replace(/,/g, '')
			.split(':')
			.map((x,i,a) => i === 0
					 ? '  ' + x + (new Array(51-x.length).fill().join(' '))
					 : (new Array(60-x.length).fill().join(' ')) + x
			)
			.join('')
		)
		.join('\n');
	console.log('\nsummary\n'+summary);
};

QUnit.on("testStart", (args) => {
	testsRan.push(args);
});
QUnit.on("runEnd", (args) => {
	renderTest(args);
	setTimeout(() => {
		//console.log(ansiEscapes.cursorShow);
	}, 300);
	if(finish) finish();
});

QUnit.assert.custom = function(errors) {
	if(!(errors||[]).length) return;
	errors
		.map((x) => {
			const splitStack = x.stack && x.stack.split('\n');
			if(splitStack){
				x.message = splitStack.slice(0,1);
				x.stack = splitStack.slice(1).join('\n')
			}
			if(x.message && x.stack) return { message: JSON.stringify(x) };
			return x;
		})
		.forEach(this.pushResult);
};

const start = (done) => {
	console.log(ansiEscapes.cursorHide);
	console.log(ansiEscapes.clearScreen);
	finish = done;
	QUnit.start.bind(QUnit)();
};

const expect = (actual, which) => {
	//https://github.com/sapegin/jest-cheat-sheet
	return {
		toEqual: (expected) => {
			const msg = `expected ${which ? which+' : ' : ''}\n  ${actual} \n  to equal \n  ${expected}`;
			QUnit.assert.true(actual === expected, msg)
		},
		toBeTruthy: () => {
			const msg = `expected ${which ? which+' : ' : ''}${actual} to be truthy`;
			QUnit.assert.true(!!actual, msg)
		}
	}
}


export default {
	describe, it, start, expect, logJSON, safe
};

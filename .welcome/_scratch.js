import ansiEscapes from 'https://cdn.skypack.dev/ansi-escapes';

import chalk from 'https://cdn.skypack.dev/chalk';
const levels = {
	disabled: 0,
	basic16: 1,
	more256: 2,
	trueColor: 3
}
chalk.enabled = true;
chalk.level = levels.trueColor;

const getNetEstimate = (salary, joint) => {
	/*

	taxes do not work as below
	see https://www.investopedia.com/financial-edge/0212/how-getting-a-raise-affects-your-taxes.aspx
	https://www.forbes.com/advisor/taxes/taxes-federal-income-tax-bracket/
	
	instead taxes are used here as a gauge for net income
	this accounts for other line items that deduct from gross

	tax return refers to individual deducted as single, but filed as married/joint with non-earning spouse
	it, also, is a rough estimate and not intended to be accurate

	*/
	const taxTable = [
		// single, married, tax rate
		[     0,      0, 0.10],
		[  9951,  19901, 0.12],
		[ 40526,  81051, 0.22],
		[ 86376, 172751, 0.24],
		[164926, 329851, 0.32],
		[209426, 418851, 0.35],
		[523601, 628301, 0.37],
	];

	const [,,rate] = taxTable
		.find((x, i) => {
			if(!taxTable[i+1]) return true;
			const [single,married] = taxTable[i+1];
			return joint
				? married >= salary
				: single >= salary;
		});

	const netFlub = 1.37; //100% magic, based on personal experience
	return 1 - (netFlub * rate);
};

const renderRow = (_this) => () => [
	`${_this.yearly.toFixed(2).padStart(9)} K`,
	`${_this.net.toFixed(2).padStart(6)} K`,
	`${_this.hourly.toFixed(2).padStart(6)}`,
	`${(_this.weeklyNet*2).toFixed(2).padStart(7)} K  `,
	`${(_this.taxReturn).toFixed(2).padStart(6)} K`
].join(chalk.hex('#555')('   |   '));

const header = ansiEscapes.clearScreen
+ ansiEscapes.cursorHide
+ chalk.hex('#ccc').bgHex('#333')(`
                                                                             
    yearly           ~net        hourly        ~bi-weekly      ~tax return   
                                                                             `);

const spacer = chalk.hex('#555')(
'              |              |            |                 |'
);

class Salary {
	asHourly = 1000/(40*52);
	getNetEstimate = getNetEstimate;

	constructor({ hourly, yearly }){
		this.toString = renderRow(this);
		this.yearly = yearly
			? yearly
			: hourly / this.asHourly;

		const netEstimate = this.getNetEstimate(this.yearly*1000);
		const jointEstimate = this.getNetEstimate(this.yearly*1000, true);

		this.netEstimate = netEstimate;
		this.taxReturn = ( jointEstimate - netEstimate ) * this.yearly;
	}

	get hourly(){ return this.yearly * this.asHourly; }
	get net(){ return this.yearly * this.netEstimate; }
	get weeklyNet(){ return this.netEstimate*this.yearly/52; }
}

const results = [
	new Salary({ hourly: 15 }),
	new Salary({ hourly: 20 }),
	new Salary({ yearly: 145 }),
	new Salary({ yearly: 150 }),
	new Salary({ hourly: 80 }),
	new Salary({ yearly: 200 }),
	new Salary({ yearly: 500 }),
];


console.log(header + `
${[spacer, ...results, spacer].join('\n')}
`);

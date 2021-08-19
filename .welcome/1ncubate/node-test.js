import { chalk, jsonColors } from '../.tools/utils.js';

const SAMPLE_LEN = 60;

const rainbow = (() => {
	let i=0;
	const colors = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee']
		.map(x => chalk.hex(x));
	const colorsCount = colors.length;
	const colorStep = colorsCount/SAMPLE_LEN;

	return (line) => {
		i+=colorStep;
		const color = colors[Math.floor(i)%colorsCount];
		return color(line);
	};
})();

const aplChars = '⍝ ¯ × ÷ ∘ ∣ ∼ ≠ ≤ ≥ ≬ ⌶ ⋆ ⌾ ⍟ ⌽ ⍉ ⍦ ⍧ ⍪ ⍫ ⍬ ⍭ ← ↑ → ↓ ∆ ∇ ∧ ∨ ∩ ∪ ⌈ ⌊ ⊤ ⊥ ⊂ ⊃ ⌿ ⍀ ⍅ ⍆ ⍏ ⍖ ⍊ ⍑ ⍋ ⍒ ⍎ ⍕ ⍱ ⍲ ○ ⍳ ⍴ ⍵ ⍺ ⍶ ⍷ ⍸ ⍹ ⍘ ⍙ ⍚ ⍛ ⍜ ⍮ ¨ ⍡ ⍢ ⍣ ⍤ ⍥ ⍨ ⍩';
const asciiArtChars = '█▓▒░▀▄║▌║│▌ •·º✦»ᏗᏒᏖ«';
const iching = '☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷';

for(var i=1, len=SAMPLE_LEN; i<=len; i++){
	console.log(
		rainbow(`${iching} - ${asciiArtChars} - ${aplChars.slice(0,26)}`)
	);
}

console.log(jsonColors({ test: '' }));

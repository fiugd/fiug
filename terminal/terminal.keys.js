/*
there may be an easier way to handle copy/paste

https://github.com/xtermjs/xtermjs.org/pull/128/files#diff-668881c29904cdf1945728abb06b4933d7829e6aec6c66e6f651acc93cf4dd71R23-R37

*/

const getKeysToBubbleUp = () => {
	const F5 = 116;
	const F11 = 122;
	return [F5, F11];
};

const getKeys = (lib) => ({
	ArrowUp: lib.history.prev,
	ArrowDown: lib.history.next,
	Enter: lib.enterCommand,
	Backspace: lib.backspaceCommand,
	controlc: lib.copyKillCommand,
	controlv: lib.pasteCommand,
	controla: lib.selectAll,
});

export default ({ lib, getBuffer, setBuffer }) => {
	const { writeLine, history } = lib;
	const keys = getKeys(lib);
	const keysToBubbleUp = getKeysToBubbleUp();

	const bubbleHandler = ({ which, keyCode }) => {
		const key = which || keyCode;
		return !keysToBubbleUp.includes(key);
	};

	const keyHandler = (e) => {
		const modBitmask = [
			e.domEvent.altKey || 0,
			e.domEvent.altGraphKey || 0,
			e.domEvent.metaKey || 0,
			e.domEvent.ctrlKey || 0,
		].map(Number).join('');

		const mods = {
			control: modBitmask === '0001',
			printable: modBitmask === '0000',
		};

		const key = `${mods.control ? 'control' : '' }${e.domEvent.key}`;
		const termKey = e.key;

		if(keys[key])return keys[key](e);

		if (!mods.printable) return;
		if (termKey.length !== 1) return;

		history.updateBuffer();
		setBuffer(getBuffer() + termKey);
		writeLine(termKey);
	};
	
	return { bubbleHandler, keyHandler };
}
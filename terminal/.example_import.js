import ImpTest from "./.example_import2.js";
ImpTest();

const AB = new Int32Array(new SharedArrayBuffer(4));
export function sleep(t) {
	Atomics.wait(AB, 0, 0, Math.max(1, t|0));
}

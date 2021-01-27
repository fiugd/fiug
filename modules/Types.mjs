//https://webbjocke.com/javascript-check-data-types/
// also, OMG should I have to use Typescript instead???

// also, should use array functions and try/catch in case variable is not defined

function isString(fn) {
	try {
		const value = fn();
		return typeof value === 'string' || value instanceof String;
	} catch(e){ }
}

function isNumber(value) {
	return typeof value === 'number' && isFinite(value);
}

function isArray(value) {
	// ES5 actually has a method for this (ie9+)
	Array.isArray(value);

	return value && typeof value === 'object' && value.constructor === Array;
}

function isFunction(value) {
	return typeof value === 'function';
}

function isObject(value) {
	return value && typeof value === 'object' && value.constructor === Object;
}

function isNull(value) {
	return value === null;
}

function isUndefined(value) {
	return typeof value === 'undefined';
}

function isBoolean(value) {
	return typeof value === 'boolean';
}

function isRegExp(value) {
	return value && typeof value === 'object' && value.constructor === RegExp;
}

function isError(value) {
	return value instanceof Error && typeof value.message !== 'undefined';
}

function isDate(value) {
	return value instanceof Date;
}

function isSymbol(value) {
	return typeof value === 'symbol';
}


export {
	isString
}
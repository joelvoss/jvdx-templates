import { isString } from './assertions';

const regexp = /\[([\w\d]+)\]/g;

/**
 * dget safely gets a value from a nested object via a dot-notated path.
 * In addition you have the ability to provide a fallback value to be returned
 * if the full key path does not exists or the value is undefined.
 */
export function dget(
	obj: { [key: string]: any },
	key: string | Array<string | number>,
	def?: any,
) {
	let _key = key;
	if (isString(key)) {
		_key = key.replace(regexp, '.$1').split('.');
	}

	let p = 0;
	while (obj && p < _key.length) {
		obj = obj[_key[p++]];
	}

	// NOTE(joel): Don't fall back to `def` if `obj` is explicitly set to `null`.
	if (obj === undefined || p < _key.length) {
		return def;
	}

	return obj;
}

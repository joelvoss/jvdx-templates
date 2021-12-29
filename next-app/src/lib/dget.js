const regexp = /\[([\w\d]+)\]/g;

/**
 * dget safely gets a value from a nested object via a dot-notated path.
 * In addition you have the ability to provide a fallback value to be returned
 * if the full key path does not exists or the value is undefined.
 * @template DefaultType
 * @param {{[key: string]: any}} obj
 * @param {string | string[]} key
 * @param {DefaultType} [def=]
 * @returns {{[key: string]: any} | DefaultType}
 */
export function dget(obj, key, def) {
	const _key =
		typeof key.split === 'function'
			? key.replace(regexp, '.$1').split('.')
			: key;

	let p = 0;
	while (obj && p < _key.length) {
		obj = obj[_key[p++]];
	}

	return obj === undefined || p < _key.length ? def : obj;
}

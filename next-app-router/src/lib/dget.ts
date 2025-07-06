import { isType } from '@/lib/is-type';

const regexp = /\[([\w\d]+)\]/g;

/**
 * dget safely gets a value from a nested object via a dot-notated path or
 * array of keys. Optionally returns a fallback value if the key path does not
 * exist or value is undefined.
 */
export function dget(
	obj: { [key: string]: any },
	key: string | Array<string | number>,
	def?: any,
) {
	let _key = key;

	if (isType(key, 'string')) {
		_key = key.replace(regexp, '.$1').split('.');
	}

	let p = 0;
	let current = obj;
	while (current && p < _key.length) {
		current = current[_key[p++]];
	}

	// NOTE(joel): Don't fall back to `def` if `current` is explicitly set to
	// `null`.
	if (current === undefined || p < _key.length) {
		return def;
	}

	return current;
}

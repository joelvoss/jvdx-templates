import { dget } from '@/lib/dget';
import { isType } from '@/lib/is-type';
import { templite } from '@/lib/templite';

/**
 * rosetta is a simple translation helper that picks a given value by key
 * from a dictionary stored as `tree`.
 */
export function rosetta(obj?: { [key: string]: any }, initialLocale?: string) {
	let _locale = initialLocale || '';
	let tree = obj || {};

	return (
		key: string | Array<string | number>,
		params?: any,
		lang?: string,
	) => {
		const val = dget(tree[lang || _locale], key, '');
		if (isType(val, 'function')) return val(params);
		if (isType(val, 'string')) return templite(val, params);
		return val;
	};
}

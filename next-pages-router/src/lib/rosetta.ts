import { dget } from '@/lib/dget';
import { templite } from '@/lib/templite';
import { isFunction, isString } from './assertions';

/**
 * rosetta is a simple translation helper that picks a given value by key
 * from a dictionary stored as `tree`.
 */
export function rosetta(obj?: { [key: string]: any }, initialLocale?: string) {
	let _locale = initialLocale || '';
	let tree = obj || {};

	return {
		set(lang: string, table: Object) {
			tree[lang] = Object.assign(tree[lang] || {}, table);
		},

		locale(lang: string) {
			return (_locale = lang || _locale);
		},

		table(lang: string) {
			return tree[lang];
		},

		t(
			key: string | Array<string | number>,
			params?: any,
			lang?: string,
		): string {
			const val = dget(tree[lang || _locale], key, '');
			if (isFunction(val)) return val(params);
			if (isString(val)) return templite(val, params);
			return val;
		},
	};
}

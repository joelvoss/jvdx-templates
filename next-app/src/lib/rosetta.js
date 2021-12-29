import { dget } from '@/lib/dget';
import { templite } from '@/lib/templite';

/**
 * @typedef {Object} Rosetta
 * @prop {(lang: string, table: T) => void} set
 * @prop {(lang: string) => string} locale
 * @prop {(lang: string) => T | void} table
 * @prop {(key: string | (string | number)[], params?: X, lang?: string) => string} t
 * @template T
 * @template {Record<string, any> | any[]} X
 */

/**
 * rosetta
 * @param {Record<string, T>} obj
 * @param {string} initialLocale
 * @returns {Rosetta<T>}
 * @template T
 */
export function rosetta(obj, initialLocale) {
	let _locale = initialLocale || '';
	let tree = obj || {};

	return {
		/**
		 * set
		 * @param {string} lang
		 * @param {T} table
		 * @template T
		 */
		set(lang, table) {
			tree[lang] = Object.assign(tree[lang] || {}, table);
		},

		/**
		 * locale
		 * @param {string} lang
		 * @returns {string}
		 */
		locale(lang) {
			return (_locale = lang || _locale);
		},

		/**
		 * table
		 * @param {string} lang
		 * @returns {T | void}
		 * @template T
		 */
		table(lang) {
			return tree[lang];
		},

		/**
		 * t
		 * @param {string | (string | number)[]} key
		 * @param {X} [params=]
		 * @param {string} [lang=]
		 * @returns {string}
		 * @template {Record<string, any> | any[]} X
		 */
		t(key, params, lang) {
			let val = dget(tree[lang || _locale], key, '');
			if (typeof val === 'function') return val(params);
			if (typeof val === 'string') return templite(val, params);
			return val;
		},
	};
}

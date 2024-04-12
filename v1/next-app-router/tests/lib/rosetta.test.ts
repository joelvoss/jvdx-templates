// @ts-nocheck

import { rosetta } from '@/lib/rosetta';

////////////////////////////////////////////////////////////////////////////////

const dictFixture = {
	en: { hello: 'Hello, {{name}}!' },
	es: { hello: 'Hola {{name}}!' },
	pt: { foo: 'foo {{name}}~!' },
};

const getCtx = ({ dict = dictFixture, locale } = {}) => rosetta(dict, locale);

////////////////////////////////////////////////////////////////////////////////

describe('rosetta', () => {
	describe('t', () => {
		test('w/o locale', () => {
			const t = getCtx();
			expect(t('hello')).toBe('');
		});

		test('found "hello" key', () => {
			const t = getCtx({ locale: 'en' });
			expect(t('hello')).toBe('Hello, !');
		});

		test('interpolations successful', () => {
			const t = getCtx({ locale: 'en' });
			expect(t('hello', { name: 'world' })).toBe('Hello, world!');
		});

		test('custom locale', () => {
			const t = getCtx({ locale: 'en' });
			expect(t('hello', { name: 'world' }, 'es')).toBe('Hola world!');
			expect(t('hello', { name: 'world' }, 'pt')).toBe('');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('functional', () => {
		const t = getCtx({
			dict: {
				en: {
					hello(value) {
						return `hello ${value || 'stranger'}~!`;
					},
				},
			},
			locale: 'en',
		});

		test('called function w/o param', () => {
			const translation = t('hello');
			expect(translation).toBe('hello stranger~!');
		});
		test('called function w/ param (string)', () => {
			const translation = t('hello', 'world');
			expect(translation).toBe('hello world~!');
		});
		test('called function w/ param (array)', () => {
			const translation = t('hello', [1, 2, 3]);
			expect(translation).toBe('hello 1,2,3~!');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('nested', () => {
		const dict = {
			en: {
				fruits: {
					apple: 'apple',
					orange: 'orange',
					grape: 'grape',
				},
			},
			es: {
				fruits: {
					apple: 'manzana',
					orange: 'naranja',
					grape: 'uva',
				},
			},
		};

		test('locale: en', () => {
			const t = getCtx({ dict, locale: 'en' });

			expect(t('fruits.apple')).toBe('apple');
			expect(t('fruits.orange')).toBe('orange');
			expect(t(['fruits', 'grape'])).toBe('grape');
			expect(t('fruits.404')).toBe('');
			expect(t('error.404')).toBe('');
		});

		test('locale: es', () => {
			const t = getCtx({ dict, locale: 'es' });

			expect(t('fruits.apple')).toBe('manzana');
			expect(t('fruits.orange')).toBe('naranja');
			expect(t(['fruits', 'grape'])).toBe('uva');
			expect(t('fruits.404')).toBe('');
			expect(t('error.404')).toBe('');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('arrays', () => {
		const t = getCtx({
			dict: {
				en: {
					foo: '{{0}} + {{1}} = {{2}}',
					bar: [
						{
							baz: 'roses are {{colors.0}}, violets are {{colors.1}}',
						},
					],
				},
			},
			locale: 'en',
		});

		test('get by key', () => {
			expect(t('foo', [1, 2, 3])).toBe('1 + 2 = 3');
		});

		test('get by dot notation', () => {
			expect(t('bar.0.baz', { colors: ['red', 'blue'] })).toBe(
				'roses are red, violets are blue',
			);
		});
	});
});

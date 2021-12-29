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
	describe('table', () => {
		test('default', () => {
			const ctx = getCtx();
			expect(ctx.table('en')).toEqual({ hello: 'Hello, {{name}}!' });
			expect(ctx.table('foobar')).toBe(undefined);
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('t', () => {
		test('w/o locale', () => {
			const ctx = getCtx();
			expect(ctx.t('hello')).toBe('');
		});

		test('found "hello" key', () => {
			const ctx = getCtx({ locale: 'en' });
			expect(ctx.t('hello')).toBe('Hello, !');
		});

		test('interpolations successful', () => {
			const ctx = getCtx({ locale: 'en' });
			expect(ctx.t('hello', { name: 'world' })).toBe('Hello, world!');
		});

		test('custom locale', () => {
			const ctx = getCtx({ locale: 'en' });
			expect(ctx.t('hello', { name: 'world' }, 'es')).toBe('Hola world!');
			expect(ctx.t('hello', { name: 'world' }, 'pt')).toBe('');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('set', () => {
		test('default', () => {
			const ctx = getCtx({ locale: 'en' });
			ctx.set('pt', { hello: 'Oí {{name}}!' });
			expect(ctx.t('hello', { name: 'world' }, 'pt')).toBe('Oí world!');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('locale', () => {
		test('default', () => {
			const ctx = getCtx({ locale: 'es' });
			expect(ctx.locale()).toBe('es');
			expect(ctx.locale('')).toBe('es');
			expect(ctx.locale(false)).toBe('es');
			expect(ctx.locale(null)).toBe('es');
			expect(ctx.locale(0)).toBe('es');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('functional', () => {
		const ctx = getCtx({
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
			const translation = ctx.t('hello');
			expect(translation).toBe('hello stranger~!');
		});
		test('called function w/ param (string)', () => {
			const translation = ctx.t('hello', 'world');
			expect(translation).toBe('hello world~!');
		});
		test('called function w/ param (array)', () => {
			const translation = ctx.t('hello', [1, 2, 3]);
			expect(translation).toBe('hello 1,2,3~!');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('nested', () => {
		const ctx = getCtx({
			dict: {
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
			},
		});

		test('locale: en', () => {
			ctx.locale('en');
			expect(ctx.t('fruits.apple')).toBe('apple');
			expect(ctx.t('fruits.orange')).toBe('orange');
			expect(ctx.t(['fruits', 'grape'])).toBe('grape');
			expect(ctx.t('fruits.404')).toBe('');
			expect(ctx.t('error.404')).toBe('');
		});

		test('locale: es', () => {
			ctx.locale('es');
			expect(ctx.t('fruits.apple')).toBe('manzana');
			expect(ctx.t('fruits.orange')).toBe('naranja');
			expect(ctx.t(['fruits', 'grape'])).toBe('uva');
			expect(ctx.t('fruits.404')).toBe('');
			expect(ctx.t('error.404')).toBe('');
		});
	});

	//////////////////////////////////////////////////////////////////////////////

	describe('arrays', () => {
		const ctx = getCtx({
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
			expect(ctx.t('foo', [1, 2, 3])).toBe('1 + 2 = 3');
		});

		test('get by dot notation', () => {
			expect(ctx.t('bar.0.baz', { colors: ['red', 'blue'] })).toBe(
				'roses are red, violets are blue',
			);
		});
	});
});

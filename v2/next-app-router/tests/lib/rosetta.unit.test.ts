import { describe, expect, it } from 'vitest';
import { rosetta } from '@/lib/rosetta';

describe('rosetta', () => {
	const dict = {
		en: {
			hello: 'Hello, {{name}}!',
			nested: { value: 'Nested' },
			fn: (params: any) => `Hi ${params?.name}`,
		},
		es: {
			hello: 'Hola, {{name}}!',
		},
	};

	it('returns translated string for key', () => {
		const t = rosetta(dict, 'en');
		expect(t('hello', { name: 'World' })).toBe('Hello, World!');
		expect(t('nested.value')).toBe('Nested');
	});

	it('returns translated string for different locale', () => {
		const t = rosetta(dict, 'es');
		expect(t('hello', { name: 'Mundo' })).toBe('Hola, Mundo!');
	});

	it('returns empty string for missing key', () => {
		const t = rosetta(dict, 'en');
		expect(t('notfound')).toBe('');
	});

	it('calls function value if present', () => {
		const t = rosetta(dict, 'en');
		expect(t('fn', { name: 'Joe' })).toBe('Hi Joe');
	});
});

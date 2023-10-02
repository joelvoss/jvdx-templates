//@ts-nocheck

import { preferredLanguages } from '@/lib/locale/preferred-languages';

describe('preferredLanguages', () => {
	test(`should return an empty array for null input`, () => {
		expect(preferredLanguages(null)).toEqual([]);
	});

	test(`should return '*' for undefined input`, () => {
		expect(preferredLanguages()).toEqual(['*']);
	});

	test('should return an empty array for empty string input', () => {
		expect(preferredLanguages('')).toEqual([]);
	});

	test('should return preferred languages in the correct order', () => {
		const accept = 'en-US;q=0.8, fr;q=0.6, de;q=0.9';
		expect(preferredLanguages(accept)).toEqual(['de', 'en-US', 'fr']);
	});

	test('should handle languages without region codes', () => {
		const accept = 'en, fr, de';
		expect(preferredLanguages(accept)).toEqual(['en', 'fr', 'de']);
	});

	test('should handle languages with region codes', () => {
		const accept = 'en-US, fr-CA, de-DE';
		expect(preferredLanguages(accept)).toEqual(['en-US', 'fr-CA', 'de-DE']);
	});

	test('should handle languages with parameters', () => {
		const accept = 'en-US;q=0.8;param=value, fr;q=0.6, de;q=0.9';
		expect(preferredLanguages(accept)).toEqual(['de', 'en-US', 'fr']);
	});

	test('should return preferred languages without a quality value first', () => {
		const accept = 'en-US;q=0.8, fr, de;q=0.9';
		expect(preferredLanguages(accept)).toEqual(['fr', 'de', 'en-US']);
	});
});

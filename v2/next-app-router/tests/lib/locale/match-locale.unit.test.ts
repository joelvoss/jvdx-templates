import { describe, expect, it } from 'vitest';
import { matchLocale } from '@/lib/locale/match-locale';

describe('matchLocale', () => {
	const availableLocales = ['en', 'de', 'fr'];
	const defaultLocale = 'en';

	it('returns exact match if available', () => {
		expect(matchLocale(['de'], availableLocales, defaultLocale)).toBe('de');
	});

	it('returns defaultLocale if no match', () => {
		expect(matchLocale(['es'], availableLocales, defaultLocale)).toBe('en');
	});

	it('returns best match for subtags', () => {
		// e.g. de-AT should match de
		expect(matchLocale(['de-AT'], availableLocales, defaultLocale)).toBe('de');
	});

	it('handles unicode extension sequences', () => {
		expect(
			matchLocale(['de-u-ca-gregory'], availableLocales, defaultLocale),
		).toBe('de');
	});

	it('returns canonicalized locale if available', () => {
		// e.g. EN should match en
		expect(matchLocale(['EN'], availableLocales, defaultLocale)).toBe('en');
	});
});

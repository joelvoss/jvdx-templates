import { describe, expect, it } from 'vitest';
import { preferredLanguages } from '@/lib/locale/preferred-languages';

describe('preferredLanguages', () => {
	it('parses simple Accept-Language header', () => {
		expect(preferredLanguages('en,fr')).toEqual(['en', 'fr']);
	});

	it('parses with quality values', () => {
		const header = 'en-US;q=0.8,fr;q=0.9,de;q=0.7';
		expect(preferredLanguages(header)).toEqual(['fr', 'en-US', 'de']);
	});

	it('ignores languages with q=0', () => {
		const header = 'en;q=0,fr;q=1';
		expect(preferredLanguages(header)).toEqual(['fr']);
	});

	it('returns [*] if header is undefined', () => {
		expect(preferredLanguages(undefined)).toEqual(['*']);
	});

	it('returns [] if header is empty string', () => {
		expect(preferredLanguages('')).toEqual([]);
	});
});

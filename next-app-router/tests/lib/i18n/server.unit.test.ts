import { describe, expect, it, vi } from 'vitest';
import { useI18n } from '@/lib/i18n/server';

vi.mock('@/lib/rosetta', () => ({
	rosetta: vi.fn((dict, lng) => vi.fn(key => dict[lng][key])),
}));
vi.mock('@/locales', () => ({
	defaultLocale: 'en',
	dictionary: { en: { hello: 'Hello' }, de: { hello: 'Hallo' } },
}));

describe('useI18n (server)', () => {
	it('returns a translation function for the given language', () => {
		const t = useI18n('de');
		expect(typeof t).toBe('function');
		expect(t('hello')).toBe('Hallo');
	});

	it('defaults to defaultLocale if no lang is provided', () => {
		const t = useI18n();
		expect(typeof t).toBe('function');
		expect(t('hello')).toBe('Hello');
	});
});

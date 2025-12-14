import { describe, expect, it, vi } from 'vitest';
import { useI18n } from '@/lib/i18n/server';

vi.mock('@/lib/rosetta', () => ({
	rosetta: vi.fn((dict, lng) => vi.fn(key => dict[lng][key])),
}));
vi.mock('@/locales', () => ({
	dictionary: { en: { hello: 'Hello' }, de: { hello: 'Hallo' } },
}));
vi.mock('@/lib/locale/server', () => ({
	getLocale: vi.fn(() => Promise.resolve('en')),
}));

describe('useI18n (server)', () => {
	it('returns a translation function for the given language', async () => {
		const t = await useI18n('de');
		expect(typeof t).toBe('function');
		expect(t('hello')).toBe('Hallo');
	});

	it('defaults to defaultLocale if no lang is provided', async () => {
		const t = await useI18n();
		expect(typeof t).toBe('function');
		expect(t('hello')).toBe('Hello');
	});
});

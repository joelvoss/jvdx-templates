import { describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useI18n } from '@/lib/i18n/client';

vi.mock('@/lib/rosetta', () => ({
	rosetta: vi.fn((dict, lng) => vi.fn(key => dict[lng][key])),
}));
vi.mock('@/locales', () => ({
	defaultLocale: 'en',
	dictionary: { en: { hello: 'Hello' }, de: { hello: 'Hallo' } },
}));

describe('useI18n (client)', () => {
	it('returns a translation function for the given language', () => {
		const { result } = renderHook(() => useI18n('de'));
		expect(typeof result.current).toBe('function');
		expect(result.current('hello')).toBe('Hallo');
	});

	it('defaults to defaultLocale if no lang is provided', () => {
		const { result } = renderHook(() => useI18n());
		expect(typeof result.current).toBe('function');
		expect(result.current('hello')).toBe('Hello');
	});

	it('updates translation function when language changes between renders', () => {
		const { result, rerender } = renderHook(({ lang }) => useI18n(lang), {
			initialProps: { lang: 'en' },
		});
		expect(result.current('hello')).toBe('Hello');
		rerender({ lang: 'de' });
		expect(result.current('hello')).toBe('Hallo');
	});
});

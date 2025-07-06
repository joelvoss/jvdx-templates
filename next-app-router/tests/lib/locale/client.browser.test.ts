import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useLocale } from '@/lib/locale/client';

vi.mock('client-only', () => ({}));
vi.mock('@/constants', () => ({ LOCALE_SEARCHPARAM_NAME: 'lang' }));
vi.mock('@/locales', () => ({ defaultLocale: 'en' }));

const mocks = vi.hoisted(() => {
	return { useSearchParams: vi.fn() };
});

vi.mock('next/navigation', () => ({
	useSearchParams: mocks.useSearchParams,
}));

describe('useLocale (client)', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns locale from search params if present', () => {
		mocks.useSearchParams.mockImplementation(() => ({
			get: (key: string) => (key === 'lang' ? 'de' : null),
		}));
		const { result } = renderHook(() => useLocale());
		expect(result.current).toBe('de');
	});

	it('returns defaultLocale if search param is missing', () => {
		mocks.useSearchParams.mockImplementation(() => ({
			get: () => null,
		}));
		const { result } = renderHook(() => useLocale());
		expect(result.current).toBe('en');
	});
});

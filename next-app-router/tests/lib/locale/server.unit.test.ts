import * as nextHeaders from 'next/headers';
import { describe, expect, it, vi } from 'vitest';
import { getLocale } from '@/lib/locale/server';

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
	headers: vi.fn(),
}));
vi.mock('@/locales', () => ({ defaultLocale: 'en' }));
vi.mock('@/constants', () => ({ LOCALE_HEADER_NAME: 'x-locale' }));

describe('getLocale (server)', () => {
	it('returns locale from headers if present', async () => {
		(nextHeaders.headers as any).mockResolvedValue({
			get: (key: string) => (key === 'x-locale' ? 'de' : null),
		});
		await expect(getLocale()).resolves.toBe('de');
	});

	it('returns defaultLocale if header missing', async () => {
		(nextHeaders.headers as any).mockResolvedValue({ get: () => null });
		await expect(getLocale()).resolves.toBe('en');
	});
});

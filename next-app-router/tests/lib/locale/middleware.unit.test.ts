import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { withLocale } from '@/lib/locale/middleware';

vi.mock('server-only', () => ({}));
vi.mock('@/constants', () => ({
	LOCALE_COOKIE_MAXAGE: 3600,
	LOCALE_COOKIE_NAME: 'locale',
	LOCALE_HEADER_NAME: 'x-locale',
	LOCALE_SEARCHPARAM_NAME: 'lang',
}));
vi.mock('@/lib/locale/match-locale', () => ({
	matchLocale: vi.fn(() => 'de'),
}));
vi.mock('@/lib/locale/preferred-languages', () => ({
	preferredLanguages: vi.fn(() => ['de']),
}));
vi.mock('@/locales', () => ({ defaultLocale: 'en', locales: ['en', 'de'] }));

const mockNext = vi.fn(async (_: NextRequest) => NextResponse.next());
const mockEvent = {} as any;

const makeRequest = (opts: any = {}) => {
	const url = new URL('https://example.com');
	if (opts.locale) url.searchParams.set('lang', opts.locale);
	const req = new NextRequest(url.toString());
	if (opts.cookieLocale) {
		Object.defineProperty(req, 'cookies', {
			value: {
				get: (name: string) =>
					name === 'locale' ? { value: opts.cookieLocale } : undefined,
			},
		});
	}
	return req;
};

describe('withLocale (middleware)', () => {
	it('sets default locale if none present', async () => {
		const handler = withLocale(mockNext);
		const req = makeRequest();
		const res = await handler(req, mockEvent);
		expect(res.headers.get('x-locale')).toBe('en');
	});

	it('redirects if cookie locale is set and not default', async () => {
		const handler = withLocale(mockNext);
		const req = makeRequest({ cookieLocale: 'de' });
		const res = await handler(req, mockEvent);
		expect(res.headers.get('x-locale')).toBe('de');
	});

	it('redirects if locale param is not supported', async () => {
		const handler = withLocale(mockNext);
		const req = makeRequest({ locale: 'fr' });
		const res = await handler(req, mockEvent);
		expect(res.headers.get('x-locale')).toBe('de');
	});

	it('removes locale param if it is default', async () => {
		const handler = withLocale(mockNext);
		const req = makeRequest({ locale: 'en' });
		const res = await handler(req, mockEvent);
		expect(res.headers.get('x-locale')).toBe('en');
	});

	it('passes through if locale is supported and not default', async () => {
		const handler = withLocale(mockNext);
		const req = makeRequest({ locale: 'de' });
		const res = await handler(req, mockEvent);
		expect(res.headers.get('x-locale')).toBe('de');
	});
});

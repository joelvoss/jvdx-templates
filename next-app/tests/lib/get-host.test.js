import { getHost } from '@/lib/get-host';

describe('getHost', () => {
	test('fallback', () => {
		const obj = getHost();

		expect(obj).toEqual({
			host: 'localhost',
			origin: 'http://localhost:3000',
			port: '3000',
			protocol: 'http:',
		});
	});

	test('get host from window', () => {
		const realWindow = global.window;
		global.window = { location: { host: 'adesso.de' } };

		const obj = getHost();

		expect(obj).toEqual({
			host: 'adesso.de',
			origin: 'https://adesso.de',
			port: undefined,
			protocol: 'https:',
		});

		global.window = realWindow;
	});

	test('get host from req (x-forwarded-host)', () => {
		const req = { headers: { 'x-forwarded-host': 'adesso.de' } };

		const obj = getHost(req);

		expect(obj).toEqual({
			host: 'adesso.de',
			origin: 'https://adesso.de',
			port: undefined,
			protocol: 'https:',
		});
	});

	test('get host from req (host)', () => {
		const req = { headers: { host: 'adesso.de' } };

		const obj = getHost(req);

		expect(obj).toEqual({
			host: 'adesso.de',
			origin: 'https://adesso.de',
			port: undefined,
			protocol: 'https:',
		});
	});

	test('get host from req (fallback)', () => {
		const req = { headers: {} };

		const obj = getHost(req);

		expect(obj).toEqual({
			host: 'localhost',
			origin: 'http://localhost:3000',
			port: '3000',
			protocol: 'http:',
		});
	});

	test('set http if host is "localhost"', () => {
		const req = { headers: { 'x-forwarded-host': 'localhost' } };

		const obj = getHost(req);

		expect(obj).toEqual({
			host: 'localhost',
			origin: 'http://localhost',
			port: undefined,
			protocol: 'http:',
		});
	});
});

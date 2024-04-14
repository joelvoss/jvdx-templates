import { Hono } from 'hono';
import { describe, expect, test } from 'vitest';
import { cors } from '../../src/lib/cors';

describe('cors', () => {
	test('default cors headers', async () => {
		let app = new Hono();
		app.get('/cors/*', cors(), () => new Response('test'));

		let res = await app.request('/cors/a');

		expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
	});

	test('reflect origin', async () => {
		let app = new Hono();
		app.get('/cors/*', cors({ origin: true }), () => new Response('test'));

		let res = await app.request('/cors/a', {
			headers: { origin: 'http://example.com' },
		});

		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://example.com',
		);
		expect(res.headers.get('Vary')).toBe('Origin');
	});

	test('* origin', async () => {
		let app = new Hono();
		app.get('/cors/false', cors({ origin: false }), () => new Response('test'));
		app.get('/cors/star', cors({ origin: '*' }), () => new Response('test'));

		let res = await app.request('/cors/false', {
			headers: { origin: 'http://example.com' },
		});
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(res.headers.get('Vary')).toBe(null);

		let res2 = await app.request('/cors/star', {
			headers: { origin: 'http://example.com' },
		});
		expect(res2.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(res2.headers.get('Vary')).toBe(null);
	});

	test('string origin', async () => {
		let app = new Hono();
		app.get(
			'/cors/*',
			cors({ origin: 'http://example.com' }),
			() => new Response('test'),
		);

		let res = await app.request('/cors/allowed');
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://example.com',
		);
		expect(res.headers.get('Vary')).toBe('Origin');
	});

	test('array of strings origin', async () => {
		let app = new Hono();
		app.get(
			'/cors/*',
			cors({ origin: ['http://example.com', 'http://example2.com'] }),
			() => new Response('test'),
		);

		// Test with first origin
		let res = await app.request('/cors/first', {
			headers: { origin: 'http://example.com' },
		});
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://example.com',
		);
		expect(res.headers.get('Vary')).toBe('Origin');

		// Test with second origin
		let res2 = await app.request('/cors/second', {
			headers: { origin: 'http://example2.com' },
		});
		expect(res2.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://example2.com',
		);
		expect(res2.headers.get('Vary')).toBe('Origin');

		// Test with forbidden origin
		let res3 = await app.request('/cors/not-allowed', {
			headers: { origin: 'http://example3.com' },
		});
		expect(res3.headers.get('Access-Control-Allow-Origin')).toBe(null);
		expect(res3.headers.get('Vary')).toBe(null);
	});

	test('function origin', async () => {
		let app = new Hono();
		app.get(
			'/cors/reflect',
			cors({ origin: () => true }),
			() => new Response('test'),
		);
		app.get(
			'/cors/deny',
			cors({ origin: () => false }),
			() => new Response('test'),
		);

		let res = await app.request('/cors/reflect', {
			headers: { origin: 'http://reflected.com' },
		});
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://reflected.com',
		);
		expect(res.headers.get('Vary')).toBe('Origin');

		let res2 = await app.request('/cors/deny', {
			headers: { origin: 'http://reflected.com' },
		});
		expect(res2.headers.get('Access-Control-Allow-Origin')).toBe(null);
		expect(res2.headers.get('Vary')).toBe(null);
	});

	test('RegExp origin', async () => {
		let app = new Hono();
		app.get('/cors/*', cors({ origin: /\.com/g }), () => new Response('test'));

		let res = await app.request('/cors/allowed', {
			headers: { origin: 'http://example.com' },
		});
		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://example.com',
		);
		expect(res.headers.get('Vary')).toBe('Origin');

		let res2 = await app.request('/cors/deny', {
			headers: { origin: 'http://example.org' },
		});
		expect(res2.headers.get('Access-Control-Allow-Origin')).toBe(null);
		expect(res2.headers.get('Vary')).toBe(null);
	});

	test('with credentials', async () => {
		let app = new Hono();
		app.get('/cors/*', cors({ credentials: true }), () => new Response('test'));

		let res = await app.request('/cors/a');

		expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
	});

	test('with exposeHeaders', async () => {
		let app = new Hono();
		app.get(
			'/cors/*',
			cors({ exposeHeaders: ['X-Exposed-Header'] }),
			() => new Response('test'),
		);

		let res = await app.request('/cors/a');

		expect(res.headers.get('Access-Control-Expose-Headers')).toBe(
			'X-Exposed-Header',
		);
	});

	test('with maxAge', async () => {
		let app = new Hono();
		app.all('/cors/*', cors({ maxAge: 3600 }), () => new Response('test'));

		let res = await app.request('/cors/a', {
			method: 'OPTIONS',
		});

		expect(res.headers.get('Access-Control-Max-Age')).toBe('3600');
	});

	test('with allowMethods', async () => {
		let app = new Hono();
		app.all(
			'/cors/*',
			cors({ allowMethods: ['GET', 'POST'] }),
			() => new Response('test'),
		);

		let res = await app.request('/cors/a', {
			method: 'OPTIONS',
		});

		expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET,POST');
	});

	test('with allowHeaders', async () => {
		let app = new Hono();
		app.all(
			'/cors/*',
			cors({ allowHeaders: ['X-Custom-Header', 'X-Custom-Header-2'] }),
			() => new Response('test'),
		);

		let res = await app.request('/cors/a', {
			method: 'OPTIONS',
		});

		expect(res.headers.get('Access-Control-Allow-Headers')).toBe(
			'X-Custom-Header,X-Custom-Header-2',
		);
		expect(res.headers.get('Vary')).toBe('Access-Control-Request-Headers');
	});

	test('with Access-Control-Request-Headers', async () => {
		let app = new Hono();
		app.all('/cors/*', cors(), () => new Response('test'));

		let res = await app.request('/cors/a', {
			method: 'OPTIONS',
			headers: {
				'Access-Control-Request-Headers': 'X-Req-Custom, X-Req-Custom-2',
			},
		});

		expect(res.headers.get('Access-Control-Allow-Headers')).toBe(
			'X-Req-Custom,X-Req-Custom-2',
		);
		expect(res.headers.get('Vary')).toBe('Access-Control-Request-Headers');
	});

	test('default OPTIONS request', async () => {
		let app = new Hono();
		app.all('/cors/*', cors(), () => new Response('test'));

		let res = await app.request('/cors/a', {
			method: 'OPTIONS',
		});

		expect(res.headers.get('Content-Length')).toBe(null);
		expect(res.headers.get('Content-Type')).toBe(null);
		expect(res.status).toBe(204);
	});
});

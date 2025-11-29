import { Hono } from 'hono';
import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('cacheControl', () => {
	let cacheControl: typeof import('~/lib/cache-control').cacheControl;

	beforeEach(async () => {
		vi.resetModules();
		cacheControl = (await import('~/lib/cache-control')).cacheControl;
	});

	test('no-cache when options is false', async () => {
		let app = new Hono();
		app.get('/cacheControl/*', cacheControl(false), () => new Response('test'));

		let res = await app.request('/cacheControl/a');

		expect(res.headers.get('Cache-Control')).toBe(
			'no-cache, no-store, must-revalidate',
		);
	});

	test('default cache when options is true', async () => {
		let app = new Hono();
		app.get('/cacheControl/*', cacheControl(true), () => new Response('test'));

		let res = await app.request('/cacheControl/a');

		expect(res.headers.get('Cache-Control')).toBe(
			'public, max-age=300, s-maxage=600, stale-while-revalidate',
		);
	});

	test('no-cache when NODE_ENV is development', async () => {
		vi.stubEnv('NODE_ENV', 'development');

		let app = new Hono();
		app.get(
			'/cacheControl/*',
			cacheControl({ maxAge: 100, sMaxAge: 200 }),
			() => new Response('test'),
		);

		let res = await app.request('/cacheControl/a');

		expect(res.headers.get('Cache-Control')).toBe(
			'no-cache, no-store, must-revalidate',
		);

		vi.unstubAllEnvs();
	});

	test('with max-age and s-maxage', async () => {
		let app = new Hono();
		app.get(
			'/cacheControl/*',
			cacheControl({ maxAge: 100, sMaxAge: 200 }),
			() => new Response('test'),
		);

		let res = await app.request('/cacheControl/a');

		expect(res.headers.get('Cache-Control')).toBe(
			'public, max-age=100, s-maxage=200, stale-while-revalidate',
		);
	});

	test('with default max-age and s-maxage', async () => {
		let app = new Hono();
		app.get('/cacheControl/*', cacheControl(), () => new Response('test'));

		let res = await app.request('/cacheControl/a');

		expect(res.headers.get('Cache-Control')).toBe(
			'public, max-age=300, s-maxage=600, stale-while-revalidate',
		);
	});
});

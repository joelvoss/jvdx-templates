import { Hono } from 'hono';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Variables } from '../../src/types';

////////////////////////////////////////////////////////////////////////////////
// Mocks

vi.mock('node:crypto', () => {
	return {
		randomUUID: () => '345e5aecef2e4f21ab8302e23ac1409c',
	};
});

////////////////////////////////////////////////////////////////////////////////
// Tests

describe('trace', () => {
	let logger: typeof import('~/lib/logger').logger;
	let trace: typeof import('~/lib/trace').trace;

	beforeEach(async () => {
		vi.unstubAllEnvs();
		vi.resetModules();
		logger = (await import('../../src/lib/logger')).logger;
		trace = (await import('../../src/lib/trace')).trace;
	});

	test('generate random trace id', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(trace({ projectId: 'test-project-id' }));

		app.get('/', (c) => {
			let id = c.get('traceId');
			return c.json({ id });
		});

		let res = await app.request('/');
		let body = await res.json();

		expect(body).toStrictEqual({
			id: 'projects/test-project-id/traces/345e5aecef2e4f21ab8302e23ac1409c',
		});
	});

	test('use available trace id', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(trace({ projectId: 'test-project-id' }));

		app.get('/', (c) => {
			let id = c.get('traceId');
			return c.json({ id });
		});

		let res = await app.request('/', {
			headers: {
				'X-Cloud-Trace-Context': 'cloud_ecef2e4f21ab8302e23ac1409c/1;o=1',
			},
		});
		let body = await res.json();

		expect(body).toStrictEqual({
			id: 'projects/test-project-id/traces/cloud_ecef2e4f21ab8302e23ac1409c',
		});
	});

	test('use GOOGLE_CLOUD_PROJECT when projectId is not passed', async () => {
		vi.stubEnv('PROJECT_ID', '');
		vi.stubEnv('GOOGLE_CLOUD_PROJECT', 'env-project-id');
		vi.stubEnv('GCLOUD_PROJECT', '');

		let app = new Hono<{ Variables: Variables }>();
		app.use(trace());

		app.get('/', (c) => {
			let id = c.get('traceId');
			return c.json({ id });
		});

		let res = await app.request('/');
		let body = await res.json();

		expect(body).toStrictEqual({
			id: 'projects/env-project-id/traces/345e5aecef2e4f21ab8302e23ac1409c',
		});
	});

	test('omit trace id when project id is unavailable', async () => {
		vi.stubEnv('PROJECT_ID', '');
		vi.stubEnv('GOOGLE_CLOUD_PROJECT', '');
		vi.stubEnv('GCLOUD_PROJECT', '');

		let app = new Hono<{ Variables: Variables }>();
		app.use(trace());

		app.get('/', (c) => {
			let id = c.get('traceId');
			return c.json({ id: id ?? null });
		});

		let res = await app.request('/');
		let body = await res.json();

		expect(body).toStrictEqual({ id: null });
	});

	test('adds trace id to logger context for the request', async () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let app = new Hono<{ Variables: Variables }>();
		app.use(async (_c, next) => {
			await logger.withContext({}, next);
		});
		app.use(trace({ projectId: 'test-project-id' }));

		app.get('/', (c) => {
			logger.info('Request handled');
			return c.json({ message: 'ok' });
		});

		await app.request('/', {
			headers: {
				'X-Cloud-Trace-Context': 'cloud_ecef2e4f21ab8302e23ac1409c/1;o=1',
			},
		});

		expect(JSON.parse(consoleSpy.mock.calls[0][0])).toEqual({
			'logging.googleapis.com/trace':
				'projects/test-project-id/traces/cloud_ecef2e4f21ab8302e23ac1409c',
			severity: 'INFO',
			message: 'Request handled',
		});

		consoleSpy.mockRestore();
	});
});

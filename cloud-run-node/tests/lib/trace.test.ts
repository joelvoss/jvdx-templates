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
	let trace: typeof import('~/lib/trace').trace;

	beforeEach(async () => {
		vi.resetModules();
		trace = (await import('../../src/lib/trace')).trace;
	});

	test('generate random trace id', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(trace({ projectId: 'test-project-id' }));

		app.get('/', c => {
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

		app.get('/', c => {
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
});

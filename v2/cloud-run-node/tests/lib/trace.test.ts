import { Hono } from 'hono';
import { describe, expect, test, vi } from 'vitest';
import { trace } from '../../src/lib/trace';

import type { Variables } from '../../src/types';

vi.mock('node:crypto', () => {
	return {
		randomUUID: () => '345e5aecef2e4f21ab8302e23ac1409c',
	};
});

describe('trace', () => {
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

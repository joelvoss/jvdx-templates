import { NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { withCsrf } from '@/lib/csrf-middleware';

const mockNext = vi.fn(async () => NextResponse.next());

function createRequest({ method = 'POST', headers = {} } = {}) {
	return {
		method,
		headers: {
			get: (key: string) => headers[key.toLowerCase()] || '',
		},
	} as any;
}

function createEvent() {
	return {} as any; // Minimal mock for NextFetchEvent
}

describe('withCsrf', () => {
	it('allows safe methods', async () => {
		for (const method of ['GET', 'HEAD', 'OPTIONS']) {
			const req = createRequest({ method });
			const mw = withCsrf(mockNext);
			const result = await mw(req, createEvent());
			expect(result instanceof NextResponse).toBe(true);
			expect(result.status).toBe(200); // NextResponse.next() default
		}
	});

	it('allows safe fetches', async () => {
		for (const fetch of ['same-origin', 'none']) {
			const req = createRequest({ headers: { 'sec-fetch-site': fetch } });
			const mw = withCsrf(mockNext);
			const result = await mw(req, createEvent());
			expect(result instanceof NextResponse).toBe(true);
			expect(result.status).toBe(200);
		}
	});

	it('rejects if origin header is missing', async () => {
		const req = createRequest({ headers: {} });
		const mw = withCsrf(mockNext);
		const res = await mw(req, createEvent());
		// NextResponse.json returns a NextResponse with status 403 and a JSON body
		expect(res.status).toBe(403);
		const json = await res.json();
		expect(json).toMatchObject({ success: false });
	});

	it('rejects if origin host does not match', async () => {
		const req = createRequest({
			headers: { origin: 'http://evil.com', host: 'localhost' },
		});
		const mw = withCsrf(mockNext);
		const res = await mw(req, createEvent());
		expect(res.status).toBe(403);
		const json = await res.json();
		expect(json).toMatchObject({ success: false });
	});

	it('allows if origin host matches', async () => {
		const req = createRequest({
			headers: { origin: 'http://localhost', host: 'localhost' },
		});
		const mw = withCsrf(mockNext);
		const result = await mw(req, createEvent());
		expect(result instanceof NextResponse).toBe(true);
		expect(result.status).toBe(200);
	});

	it('rejects unsafe methods', async () => {
		for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
			const req = createRequest({
				method,
				headers: { origin: 'http://evil.com', host: 'localhost' },
			});
			const mw = withCsrf(mockNext);
			const res = await mw(req, createEvent());
			expect(res.status).toBe(403);
			const json = await res.json();
			expect(json).toMatchObject({ success: false });
		}
	});

	it('rejects unsafe fetches', async () => {
		for (const fetch of ['cross-site', 'same-site']) {
			const req = createRequest({
				headers: {
					'sec-fetch-site': fetch,
					origin: 'http://evil.com',
					host: 'localhost',
				},
			});
			const mw = withCsrf(mockNext);
			const res = await mw(req, createEvent());
			expect(res.status).toBe(403);
			const json = await res.json();
			expect(json).toMatchObject({ success: false });
		}
	});
});

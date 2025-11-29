import { Buffer } from 'node:buffer';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import type { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Variables } from '~/types';

////////////////////////////////////////////////////////////////////////////////
// Mocks

let mockLoggerError = vi.fn();
let mockLoggerInfo = vi.fn();
let mockLoggerWarn = vi.fn();

vi.mock('~/lib/logger', () => {
	return {
		logger: {
			error: mockLoggerError,
			info: mockLoggerInfo,
			warn: mockLoggerWarn,
		},
	};
});

let mockGetBooks = vi.fn();
let mockCreateBook = vi.fn();
let mockGetBook = vi.fn();
let mockUpdateBook = vi.fn();
let mockDeleteBook = vi.fn();

vi.mock('~/adapters/firestore', () => {
	return {
		Firestore: {
			getBooks: mockGetBooks,
			createBook: mockCreateBook,
			getBook: mockGetBook,
			updateBook: mockUpdateBook,
			deleteBook: mockDeleteBook,
		},
	};
});

////////////////////////////////////////////////////////////////////////////////
// Tests

describe('build()', () => {
	let app: Hono<{ Variables: Variables }>;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.stubEnv('PROJECT_ID', 'test-project');
		let { build } = await import('~/index');
		app = build();
	});

	afterEach(() => {
		vi.resetAllMocks();
		vi.unstubAllEnvs();
	});

	test('responds to healthcheck route with ok payload', async () => {
		let response = await app.request('/');

		expect(response.status).toBe(200);

		let body = await response.json();
		expect(body).toEqual({ message: 'ok' });
	});

	test('applies secure headers and etag middleware', async () => {
		let response = await app.request('/');

		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		let hsts = response.headers.get('strict-transport-security');
		expect(hsts).toBeTruthy();
		expect(response.headers.get('etag')).toBeTruthy();
	});

	test('reflects origin header via CORS middleware', async () => {
		let origin = 'https://example.com';
		let response = await app.request('/', {
			headers: { origin },
		});

		expect(response.headers.get('access-control-allow-origin')).toBe(origin);
		let vary = response.headers.get('vary');
		expect(vary).toBeTruthy();
		expect(vary?.split(',').map(value => value.trim())).toContain('Origin');
	});

	test('compress middleware returns gzipped responses when requested', async () => {
		let response = await app.request('/', {
			headers: { 'accept-encoding': 'gzip' },
		});

		let encoding = response.headers.get('content-encoding');
		expect(['gzip', 'br']).toContain(encoding);

		let buffer = Buffer.from(await response.arrayBuffer());
		let decompressed =
			encoding === 'br'
				? brotliDecompressSync(buffer).toString('utf-8')
				: gunzipSync(buffer).toString('utf-8');
		expect(JSON.parse(decompressed)).toEqual({ message: 'ok' });
	});

	test('global error handler logs http exceptions with trace context', async () => {
		mockGetBook.mockResolvedValueOnce(null);

		let traceHeader = '105445aa7843bc8bf206b120001000/1;o=1';
		let response = await app.request('/v1/books/missing', {
			headers: {
				origin: 'https://example.com',
				'X-Cloud-Trace-Context': traceHeader,
			},
		});

		expect(response.status).toBe(404);
		let body = await response.json();
		expect(body).toEqual({
			code: 'NOT_FOUND',
			message: "Book with ID 'missing' not found",
		});

		expect(mockLoggerError).toHaveBeenCalledTimes(1);

		let [, context] = mockLoggerError.mock.calls[0];
		expect(context.get('traceId')).toBe(
			'projects/test-project/traces/105445aa7843bc8bf206b120001000',
		);
	});
});

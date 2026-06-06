import { trace as otelTrace } from '@opentelemetry/api';
import { Hono } from 'hono';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Variables } from '../../src/types';

////////////////////////////////////////////////////////////////////////////////

describe('trace', () => {
	let logger: typeof import('~/lib/logger').logger;
	let trace: typeof import('~/lib/trace').trace;
	let traceMiddleware: typeof import('~/lib/trace').traceMiddleware;
	let tracer: typeof import('~/lib/trace').tracer;
	let SpanStatusCode: typeof import('~/lib/trace').SpanStatusCode;

	beforeEach(async () => {
		vi.unstubAllEnvs();
		vi.resetModules();
		logger = (await import('../../src/lib/logger')).logger;
		let traceModule = await import('../../src/lib/trace');
		trace = traceModule.trace;
		traceMiddleware = traceModule.traceMiddleware;
		tracer = traceModule.tracer;
		SpanStatusCode = traceModule.SpanStatusCode;
	});

	test('creates an active server span for the request', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		app.get('/', (c) => {
			let active = trace.getActiveSpan();
			return c.json({
				activeSpanId: active?.spanContext().spanId,
				spanId: c.get('spanId'),
				traceId: c.get('traceId'),
			});
		});

		let res = await app.request('/');
		let body = (await res.json()) as {
			activeSpanId: string;
			spanId: string;
			traceId: string;
		};

		expect(body.spanId).toMatch(/^[\da-f]{16}$/);
		expect(body.activeSpanId).toBe(body.spanId);
		expect(body.traceId).toMatch(
			/^projects\/test-project-id\/traces\/[\da-f]{32}$/,
		);
	});

	test('uses W3C traceparent as parent context', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		app.get('/', (c) => {
			return c.json({ id: c.get('traceId') });
		});

		let res = await app.request('/', {
			headers: {
				traceparent: '00-1234567890abcdef1234567890abcdef-fedcba0987654321-01',
			},
		});
		let body = (await res.json()) as { id: string };

		expect(body).toStrictEqual({
			id: 'projects/test-project-id/traces/1234567890abcdef1234567890abcdef',
		});
	});

	test('omits trace id when project id is unavailable', async () => {
		vi.stubEnv('PROJECT_ID', '');
		vi.stubEnv('GOOGLE_CLOUD_PROJECT', '');
		vi.stubEnv('GCLOUD_PROJECT', '');

		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware());

		app.get('/', (c) => {
			return c.json({ id: c.get('traceId') ?? null });
		});

		let res = await app.request('/');
		let body = (await res.json()) as { id: string | null };

		expect(body).toStrictEqual({ id: null });
	});

	test('keeps manually created child spans active inside startActiveSpan', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		app.get('/', async () => {
			let result = await tracer.startActiveSpan(
				'child.operation',
				async (span) => {
					await Promise.resolve();
					let activeSpanId = trace.getActiveSpan()?.spanContext().spanId;
					span.end();
					return { activeSpanId, childSpanId: span.spanContext().spanId };
				},
			);
			return Response.json(result);
		});

		let res = await app.request('/');
		let body = (await res.json()) as {
			activeSpanId: string;
			childSpanId: string;
		};

		expect(body.activeSpanId).toBe(body.childSpanId);
	});

	test('renames span to "{method} {route}" using the matched route template', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		let updateNameSpy: ReturnType<typeof vi.fn> | undefined;
		app.get('/v1/books/:id', (c) => {
			let active = trace.getActiveSpan();
			updateNameSpy = vi.spyOn(active!, 'updateName');
			return c.json({ id: c.req.param('id') });
		});

		let res = await app.request('/v1/books/abc-123');

		expect(res.status).toBe(200);
		expect(updateNameSpy).toHaveBeenCalledWith('GET /v1/books/:id');
	});

	test('sets http.route attribute using the matched route template', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		let setAttributeSpy: ReturnType<typeof vi.fn> | undefined;
		app.get('/v1/books/:id', (c) => {
			let active = trace.getActiveSpan();
			setAttributeSpy = vi.spyOn(active!, 'setAttribute');
			return c.json({ id: c.req.param('id') });
		});

		await app.request('/v1/books/abc-123');

		expect(setAttributeSpy).toHaveBeenCalledWith('http.route', '/v1/books/:id');
	});

	test('records exceptions caught by a global onError handler on the span', async () => {
		// NOTE(joel): Hono's `app.onError()` catches exceptions thrown by route
		// handlers and converts them to a `Response` before `next()` resolves
		// inside `traceMiddleware`. This test guards against the exception
		// silently not being recorded on the span in that case.
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		let recordExceptionSpy: ReturnType<typeof vi.fn> | undefined;
		let setStatusSpy: ReturnType<typeof vi.fn> | undefined;
		app.use(async (_c, next) => {
			let active = trace.getActiveSpan();
			recordExceptionSpy = vi.spyOn(active!, 'recordException');
			setStatusSpy = vi.spyOn(active!, 'setStatus');
			await next();
		});

		let thrownError = new Error('boom');
		app.get('/boom', () => {
			throw thrownError;
		});
		app.onError((err, c) => {
			return c.json({ message: err.message }, 500);
		});

		let res = await app.request('/boom');

		expect(res.status).toBe(500);
		expect(recordExceptionSpy).toHaveBeenCalledWith(thrownError);
		expect(setStatusSpy).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
	});

	test('does not record an exception when there is none', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		let recordExceptionSpy: ReturnType<typeof vi.fn> | undefined;
		app.use(async (_c, next) => {
			let active = trace.getActiveSpan();
			recordExceptionSpy = vi.spyOn(active!, 'recordException');
			await next();
		});
		app.get('/', (c) => c.json({ message: 'ok' }));

		let res = await app.request('/');

		expect(res.status).toBe(200);
		expect(recordExceptionSpy).not.toHaveBeenCalled();
	});

	test('does not mark the span as errored for expected 4xx client errors', async () => {
		// NOTE(joel): Per OTel semantic conventions for HTTP servers, span
		// status should only be marked as an error for 5xx responses (server
		// faults). A deliberate `HTTPException(404)` (e.g. "book not found") is
		// expected application behavior, not a failure, and marking it as a
		// span error would add trace noise for perfectly normal responses.
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		let recordExceptionSpy: ReturnType<typeof vi.fn> | undefined;
		let setStatusSpy: ReturnType<typeof vi.fn> | undefined;
		app.use(async (_c, next) => {
			let active = trace.getActiveSpan();
			recordExceptionSpy = vi.spyOn(active!, 'recordException');
			setStatusSpy = vi.spyOn(active!, 'setStatus');
			await next();
		});

		app.get('/missing', () => {
			throw new Error('not found');
		});
		app.onError((err, c) => c.json({ message: err.message }, 404));

		let res = await app.request('/missing');

		expect(res.status).toBe(404);
		expect(recordExceptionSpy).not.toHaveBeenCalled();
		expect(setStatusSpy).not.toHaveBeenCalled();
	});

	test('marks the span as errored for 5xx responses without a thrown error', async () => {
		let app = new Hono<{ Variables: Variables }>();
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		let setStatusSpy: ReturnType<typeof vi.fn> | undefined;
		app.use(async (_c, next) => {
			let active = trace.getActiveSpan();
			setStatusSpy = vi.spyOn(active!, 'setStatus');
			await next();
		});
		app.get('/', (c) => c.json({ message: 'error' }, 503));

		let res = await app.request('/');

		expect(res.status).toBe(503);
		expect(setStatusSpy).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
	});

	test('adds trace id to logger context for the request', async () => {
		let consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		let app = new Hono<{ Variables: Variables }>();
		app.use(async (_c, next) => {
			await logger.withContext({}, next);
		});
		app.use(traceMiddleware({ projectId: 'test-project-id' }));

		app.get('/', () => {
			logger.info('Request handled');
			return Response.json({ message: 'ok' });
		});

		await app.request('/', {
			headers: {
				traceparent: '00-1234567890abcdef1234567890abcdef-fedcba0987654321-01',
			},
		});

		let log = JSON.parse(consoleSpy.mock.calls[0][0]);
		expect(log).toEqual({
			'logging.googleapis.com/spanId': expect.stringMatching(/^[\da-f]{16}$/),
			'logging.googleapis.com/trace':
				'projects/test-project-id/traces/1234567890abcdef1234567890abcdef',
			'logging.googleapis.com/trace_sampled': true,
			severity: 'INFO',
			message: 'Request handled',
		});

		consoleSpy.mockRestore();
	});
});

describe('shutdownTracing', () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
		// NOTE(joel): `tracerProvider.register()` in `~/lib/trace` registers a
		// global tracer provider via the OTel API. That registration is a
		// one-time, process-wide singleton: re-importing the module (e.g. via
		// `vi.resetModules()`) creates a *new* provider instance internally,
		// but the OTel API silently refuses to swap out the already-registered
		// global one. Without explicitly disabling it first, `trace.getTracer`
		// / `tracer.startSpan` calls below would keep operating against the
		// previous test's provider (and its exporter), not the fresh one
		// configured for this test.
		otelTrace.disable();
	});

	test('flushes spans buffered in the BatchSpanProcessor before resolving', async () => {
		vi.stubEnv('OTEL_TRACES_EXPORTER', 'console');
		let consoleSpy = vi.spyOn(console, 'dir').mockImplementation(() => {});

		let { shutdownTracing, tracer } = await import('../../src/lib/trace');

		let span = tracer.startSpan('unflushed.span');
		span.end();

		// NOTE(joel): The span above hasn't been exported yet: the
		// BatchSpanProcessor only exports on its interval (default 5s) or when
		// explicitly flushed.
		expect(consoleSpy).not.toHaveBeenCalled();

		await shutdownTracing();

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'unflushed.span' }),
			expect.anything(),
		);

		consoleSpy.mockRestore();
	});
});

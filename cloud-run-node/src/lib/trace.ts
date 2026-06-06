import {
	context,
	propagation,
	SpanKind,
	SpanStatusCode,
	TraceFlags,
	trace,
} from '@opentelemetry/api';
import type { Attributes, Exception, Span } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
	BatchSpanProcessor,
	ConsoleSpanExporter,
	NodeTracerProvider,
	ParentBasedSampler,
	type SpanExporter,
	TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import {
	ATTR_CLOUD_PLATFORM,
	ATTR_CLOUD_PROVIDER,
} from '@opentelemetry/semantic-conventions/incubating';
import type { MiddlewareHandler } from 'hono';

import { logger } from '~/lib/logger';

////////////////////////////////////////////////////////////////////////////////

export { context, propagation, SpanKind, SpanStatusCode, TraceFlags, trace };
export type { Attributes, Exception, Span };

export type TraceVariables = {
	span: Span;
	spanId: string;
	traceId?: string;
};

////////////////////////////////////////////////////////////////////////////////
// OTel TraceProvider and Tracer setup

const traceAttributes = {
	[ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'cloud-run-node',
	...(process.env.K_SERVICE && {
		[ATTR_SERVICE_VERSION]: process.env.K_REVISION,
		[ATTR_CLOUD_PROVIDER]: 'gcp',
		[ATTR_CLOUD_PLATFORM]: 'gcp_cloud_run',
	}),
};

let exporter: SpanExporter;
switch (process.env.OTEL_TRACES_EXPORTER) {
	case 'console':
		exporter = new ConsoleSpanExporter();
		break;
	case 'otlp':
	default:
		// NOTE(joel): OTLPTraceExporter exports to
		// `http://localhost:4318/v1/traces` by default.
		exporter = new OTLPTraceExporter();
}

const tracerProvider = new NodeTracerProvider({
	resource: resourceFromAttributes(traceAttributes),
	sampler: new ParentBasedSampler({
		root: new TraceIdRatioBasedSampler(1),
	}),
	spanProcessors: [new BatchSpanProcessor(exporter)],
});

tracerProvider.register();

export const tracer = trace.getTracer(traceAttributes[ATTR_SERVICE_NAME]);

////////////////////////////////////////////////////////////////////////////////

/**
 * Flushes any pending spans and shuts down the tracer provider. Cloud Run
 * sends `SIGTERM` to a container instance before stopping it (e.g. on
 * scale-down or redeploy), so this must be called from a `SIGTERM`/`SIGINT`
 * handler. Without this, spans buffered in the `BatchSpanProcessor` that
 * haven't hit their export interval yet are lost when the process exits.
 */
export async function shutdownTracing() {
	await tracerProvider.shutdown();
}

////////////////////////////////////////////////////////////////////////////////

export interface TraceMiddlewareOptions {
	projectId?: string;
}

/**
 * Middleware to extract trace context from incoming requests and start a new
 * trace span for each request. The span is enriched with relevant attributes
 * and any errors that occur during request processing are recorded in the span.
 */
export function traceMiddleware(
	options: TraceMiddlewareOptions = {},
): MiddlewareHandler<{
	Variables: TraceVariables;
}> {
	const projectId =
		options.projectId ||
		process.env.PROJECT_ID ||
		process.env.GOOGLE_CLOUD_PROJECT ||
		process.env.GCLOUD_PROJECT;

	return async function (c, next) {
		// NOTE(joel): Extract trace context from incoming request headers and
		// start a new trace span for the request.
		const requestContext = propagation.extract(
			context.active(),
			c.req.raw.headers,
			{
				get(carrier, key) {
					return carrier.get(key) || undefined;
				},
				keys(carrier) {
					return [...carrier.keys()];
				},
			},
		);

		await context.with(requestContext, async () => {
			await tracer.startActiveSpan(
				// NOTE(joel): `c.req.routePath` is not yet resolved to the matched
				// route template at this point (it still reports the catch-all
				// `/*`), since routing happens further down the middleware chain.
				// We use the raw method here and rename the span to
				// `{method} {route}` once `next()` resolves and the route has
				// been matched.
				c.req.method,
				{
					attributes: {
						'http.request.method': c.req.method,
						'url.path': c.req.path,
						'url.scheme':
							c.req.raw.headers.get('X-Forwarded-Proto') ||
							new URL(c.req.url).protocol.replace(':', ''),
					},
					kind: SpanKind.SERVER,
				},
				async (span) => {
					const spanContext = span.spanContext();
					c.set('span', span);
					c.set('spanId', spanContext.spanId);

					if (projectId) {
						const sampled =
							(spanContext.traceFlags & TraceFlags.SAMPLED) ===
							TraceFlags.SAMPLED;
						const traceName = `projects/${projectId}/traces/${spanContext.traceId}`;
						c.set('traceId', traceName);
						logger.addContext({
							'logging.googleapis.com/spanId': spanContext.spanId,
							'logging.googleapis.com/trace': traceName,
							'logging.googleapis.com/trace_sampled': sampled,
						});
					}

					try {
						await next();

						// NOTE(joel): The route is now matched, so `c.req.routePath`
						// reports the low-cardinality route template (e.g.
						// `/v1/books/:id`) instead of the raw request path. Use it to
						// name the span per OTel semantic conventions for HTTP servers.
						span.updateName(`${c.req.method} ${c.req.routePath}`);
						span.setAttribute('http.route', c.req.routePath);
						span.setAttribute('http.response.status_code', c.res.status);

						// NOTE(joel): Per OTel semantic conventions for HTTP servers,
						// span status should only be marked as an error for 5xx
						// responses (server faults), not 4xx (expected client errors,
						// e.g. a deliberate `HTTPException(404)`). Hono's global
						// `onError` handler intercepts exceptions thrown by route
						// handlers and converts them into a `Response` before `next()`
						// resolves here, so a `try/catch` around `next()` alone never
						// observes those exceptions. Hono exposes the caught error via
						// `c.error` instead, so we check that here to make sure it's
						// recorded on the span for genuine 5xx failures.
						if (c.res.status >= 500) {
							span.setAttribute('error.type', String(c.res.status));
							if (c.error) span.recordException(c.error as Exception);
							span.setStatus({ code: SpanStatusCode.ERROR });
						}
					} catch (err) {
						span.recordException(err as Exception);
						span.setStatus({ code: SpanStatusCode.ERROR });
						throw err;
					} finally {
						span.end();
					}
				},
			);
		});
	};
}

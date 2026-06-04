import { fileURLToPath } from 'node:url';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { etag } from 'hono/etag';
import { secureHeaders } from 'hono/secure-headers';

import { cors } from '~/lib/cors';
import { HTTPException } from '~/lib/http-exception';
import { logger } from '~/lib/logger';
import { trace } from '~/lib/trace';
import { books } from '~/routes/books';
import type { Variables } from '~/types';

////////////////////////////////////////////////////////////////////////////////

export function build() {
	let app = new Hono<{ Variables: Variables }>();

	// NOTE(joel): Add middlewares for all routes
	app.use(async (_c, next) => {
		await logger.withContext({}, next);
	});
	app.use(secureHeaders());
	app.use(etag());
	app.use(
		cors({
			origin: true, // NOTE(joel): Reflect request origin
			allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
		}),
	);
	app.use(compress());
	app.use(trace({ projectId: process.env.PROJECT_ID }));
	app.use(async (c, next) => {
		let startedAt = Date.now();
		let method = c.req.method;
		let path = c.req.path;

		logger.info('Request started', { method, path });
		await next();
		logger.info('Request finished', {
			method,
			path,
			status: c.res.status,
			durationMs: Date.now() - startedAt,
		});
	});

	// NOTE(joel): Global error handler
	app.onError((err, _c) => {
		let httpErr =
			err instanceof HTTPException
				? err
				: err.message === 'Malformed JSON in request body'
					? new HTTPException(400, {
							code: 'BAD_REQUEST',
							message: err.message,
						})
					: new HTTPException(500, {
							code: 'INTERNAL_SERVER_ERROR',
							message: err.message,
						});
		logger.error({ code: httpErr.code, message: httpErr.message });
		return httpErr.getResponse();
	});

	// NOTE(joel): Add routes
	app.get('/', (c) => {
		logger.info('Healthcheck requested');
		return c.json({ message: 'ok' });
	});

	app.route('/v1/books', books);

	return app;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Starts the Hono app instance and listens for incoming requests.
 */
async function start() {
	let hostname = '0.0.0.0';
	let port = Number(process.env.PORT || 3000);

	let app = build();

	try {
		serve({
			fetch: app.fetch,
			hostname,
			port,
		});

		console.log(`Server running at ${hostname}:${port}`);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

// NOTE(joel): Run the server if this file is the entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	start();
}

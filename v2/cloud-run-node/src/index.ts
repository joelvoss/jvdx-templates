import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { etag } from 'hono/etag';
import { secureHeaders } from 'hono/secure-headers';
import { fileURLToPath } from 'node:url';
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

	// NOTE(joel): Global error handler
	app.onError((err, c) => {
		if (err instanceof HTTPException) {
			logger.error({ code: err.code, message: err.message }, c);
			return err.getResponse();
		}
		logger.error(err.message, c);
		return c.json(
			{ message: `Internal Server Error. Reason: ${err.message}` },
			500,
		);
	});

	// NOTE(joel): Add routes
	app.get('/', c => {
		return c.json({ message: 'ok' });
	});

	app.route('/v1/books', books);

	return app;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Starts the Fastify app instance and listen for incoming requests.
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

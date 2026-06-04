import { randomUUID } from 'node:crypto';

import type { MiddlewareHandler } from 'hono';

import { logger } from '~/lib/logger';

////////////////////////////////////////////////////////////////////////////////

interface TraceOptions {
	projectId?: string;
}

export type TraceVariables = {
	traceId: string;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Trace middleware.
 */
export function trace(
	options: TraceOptions = {},
): MiddlewareHandler<{ Variables: TraceVariables }> {
	let projectId =
		options.projectId ||
		process.env.PROJECT_ID ||
		process.env.GOOGLE_CLOUD_PROJECT ||
		process.env.GCLOUD_PROJECT ||
		'';

	return async function (c, next) {
		// NOTE(joel): Get parent trace id
		let traceHeader = c.req.header('X-Cloud-Trace-Context');
		let traceId = randomUUID().split('-').join('');
		if (traceHeader) {
			[traceId] = traceHeader.split('/');
		}

		if (projectId) {
			let trace = `projects/${projectId}/traces/${traceId}`;
			c.set('traceId', trace);
			logger.addContext({ 'logging.googleapis.com/trace': trace });
		}

		await next();
	};
}

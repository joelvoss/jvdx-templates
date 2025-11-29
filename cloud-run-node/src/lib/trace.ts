import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';

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
	let projectId = options.projectId || '';

	return async function (c, next) {
		// NOTE(joel): Get parent trace id
		let traceHeader = c.req.header('X-Cloud-Trace-Context');
		let traceId = randomUUID().split('-').join('');
		if (traceHeader) {
			[traceId] = traceHeader.split('/');
		}

		c.set('traceId', `projects/${projectId}/traces/${traceId}`);

		await next();
	};
}

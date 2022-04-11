import { isNonNull } from '@/helper/assertions';

import type { Request, Response, NextFunction } from 'express';

////////////////////////////////////////////////////////////////////////////////

const globalLogFields: { 'logging.googleapis.com/trace'?: string } = {};

////////////////////////////////////////////////////////////////////////////////

type TraceOptions = {
	projectId: string;
};

/**
 * trace adds log correlation to nest all log messages beneath a request log in
 * Log Viewer.
 */
export function trace(options: TraceOptions) {
	const { projectId } = options;

	return (req: Request, _: Response, next: NextFunction) => {
		// NOTE(joel): "X-Cloud-Trace-Context: TRACE_ID/SPAN_ID;o=TRACE_TRUE"
		const traceHeader = req.header('X-Cloud-Trace-Context');
		if (isNonNull(traceHeader)) {
			const [trace] = traceHeader.split('/');
			globalLogFields[
				'logging.googleapis.com/trace'
			] = `projects/${projectId}/traces/${trace}`;
		}

		return next();
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * print logs an info message to the console
 */
export function info(message: string) {
	const entry = {
		severity: 'INFO',
		message,
		...globalLogFields,
	};
	// eslint-disable-next-line no-console
	console.log(JSON.stringify(entry));
}

////////////////////////////////////////////////////////////////////////////////

/**
 * error logs an error message to the console
 */
export function error(message: string, ...args: any[]) {
	const entry = {
		severity: 'ERROR',
		message,
		...globalLogFields,
	};
	console.error(JSON.stringify(entry), ...args);
}

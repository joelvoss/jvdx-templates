import type { Context } from 'hono';
import type { Variables } from '~/types';

////////////////////////////////////////////////////////////////////////////////

export type LogMessage = string | Record<string, unknown>;
export type LogContext = Context<{ Variables: Variables }>;

////////////////////////////////////////////////////////////////////////////////

let LogSeverity = {
	INFO: 'INFO',
	WARN: 'WARN',
	ERROR: 'ERROR',
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Log a message to the console.
 */
function log(severity: string, message: LogMessage, c?: LogContext) {
	let traceId = c != null ? c.get('traceId') : null;

	let msg = typeof message === 'string' ? { message } : message;

	console.log(
		JSON.stringify({
			severity,
			...(traceId ? { 'logging.googleapis.com/trace': traceId } : {}),
			...msg,
		}),
	);
}

////////////////////////////////////////////////////////////////////////////////

export let logger = {
	info: (message: LogMessage, c?: LogContext) =>
		log(LogSeverity.INFO, message, c),
	warn: (message: LogMessage, c?: LogContext) =>
		log(LogSeverity.WARN, message, c),
	error: (message: LogMessage, c?: LogContext) =>
		log(LogSeverity.ERROR, message, c),
};

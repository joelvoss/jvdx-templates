import { AsyncLocalStorage } from 'node:async_hooks';

////////////////////////////////////////////////////////////////////////////////

let LogSeverity = {
	INFO: 'INFO',
	WARN: 'WARN',
	ERROR: 'ERROR',
};

////////////////////////////////////////////////////////////////////////////////

interface LogContext {
	[key: string]: unknown;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Serialize an Error object into a plain object for logging purposes.
 */
function serializeError(error: Error) {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Serialize the log context, converting any Error objects into plain objects.
 */
function serializeContext(context: LogContext) {
	return Object.fromEntries(
		Object.entries(context).map(([key, value]) => {
			return [key, value instanceof Error ? serializeError(value) : value];
		}),
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Create a logger that supports structured logging with context.
 */
export function createLogger() {
	const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

	function log(severity: string, message: string, context: LogContext = {}) {
		const metadata = serializeContext({
			...asyncLocalStorage.getStore(),
			...context,
		});
		console.log(JSON.stringify({ ...metadata, severity, message }));
	}

	function addContext(context: LogContext) {
		asyncLocalStorage.enterWith({
			...asyncLocalStorage.getStore(),
			...context,
		});
	}

	return asyncLocalStorage.run({}, () => ({
		addContext,
		info: (message: string, context?: LogContext) =>
			log(LogSeverity.INFO, message, context),
		warn: (message: string, context?: LogContext) =>
			log(LogSeverity.WARN, message, context),
		error: (message: string, context?: LogContext) =>
			log(LogSeverity.ERROR, message, context),
	}));
}

////////////////////////////////////////////////////////////////////////////////

export const logger = createLogger();

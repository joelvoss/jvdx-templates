import { AsyncLocalStorage } from 'node:async_hooks';

import { type MiddlewareHandler } from 'hono';

////////////////////////////////////////////////////////////////////////////////

export type LogMessage = string | Record<string, unknown>;
export interface LogContext {
	[key: string]: unknown;
}

////////////////////////////////////////////////////////////////////////////////

let LogSeverity = {
	INFO: 'INFO',
	WARN: 'WARN',
	ERROR: 'ERROR',
};

////////////////////////////////////////////////////////////////////////////////

/**
 * A simple structured logger that uses AsyncLocalStorage to maintain context
 * across asynchronous operations. Logs are output as JSON strings with a
 * severity level and any additional context provided.
 */
export function createLogger() {
	let asyncLocalStorage = new AsyncLocalStorage<LogContext>();

	/**
	 * Logs a message with the given severity and context. The log entry is a
	 * JSON string that includes the severity, message, and any context from
	 * AsyncLocalStorage merged with the provided context.
	 */
	function log(
		severity: string,
		message: LogMessage,
		context: LogContext = {},
	) {
		let metadata = { ...asyncLocalStorage.getStore(), ...context };
		let msg = typeof message === 'string' ? { message } : message;

		console.log(JSON.stringify({ ...metadata, severity, ...msg }));
	}

	/**
	 * Adds context to the current AsyncLocalStorage store. This allows you to set
	 * context that will be included in all subsequent log entries made within the
	 * same asynchronous execution context.
	 */
	function addContext(context: LogContext) {
		asyncLocalStorage.enterWith({
			...asyncLocalStorage.getStore(),
			...context,
		});
	}

	/**
	 * Runs a callback function within a new AsyncLocalStorage context. This is
	 * useful for isolating context for specific operations, such as handling a
	 * request, so that logs generated within that operation include the relevant
	 * context without affecting other operations.
	 */
	function withContext<T>(context: LogContext, callback: () => T) {
		return asyncLocalStorage.run(context, callback);
	}

	return {
		addContext,
		withContext,
		info: (message: LogMessage, context?: LogContext) =>
			log(LogSeverity.INFO, message, context),
		warn: (message: LogMessage, context?: LogContext) =>
			log(LogSeverity.WARN, message, context),
		error: (message: LogMessage, context?: LogContext) =>
			log(LogSeverity.ERROR, message, context),
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Hono middleware that initializes the logger context for each incoming
 * request. This middleware should be added early in the middleware chain to
 * ensure that all subsequent handlers have access to the logger context.
 */
export function loggerMiddleware(): MiddlewareHandler {
	return async function (_c, next) {
		await logger.withContext({}, next);
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Global logger instance that can be imported and used throughout the
 * application.
 */
export let logger = createLogger();

import { AsyncLocalStorage } from 'node:async_hooks';

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

export function createLogger() {
	let asyncLocalStorage = new AsyncLocalStorage<LogContext>();

	function log(
		severity: string,
		message: LogMessage,
		context: LogContext = {},
	) {
		let metadata = { ...asyncLocalStorage.getStore(), ...context };
		let msg = typeof message === 'string' ? { message } : message;

		console.log(JSON.stringify({ ...metadata, severity, ...msg }));
	}

	function addContext(context: LogContext) {
		asyncLocalStorage.enterWith({
			...asyncLocalStorage.getStore(),
			...context,
		});
	}

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

export let logger = createLogger();

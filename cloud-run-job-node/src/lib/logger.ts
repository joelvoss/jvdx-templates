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

export function createLogger() {
	const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

	function log(severity: string, message: string, context: LogContext = {}) {
		const metadata = { ...asyncLocalStorage.getStore(), ...context };
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

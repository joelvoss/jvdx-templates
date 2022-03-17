/**
 * info logs an info message to the console
 */
export function info(...msg: any[]) {
	// eslint-disable-next-line no-console
	console.log(`info - `, ...msg);
}

/**
 * error logs an error message to the console
 */
export function error(...msg: any[]) {
	// eslint-disable-next-line no-console
	console.error(`err - `, ...msg);
}

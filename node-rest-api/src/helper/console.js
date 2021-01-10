/**
 * print logs an info message to the console
 * @param {string} msg
 */
export function info(msg) {
	// eslint-disable-next-line no-console
	console.log(`info - ${msg}`);
}

/**
 * error logs an error message to the console
 * @param {string} msg
 */
export function error(msg, ...args) {
	console.error(`err - ${msg}`, ...args);
}

// eslint-disable-next-line no-console
const stdout = console.log.bind(console);
const stderr = console.error.bind(console);

/**
 * info logs an info message to the console
 * @param {string} msg
 */
export function info(...msg) {
	stdout(`info - `, ...msg);
}

/**
 * error logs an error message to the console
 * @param {string} msg
 */
export function error(...msg) {
	stderr(`err - `, ...msg);
}

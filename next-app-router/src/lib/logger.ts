/**
 * info logs an informational message.
 */
function info(message: string) {
	console.log(
		JSON.stringify({
			severity: 'NOTICE',
			message,
		}),
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * warn logs a warning message.
 */
function warn(message: string) {
	console.log(
		JSON.stringify({
			severity: 'WARNING',
			message,
		}),
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * error logs an error message.
 */
function error(message: string) {
	console.log(
		JSON.stringify({
			severity: 'ERROR',
			message,
		}),
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * A simple logger that logs messages to the console in a structured format.
 * It provides methods for logging informational, warning, and error messages.
 * Each message is logged as a JSON string with a severity level.
 */
export const log = {
	info,
	warn,
	error,
};

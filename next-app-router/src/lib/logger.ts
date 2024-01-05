export function warn(message: string) {
	// eslint-disable-next-line no-console
	console.log(
		JSON.stringify({
			severity: 'WARNING',
			message,
		}),
	);
}

////////////////////////////////////////////////////////////////////////////////

export function error(message: string) {
	// eslint-disable-next-line no-console
	console.log(
		JSON.stringify({
			severity: 'ERROR',
			message,
		}),
	);
}

export const log = {
	warn,
	error,
};

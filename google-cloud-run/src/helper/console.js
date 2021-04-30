let globalLogFields = {};

/**
 * @typedef {Object} TraceOptions
 * @prop {boolean} [enabled=true]
 * @prop {string} [projectId=]
 */

/**
 * trace
 * @param {{ projectId: string }} [opts={}]
 * @returns
 */
export function trace(opts = {}) {
	return (req, _, done) => {
		if (opts.projectId) {
			const traceHeader = req.header('X-Cloud-Trace-Context');
			if (traceHeader != null && opts.projectId != null) {
				const [trace] = traceHeader.split('/');
				globalLogFields[
					'logging.googleapis.com/trace'
				] = `projects/${opts.projectId}/traces/${trace}`;
			}
		}

		done();
	};
}

/**
 * print logs an info message to the console
 * @param {string} message
 */
export function info(message) {
	const entry = {
		severity: 'INFO',
		message,
		...globalLogFields,
	};
	// eslint-disable-next-line no-console
	console.log(JSON.stringify(entry));
}

/**
 * error logs an error message to the console
 * @param {string} message
 * @param {any|any[]} args
 */
export function error(message, ...args) {
	const entry = {
		severity: 'ERROR',
		message,
		...globalLogFields,
	};
	console.error(JSON.stringify(entry), ...args);
}

/**
 * getHost parses an incoming Request object and returns the host as well
 * as origin, protocol and port.
 * @param {Request} [req=]
 * @returns {{origin: string, protocol: string, host: string, port: string}}
 */
export function getHost(req) {
	const _port = process.env.PORT || '3000';

	let protocol = 'https:';
	let originalHost = `localhost:${_port}`;

	if (req) {
		originalHost =
			req.headers['x-forwarded-host'] || req.headers.host || originalHost;
	} else if (typeof window !== 'undefined') {
		originalHost = window.location.host;
	}

	let [host, port] = originalHost.split(':');

	if (host.indexOf('localhost') > -1) {
		protocol = 'http:';
	}

	const origin = `${protocol}//${host}${port != null ? `:${port}` : ''}`;

	return {
		origin,
		protocol,
		host,
		port,
	};
}

import { isNonNull } from '@/lib/assertions';

import type { IncomingMessage } from 'http';

/**
 * getHost parses an incoming Request object and returns the host as well
 * as origin, protocol and port.
 */
export function getHost<Req extends IncomingMessage>(req?: Req) {
	const _port = process.env.PORT || '3000';

	let protocol = 'https:';
	let originalHost = `localhost:${_port}`;

	if (isNonNull(req)) {
		originalHost =
			(req.headers['x-forwarded-host'] as string) ||
			req.headers.host ||
			originalHost;
	} else if (typeof window !== 'undefined') {
		originalHost = window.location.host || originalHost;
	}

	const [host, port] = originalHost.split(':');

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

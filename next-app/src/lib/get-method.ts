import { isNonNull } from '@/lib/assertions';

import type { IncomingMessage } from 'http';

/**
 * getMethod returns a normalized req method string.
 */
export function getMethod<Req extends IncomingMessage>(req: Req) {
	if (!isNonNull(req.method)) {
		throw new TypeError(`"req.method" required.`);
	}

	return req.method.toUpperCase();
}

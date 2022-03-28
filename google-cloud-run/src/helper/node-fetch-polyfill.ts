import fetch, { Headers, Request, Response } from 'cross-fetch';

/**
 * Polyfill `fetch` in the Node.js environment using cross-fetch instead
 * of node-fetch due to missing types issues with node-fetch. cross-fetch is a
 * light wrapper around node-fetch fixing those type issues.
 */
export function enableFetchPolyfill() {
	if (!global.fetch) {
		global.fetch = fetch;
		global.Headers = Headers;
		global.Request = Request;
		global.Response = Response;
	}
}

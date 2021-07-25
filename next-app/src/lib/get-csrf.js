import { memoize } from 'memoize-lit';
import { getHost } from '@/lib/get-host';
import { request } from 'request-lit';

/**
 * isEqual checks if two sets of arguments are the same after stringifying.
 * @param {any} newArgs
 * @param {any} lastArgs
 * @returns {boolean}
 */
function isEqual(newArgs, lastArgs) {
	// No checks needed if the inputs length has changed
	if (newArgs.length !== lastArgs.length) {
		return false;
	}

	try {
		const strNewArgs = JSON.stringify(newArgs);
		const strLastArgs = JSON.stringify(lastArgs);
		if (strNewArgs !== strLastArgs) {
			return false;
		}
	} catch (e) {
		return false;
	}
	return true;
}

// NOTE(joel): Memoize the `request.get` function for one second to dedupe
// parallel requests and act as a simple "cache" for serial requests happening
// within this timeframe.
const makeRequest = memoize(request.get, { maxAge: 1000, isEqual });

/**
 * @typedef {Object} AppContext
 * @prop {string} pathname
 * @prop {string} query
 * @prop {string} asPath
 * @prop {Request} req
 * @prop {Response} res
 * @prop {Object} err
 */

/**
 * getCsrf fetches a CSRF token from our `/api/csrf` endpoint.
 * If passed 'appContext' via `getInitialProps` in `_app.js` then we get the
 * request object from `ctx` and use that for the `req` value to allow `getCsrf`
 * to work seemlessly in `getInitialProps` on server side pages *and* in
 * `_app.js`
 * @param {{req: Request, ctx: AppContext}} [options={}]
 * @returns
 */
export async function getCsrf(options = {}) {
	const req = options.ctx?.req || options.req;
	const path = options.path || '/api/csrf';
	const { origin } = getHost(req);
	const fetchOptions = req
		? { headers: { cookie: req.headers.cookie }, baseURL: origin }
		: { baseURL: origin };
	const { data } = await makeRequest(path, fetchOptions);
	return data && data.token ? data.token : null;
}

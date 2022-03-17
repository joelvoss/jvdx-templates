import { createHash, randomBytes } from 'crypto';
import { setCookie } from '@/lib/cookies';
import { isNonNull, isOriginAllowed, isString } from '@/lib/assertions';

////////////////////////////////////////////////////////////////////////////////

import type { IncomingMessage, ServerResponse } from 'http';

// @see https://github.com/expressjs/cors#configuration-options
type CSRFOptions = {
	origin?: Array<string | RegExp> | string | RegExp | boolean;
	prefix?: string;
};

export type CSRFRequest = IncomingMessage & {
	body: any;
	cookies: { [key: string]: string };
	csrf?: { token?: string; verified: boolean };
};

type CSRFResponse = ServerResponse;

////////////////////////////////////////////////////////////////////////////////

/**
 * csrf returns a connect style middleware that enhances the Request object
 * with a `csrf` property indicating if the request passed our CSRF check.
 */
export function csrf(options: CSRFOptions = {}) {
	if (!isNonNull(options.origin)) {
		throw new TypeError(`"options.origin" required.`);
	}

	if (!isNonNull(options.prefix)) options.prefix = 'XSRF-TOKEN';

	return (
		req: CSRFRequest,
		res: CSRFResponse,
		done: (result?: any) => void,
	) => {
		const reqOrigin = req.headers.origin || req.headers.host || '';
		const csrfTokenFromHeader = req.headers['x-xsrf-token'];
		const csrfTokenFromBody = req.body?.__csrf;
		req.csrf = { verified: false };

		// NOTE(joel): This follows the cors option signature, see
		// https://github.com/expressjs/cors#configuration-options
		if (!isOriginAllowed(reqOrigin, options.origin)) {
			return done();
		}

		// NOTE(joel): Secret used to salt cookies and tokens (e.g. for CSRF
		// protection). If no secret option is specified then it creates one on the
		// fly based on options passed here.
		const { baseURL, basePath } = parseURL(reqOrigin);
		const secret = createHash('sha256')
			.update(JSON.stringify({ baseURL, basePath }))
			.digest('hex');

		// NOTE(joel): Use secure cookies if the site uses HTTPS. This being
		// conditional allows cookies to work non-HTTPS development URLs. We honour
		// the secure cookie option, which sets 'secure' and also adds cookie
		// prefixes.
		// @see https://googlechrome.github.io/samples/cookie-prefixes/
		const isSecure = baseURL.startsWith('https://');

		// NOTE(joel): The `__Host-` prefix is stricter than the `__Secure-`
		// prefix.
		const tokenName = `${isSecure ? '__Host-' : ''}${options.prefix}`;

		// NOTE(joel): Ensure CSRF Token cookie is set for any subsequent requests.
		// This creates a cookie with the value `token|hash`, where
		// `token` is the CSRF token and `hash` is a hash made of the token itself
		// and secret. By storing the value and the hash of the value (with the
		// secret used as a salt) we can verify the cookie was set by the server
		// and not by a malicous attacker.
		// @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie
		// @see https://owasp.org/www-chapter-london/assets/slides/David_Johansson-Double_Defeat_of_Double-Submit_Cookie.pdf
		if (req.cookies[tokenName]) {
			const [csrfTokenValue, csrfTokenHash] = req.cookies[tokenName].split('|');

			if (
				csrfTokenHash ===
				createHash('sha256').update(`${csrfTokenValue}${secret}`).digest('hex')
			) {
				// NOTE(joel): If the CSRF token in the request matches the cookie we
				// have already verified is set by us, then the token is verified.
				req.csrf.token = csrfTokenValue;
				if (
					req.csrf.token === csrfTokenFromHeader ||
					req.csrf.token === csrfTokenFromBody
				) {
					req.csrf.verified = true;
				}
			}
		}

		if (!req.csrf.token) {
			// NOTE(joel): Create a new token if there is none because it's not been
			// set yet, or because the hash doesn't match (e.g. because it's been
			// modifed or because the secret has changed).
			req.csrf.token = randomBytes(32).toString('hex');
			const newCsrfTokenCookie = `${req.csrf.token}|${createHash('sha256')
				.update(`${req.csrf.token}${secret}`)
				.digest('hex')}`;

			setCookie(res, tokenName, newCsrfTokenCookie, {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: isSecure,
			});
		}

		return done();
	};
}

////////////////////////////////////////////////////////////////////////////////

const HTTPRegExp = new RegExp('^http?://');
const HTTPSRegExp = new RegExp('^https?://');
const TrailingSlashRegExp = new RegExp('/$');

/**
 * parseURL parses a input `url` into both `baseURL` and `basePath`.
 */
function parseURL(url?: string) {
	const defaultProtocol = 'http://';
	const defaultHost = 'localhost:3000';
	const defaultPath = '/api';

	let _url = `${defaultProtocol}${defaultHost}${defaultPath}`;
	if (isString(url) && url !== defaultHost) {
		_url = url;
	}

	// NOTE(joel): Default to HTTPS if no protocol explictly specified
	const protocol = _url.match(HTTPRegExp) ? 'http' : 'https';

	// NOTE(joel): Normalize URLs by stripping protocol and no trailing slash
	_url = _url.replace(HTTPSRegExp, '').replace(TrailingSlashRegExp, '');

	// NOTE(joel): Simple split based on first `/`
	const [_host, ..._path] = _url.split('/');
	const baseURL = _host ? `${protocol}://${_host}` : defaultHost;
	const basePath = _path.length > 0 ? `/${_path.join('/')}` : defaultPath;

	return { baseURL, basePath };
}

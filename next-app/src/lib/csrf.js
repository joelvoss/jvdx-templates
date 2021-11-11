import { createHash, randomBytes } from 'crypto';
import { setCookie } from '@/lib/cookies';
import { isOriginAllowed } from '@/lib/is-origin-allowed';

/**
 * @typedef {Object} CSRFOptions
 * @prop {boolean|string|RegExp|Array<string|RegExp>|Function} origin
 * @prop {string} prefix
 * @see https://github.com/expressjs/cors#configuration-options
 */

/**
 * csrf returns a connect style middleware that enhances the Request object
 * with a `csrf` property indicating if the request passed our CSRF check.
 * @param {CSRFOptions} [options={}]
 * @returns {(req: Reqest, res: Response, done: Function) => void}
 */
export function csrf(options = {}) {
	if (options.origin == null) {
		throw new TypeError(`"options.origin" required.`);
	}

	if (options.prefix == null) options.prefix = 'XSRF-TOKEN';

	return (req, res, done) => {
		const reqOrigin = req.headers.origin;
		const csrfTokenFromHeader = req.headers['x-xsrf-token'];
		const csrfTokenFromBody = req.body?.__csrf;
		req.csrf = { token: null, verified: false };

		// NOTE(joel): This follows the cors option signature, see
		// https://github.com/expressjs/cors#configuration-options
		if (!isOriginAllowed(reqOrigin, options.origin)) {
			return done();
		}

		// NOTE(joel): Secret used to salt cookies and tokens (e.g. for CSRF
		// protection). If no secret option is specified then it creates one on the
		// fly based on options passed here.
		const { baseURL, basePath } = parseURL(options.origin);
		const secret = createHash('sha256')
			.update(JSON.stringify({ baseURL, basePath }))
			.digest('hex');

		// NOTE(joel): Use secure cookies if the site uses HTTPS. This being
		// conditional allows cookies to work non-HTTPS development URLs. We honour
		// the secure cookie option, which sets 'secure' and also adds cookie
		// prefixes.
		// @see https://googlechrome.github.io/samples/cookie-prefixes/
		const isSecure = baseURL.startsWith('https://');

		const csrfTokenSettings = {
			// NOTE(joel): The `__Host-` prefix is stricter than the `__Secure-`
			// prefix.
			name: `${isSecure ? '__Host-' : ''}${options.prefix}`,
			options: {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
				secure: isSecure,
			},
		};

		// NOTE(joel): Ensure CSRF Token cookie is set for any subsequent requests.
		// This creates a cookie with the value `token|hash`, where
		// `token` is the CSRF token and `hash` is a hash made of the token itself
		// and secret. By storing the value and the hash of the value (with the
		// secret used as a salt) we can verify the cookie was set by the server
		// and not by a malicous attacker.
		// @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie
		// @see https://owasp.org/www-chapter-london/assets/slides/David_Johansson-Double_Defeat_of_Double-Submit_Cookie.pdf
		if (req.cookies[csrfTokenSettings.name]) {
			const [csrfTokenValue, csrfTokenHash] =
				req.cookies[csrfTokenSettings.name].split('|');

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
			// NOTE(joel): If no csrfToken - because it's not been set yet, or
			// because the hash doesn't match (e.g. because it's been modifed or
			// because the secret has changed) create a new token.
			req.csrf.token = randomBytes(32).toString('hex');
			const newCsrfTokenCookie = `${req.csrf.token}|${createHash('sha256')
				.update(`${req.csrf.token}${secret}`)
				.digest('hex')}`;

			setCookie(
				res,
				csrfTokenSettings.name,
				newCsrfTokenCookie,
				csrfTokenSettings.options,
			);
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
 * @param {string} url
 * @returns {{baseURL: string, basePath: string}}
 */
function parseURL(url) {
	const defaultHost = 'http://localhost:3000';
	const defaultPath = '/api';

	let _url = `${defaultHost}${defaultPath}`;
	if (typeof url === 'string' || url instanceof String) {
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

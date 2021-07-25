/**
 * isOriginAllowed checks if a given origin is allowed. It follows the CORS
 * option signature.
 * @see https://github.com/expressjs/cors#configuration-options
 * @param {string} origin
 * @param {string[]|string|RegExp|boolean} allowedOrigin
 * @returns {boolean}
 */
export function isOriginAllowed(origin, allowedOrigin) {
	if (Array.isArray(allowedOrigin)) {
		for (let i = 0; i < allowedOrigin.length; ++i) {
			if (isOriginAllowed(origin, allowedOrigin[i])) {
				return true;
			}
		}
		return false;
	} else if (
		typeof allowedOrigin === 'string' ||
		allowedOrigin instanceof String
	) {
		return origin === allowedOrigin;
	} else if (allowedOrigin instanceof RegExp) {
		return allowedOrigin.test(origin);
	}
	return !!allowedOrigin;
}

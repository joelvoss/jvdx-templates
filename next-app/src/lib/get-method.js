/**
 * getMethod returns a normalized req method string.
 * @param {Request} req
 * @returns {string}
 */
export function getMethod(req) {
	return req?.method?.toUpperCase();
}

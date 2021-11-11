/**
 * isEqual checks if two sets of arguments are the same after stringifying.
 * @param {any} newArgs
 * @param {any} lastArgs
 * @returns {boolean}
 */
export function isEqual(newArgs, lastArgs) {
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

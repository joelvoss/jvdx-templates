/**
 * isEqual checks if two sets of arguments are the same after stringifying.
 * @param {array} newArgs
 * @param {array} lastArgs
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

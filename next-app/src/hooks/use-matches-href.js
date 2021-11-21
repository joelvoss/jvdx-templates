import { useRouter } from 'next/router';

/**
 * Hook that matches a given `href` against the current `asPath`.
 * @param {string} href
 * @param {boolean} exact
 * @returns {boolean}
 */
export function useMatchesHref(href, exact) {
	const router = useRouter();
	const { matches } = match(href, router.asPath, exact);
	return matches;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Matches a given url against a path.
 * @param {RegExp | string} path
 * @param {string} url
 * @returns {{ matches: boolean, params: Record<string, string> }}
 */
function match(path, url, strict = false) {
	const expression = path instanceof RegExp ? path : pathToRegExp(path);
	const match = expression.exec(url) || false;

	// NOTE(joel): Matches in strict mode: match string should equal to input
	// Otherwise loose matches will be considered truthy:
	// match('/messages/:id', '/messages/123/users') // -> true
	const matches = strict
		? path instanceof RegExp
			? !!match
			: !!match && match[0] === match.input
		: !!match;

	return {
		matches,
		params: match && matches ? match.groups || null : null,
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a string path to a regular expression.
 * Transforms path parameters into named RegExp groups.
 * @param {string} path
 * @returns {RegExp}
 */
function pathToRegExp(path) {
	const pattern = path
		// NOTE(joel): Escape literal dots
		.replace(/\./g, '\\.')
		// NOTE(joel): Escape literal slashes
		.replace(/\//g, '/')
		// NOTE(joel): Escape literal question marks
		.replace(/\?/g, '\\?')
		// NOTE(joel): Ignore trailing slashes
		.replace(/\/+$/, '')
		// NOTE(joel): Replace wildcard with any zero-to-any character sequence
		.replace(/\*+/g, '.*')
		// NOTE(joel): Replace parameters with named capturing groups
		.replace(
			/:([^\d|^/][a-zA-Z0-9_]*(?=(?:\/|\\.)|$))/g,
			(_, paramName) => `(?<${paramName}>[^/]+?)`,
		)
		// NOTE(joel): Allow optional trailing slash
		.concat('(\\/|$)');

	return new RegExp(pattern, 'gi');
}

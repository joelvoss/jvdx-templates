import { useRouter } from 'next/router';
import { isRegExp } from '@/lib/assertions';

/**
 * Hook that matches a given `href` against the current `asPath`.
 */
export function useMatchesHref(href: string, exact: boolean) {
	const router = useRouter();
	const { matches } = match(href, router.asPath, exact);
	return matches;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Matches a given url against a path.
 */
function match(path: RegExp | string, url: string, strict: boolean = false) {
	const expression = isRegExp(path) ? path : pathToRegExp(path);
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
 */
function pathToRegExp(path: string) {
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

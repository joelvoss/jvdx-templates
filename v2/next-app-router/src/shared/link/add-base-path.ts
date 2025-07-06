const basePath = (process.env.__NEXT_ROUTER_BASEPATH as string) || '';

/**
 * Add the base path to a path, e.g. `/foo` + `/bar` = `/foo/bar`.
 * Set `required` to `true` to always add the base path, even if it's empty.
 * Source: https://github.com/vercel/next.js/blob/canary/packages/next/src/client/add-base-path.ts
 */
export function addBasePath(path: string, required?: boolean): string {
	return normalizePathTrailingSlash(
		process.env.__NEXT_MANUAL_CLIENT_BASE_PATH && !required
			? path
			: addPathPrefix(path, basePath),
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Normalize a path by removing a trailing slash if it exists and adding a
 * leading slash if it's missing.
 */
const normalizePathTrailingSlash = (path: string) => {
	if (!path.startsWith('/') || process.env.__NEXT_MANUAL_TRAILING_SLASH) {
		return path;
	}

	const { pathname, query, hash } = parsePath(path);
	if (process.env.__NEXT_TRAILING_SLASH) {
		if (/\.[^/]+\/?$/.test(pathname)) {
			return `${removeTrailingSlash(pathname)}${query}${hash}`;
		}
		if (pathname.endsWith('/')) {
			return `${pathname}${query}${hash}`;
		}
		return `${pathname}/${query}${hash}`;
	}

	return `${removeTrailingSlash(pathname)}${query}${hash}`;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Remove a trailing slash from a path, e.g. `/foo/` -> `/foo`.
 */
function removeTrailingSlash(route: string) {
	return route.replace(/\/$/, '') || '/';
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Add a prefix to a path, e.g. `/foo` + `/bar` = `/foo/bar`.
 */
function addPathPrefix(path: string, prefix?: string) {
	if (!path.startsWith('/') || !prefix) {
		return path;
	}

	const { pathname, query, hash } = parsePath(path);
	return `${prefix}${pathname}${query}${hash}`;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Parse a URL path with query string and hash into its parts.
 */
function parsePath(path: string) {
	const hashIndex = path.indexOf('#');
	const queryIndex = path.indexOf('?');
	const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex);

	if (hasQuery || hashIndex > -1) {
		return {
			pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
			query: hasQuery
				? path.substring(queryIndex, hashIndex > -1 ? hashIndex : undefined)
				: '',
			hash: hashIndex > -1 ? path.slice(hashIndex) : '',
		};
	}

	return { pathname: path, query: '', hash: '' };
}

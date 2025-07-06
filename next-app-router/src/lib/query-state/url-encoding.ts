/**
 * Converts a URLSearchParams object into a query string.
 * It encodes keys and values to ensure they are safe for use in a URL.
 * It also warns if the resulting URL exceeds a specified maximum length.
 */
export function renderQueryString(search: URLSearchParams) {
	if (search.size === 0) return '';

	const query: string[] = [];
	for (const [key, value] of search.entries()) {
		// Replace disallowed characters in keys,
		// see https://github.com/47ng/nuqs/issues/599
		const safeKey = key
			.replace(/#/g, '%23')
			.replace(/&/g, '%26')
			.replace(/\+/g, '%2B')
			.replace(/=/g, '%3D')
			.replace(/\?/g, '%3F');
		query.push(`${safeKey}=${encodeQueryValue(value)}`);
	}

	const queryString = `?${query.join('&')}`;
	warnIfURLIsTooLong(queryString);
	return queryString;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Encodes a string value for use in a URL query parameter.
 */
function encodeQueryValue(input: string) {
	return (
		input
			// NOTE(joel): Encode existing '%' signs first to avoid appearing as an
			// incomplete escape sequence.
			.replace(/%/g, '%25')
			// NOTE(joel): Spaces are encoded as '+' in RFC 3986, so we pre-encode
			// existing '+' signs to avoid confusion before converting spaces to '+'
			// signs.
			.replace(/\+/g, '%2B')
			.replace(/ /g, '+')
			// NOTE(joel): Encode other URI-reserved characters.
			.replace(/#/g, '%23')
			.replace(/&/g, '%26')
			// NOTE(joel): Encode characters that break URL detection on some
			// platforms and would drop the tail end of the querystring.
			.replace(/"/g, '%22')
			.replace(/'/g, '%27')
			.replace(/`/g, '%60')
			.replace(/</g, '%3C')
			.replace(/>/g, '%3E')
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Encode invisible ASCII control characters
			.replace(/[\x00-\x1F]/g, char => encodeURIComponent(char))
	);
}

////////////////////////////////////////////////////////////////////////////////

const URL_MAX_LENGTH = 2000;

/**
 * Checks if the URL length exceeds a predefined maximum length.
 */
function warnIfURLIsTooLong(queryString: string) {
	if (process.env.NODE_ENV === 'production') return;
	if (typeof location === 'undefined') return;

	const url = new URL(location.href);
	url.search = queryString;
	if (url.href.length > URL_MAX_LENGTH) {
		console.warn(
			'Max safe URL length exceeded. Some browsers may not be able to accept this URL. Consider limiting the amount of state stored in the URL.',
		);
	}
}

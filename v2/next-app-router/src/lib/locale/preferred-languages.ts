type ParsedLanguage = {
	quality: number;
	i: number;
	full: string;
};

// - `^` asserts the start of a line.
// - `\s*` matches any whitespace character (spaces, tabs, line breaks) between
// zero and unlimited times.
// - `([^\s\-;]+)` captures a group of one or more characters that are not a
// whitespace, a dash, or a semicolon. This is typically the primary language
// tag (e.g., "en" in "en-US").
// - `(?:-([^\s;]+))?` is a non-capturing group that optionally matches a dash
// followed by one or more characters that are not a whitespace or a semicolon.
// This is typically the subtag of the language (e.g., "US" in "en-US").
// - `\s*` again matches any whitespace character between zero and unlimited
// times.
// - `(?:;(.*))?` is another non-capturing group that optionally matches a
// semicolon followed by any character (except for line terminators) between
// zero and unlimited times. This could be used to capture any additional
// information or parameters associated with the language tag.
// - `$` asserts the end of a line.
//
// Example matches: "en", "en-US", "fr-CA", etc.
const LANGUAGE_HEADER_REGEXP = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/;

/**
 * Get the preferred languages from an `Accept-Language` header.
 */
export function preferredLanguages(_accept: string | null) {
	// NOTE(joel): RFC 2616 sec 14.4: no header = *
	const accept = _accept === undefined ? '*' : _accept || '';

	const acceptSplits = accept.split(',');
	const accepts: ParsedLanguage[] = [];
	for (let i = 0; i < acceptSplits.length; i++) {
		const match = LANGUAGE_HEADER_REGEXP.exec(acceptSplits[i].trim());
		if (match == null) continue;

		const prefix = match[1];
		const suffix = match[2];
		let full = prefix;
		if (suffix) full += `-${suffix}`;

		let quality = 1;
		if (match[3]) {
			let params = match[3].split(';');
			for (let j = 0; j < params.length; j++) {
				let p = params[j].split('=');
				if (p[0] === 'q') quality = Number.parseFloat(p[1]);
			}
		}

		if (quality === 0) continue;

		accepts.push({ full, quality, i });
	}

	return accepts
		.sort((a, b) => b.quality - a.quality || a.i - b.i || 0)
		.map(spec => spec.full);
}

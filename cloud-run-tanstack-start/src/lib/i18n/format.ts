import type { AbstractIntlMessages } from "~/lib/i18n/config";

////////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves a nested message from the given messages object based on the
 * provided path. The path is a dot-separated string that indicates the
 * hierarchy of keys to access the desired message. If the message is found, it
 * returns the message string; otherwise, it returns `undefined`.
 */
export function getNestedMessage(messages: AbstractIntlMessages, path: string) {
	if (!messages || !path) return undefined;
	return path.split(".").reduce((acc: any, part) => acc && acc[part], messages);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Finds the index of the closing brace in the given text starting from the
 * specified index. It accounts for nested braces by maintaining a balance
 * count. If a closing brace is found that matches the opening brace at the
 * start index, it returns the index of that closing brace. If no matching
 * closing brace is found, it returns -1.
 */
export function findClosingBrace(text: string, startIndex: number): number {
	let balance = 1;
	for (let i = startIndex; i < text.length; i++) {
		const code = text.charCodeAt(i);
		if (code === 123) balance++;
		else if (code === 125) balance--;

		if (balance === 0) return i;
	}
	return -1;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Parses ICU options from the given text. It extracts key-value pairs where
 * the key is a string and the value can be either a nested ICU message
 * (enclosed in braces) or a simple string. The function returns an object
 * mapping keys to their corresponding values, which can be used for processing
 * pluralization and selection in ICU messages.
 */
export function parseICUOptions(text: string): Record<string, string> {
	const options: Record<string, string> = {};

	let i = 0;
	const isWhitespace = (code: number) =>
		code === 32 || code === 9 || code === 10 || code === 13 || code === 160;

	while (i < text.length) {
		let code = text.charCodeAt(i);
		while (isWhitespace(code)) {
			i++;
			if (i >= text.length) break;
			code = text.charCodeAt(i);
		}
		if (i >= text.length) break;

		let start = i;
		while (
			i < text.length &&
			code !== 123 &&
			code !== 125 &&
			!isWhitespace(code)
		) {
			i++;
			if (i >= text.length) break;
			code = text.charCodeAt(i);
		}

		const key = text.slice(start, i);

		while (isWhitespace(code)) {
			i++;
			if (i >= text.length) break;
			code = text.charCodeAt(i);
		}

		if (code === 123) {
			const closeIndex = findClosingBrace(text, i + 1);
			if (closeIndex !== -1) {
				options[key] = text.slice(i + 1, closeIndex);
				i = closeIndex + 1;
			} else {
				break;
			}
		} else {
			i++;
		}
	}

	return options;
}

////////////////////////////////////////////////////////////////////////////////

const numberFormatCache = new Map<string, Intl.NumberFormat>();

/**
 * Retrieves an `Intl.NumberFormat` instance for the given locale. It uses a
 * cache to store previously created instances to improve performance. If an
 * instance for the specified locale does not exist in the cache, it creates a
 * new one, stores it in the cache, and returns it.
 */
export function getNumberFormatter(locale: string) {
	if (!numberFormatCache.has(locale)) {
		numberFormatCache.set(locale, new Intl.NumberFormat(locale));
	}
	return numberFormatCache.get(locale)!;
}

////////////////////////////////////////////////////////////////////////////////

const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Retrieves an `Intl.DateTimeFormat` instance for the given locale and options.
 * It uses a cache to store previously created instances to improve
 * performance. The cache key is a combination of the locale and the
 * stringified options. If an instance for the specified locale and options
 * does not exist in the cache, it creates a new one, stores it in the cache,
 * and returns it.
 */
export function getDateTimeFormatter(
	locale: string,
	options?: Intl.DateTimeFormatOptions,
) {
	const key = `${locale}-${JSON.stringify(options)}`;
	if (!dateTimeFormatCache.has(key)) {
		dateTimeFormatCache.set(key, new Intl.DateTimeFormat(locale, options));
	}
	return dateTimeFormatCache.get(key)!;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Interface defining handlers for processing ICU messages. It includes a
 * method to handle individual values and a method to recursively process
 * nested ICU messages. The `handleValue` method is called for simple
 * placeholders, while the `recurse` method is used for processing nested
 * messages that may contain further ICU syntax.
 */
export interface ICUFormatHandlers<T> {
	handleValue(value: unknown, position: number): T;
	recurse(raw: string, values: Record<string, unknown> | undefined): T;
}

/**
 * Processes an ICU message string by parsing its content and applying the
 * appropriate formatting based on the provided values and locale. It handles
 * pluralization, selection, number formatting, and date/time formatting
 * according to the ICU message syntax. The function returns an array of
 * strings and formatted values that can be used to construct the final
 * formatted message.
 */
export function processICU<T>(
	message: string,
	values: Record<string, unknown> | undefined,
	locale: string,
	handlers: ICUFormatHandlers<T>,
): (string | T)[] {
	const result: (string | T)[] = [];
	let i = 0;

	while (i < message.length) {
		const code = message.charCodeAt(i);

		if (code === 123) {
			const closeIndex = findClosingBrace(message, i + 1);
			if (closeIndex === -1) {
				result.push("{");
				i++;
				continue;
			}

			const content = message.slice(i + 1, closeIndex);
			const firstComma = content.indexOf(",");
			let key = content;
			let type = "";
			let rest = "";

			if (firstComma !== -1) {
				key = content.slice(0, firstComma).trim();
				const restContent = content.slice(firstComma + 1).trim();

				const secondComma = restContent.indexOf(",");
				if (secondComma !== -1) {
					type = restContent.slice(0, secondComma).trim();
					rest = restContent.slice(secondComma + 1).trim();
				} else {
					type = restContent;
				}
			}

			const value = values?.[key];

			if (type === "plural" || type === "selectordinal") {
				const offsetMatch = rest.match(/offset:\s*(\d+)/);
				const offset = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;
				const numValue = (typeof value === "number" ? value : 0) - offset;
				const cleanRest = rest.replace(/offset:\s*\d+/, "");
				const options = parseICUOptions(cleanRest);

				const pluralType = type === "selectordinal" ? "ordinal" : "cardinal";
				let rule = "other";
				try {
					rule = new Intl.PluralRules(locale, { type: pluralType }).select(
						numValue,
					);
				} catch {
					// Fall back to the default branch.
				}

				let selectedRaw =
					options[`=${numValue}`] ?? options[rule] ?? options.other ?? "";

				const formattedNum = getNumberFormatter(locale).format(numValue);
				selectedRaw = selectedRaw.replace(
					/(^|[^{])#(?=([^{]|$))/g,
					`$1${formattedNum}`,
				);

				result.push(handlers.recurse(selectedRaw, values));
			} else if (type === "select") {
				const options = parseICUOptions(rest);
				const selectedRaw = options[String(value)] ?? options.other ?? "";
				result.push(handlers.recurse(selectedRaw, values));
			} else if (type === "number") {
				result.push(getNumberFormatter(locale).format(Number(value || 0)));
			} else if (type === "date" || type === "time") {
				const formatter = getDateTimeFormatter(locale, {
					dateStyle: type === "date" ? "medium" : undefined,
					timeStyle: type === "time" ? "medium" : undefined,
				});
				result.push(
					formatter.format(new Date((value as string | number | Date) || 0)),
				);
			} else {
				result.push(handlers.handleValue(value, i));
			}

			i = closeIndex + 1;
			continue;
		}

		result.push(message[i]);
		i++;
	}

	return result;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Formats a message string containing ICU syntax by processing it with the
 * provided values and locale. It uses the `processICU` function to handle the
 * ICU formatting logic and returns the final formatted message as a string. If
 * the message is empty or not provided, it returns an empty string.
 */
export function formatMessage(
	message: string,
	values: Record<string, unknown> | undefined,
	locale: string,
) {
	if (!message) return "";

	const handlers: ICUFormatHandlers<string> = {
		handleValue: (value) => String(value !== undefined ? value : ""),
		recurse: (raw, vals) => formatMessage(raw, vals, locale),
	};

	return processICU(message, values, locale, handlers).join("");
}

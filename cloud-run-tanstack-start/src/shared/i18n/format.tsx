import { cloneElement, isValidElement, type ReactNode } from "react";

import {
	findClosingBrace,
	type ICUFormatHandlers,
	processICU,
} from "~/lib/i18n/format";

////////////////////////////////////////////////////////////////////////////////

/**
 * Flattens nested segment arrays, collapses adjacent strings, and assigns
 * unique React keys to sibling elements in the resulting array.
 */
function collapseSegments(segments: (string | ReactNode)[]) {
	if (segments.length === 0) return "";

	const collapsed: (string | ReactNode)[] = [];
	const pushFlat = (seg: string | ReactNode) => {
		if (Array.isArray(seg)) {
			for (const item of seg) pushFlat(item);
			return;
		}
		if (
			typeof seg === "string" &&
			collapsed.length > 0 &&
			typeof collapsed[collapsed.length - 1] === "string"
		) {
			collapsed[collapsed.length - 1] += seg;
		} else {
			collapsed.push(
				isValidElement(seg)
					? cloneElement(seg, { key: collapsed.length })
					: seg,
			);
		}
	};

	for (const seg of segments) {
		pushFlat(seg);
	}

	if (collapsed.length === 1 && typeof collapsed[0] === "string") {
		return collapsed[0];
	}

	return collapsed;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves a self-closing tag by looking up the corresponding render function
 * or React element in the values object. Falls back to the raw tag string if
 * missing or if rendering throws.
 */
function resolveSelfClosingTag(
	fullTag: string,
	tagName: string,
	values: Record<string, unknown> | undefined,
): (string | ReactNode)[] {
	const renderFn = values?.[tagName];
	try {
		if (typeof renderFn === "function") {
			return [renderFn(undefined) as ReactNode];
		}
		if (isValidElement(renderFn)) {
			return [renderFn];
		}
		if (!renderFn) return [`<${fullTag}>`];
		return [];
	} catch (error) {
		console.error(`Error rendering tag <${tagName}/>:`, error);
		return [`<${fullTag}>`];
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves a wrapping tag by formatting its inner content and passing the
 * result to the corresponding render function if provided.
 */
function resolveWrappingTag(
	tagName: string,
	innerContent: string,
	values: Record<string, unknown> | undefined,
	locale: string,
): (string | ReactNode)[] {
	const children = formatRichMessage(innerContent, values, locale);
	const renderFn = values?.[tagName];

	try {
		return [
			typeof renderFn === "function"
				? (renderFn(children) as ReactNode)
				: children,
		];
	} catch (error) {
		console.error(`Error rendering tag <${tagName}>:`, error);
		return [children];
	}
}

////////////////////////////////////////////////////////////////////////////////

const TAG_RE = /^[a-zA-Z0-9_-]+(\/)?$/;

/**
 * Finds the index of the matching closing tag for `tagName`, accounting for
 * nested tags with the same name and skipping `{...}` ICU blocks.
 */
function findClosingTag(
	message: string,
	tagName: string,
	fromIndex: number,
): number {
	const openTag = `<${tagName}>`;
	const closeTag = `</${tagName}>`;
	let depth = 1;
	let i = fromIndex;

	while (i < message.length) {
		const code = message.charCodeAt(i);
		if (code === 123) {
			const closeBrace = findClosingBrace(message, i + 1);
			if (closeBrace !== -1) {
				i = closeBrace + 1;
				continue;
			}
		}

		if (message.startsWith(closeTag, i)) {
			depth--;
			if (depth === 0) return i;
			i += closeTag.length;
			continue;
		}

		if (message.startsWith(openTag, i)) {
			depth++;
			i += openTag.length;
			continue;
		}

		i++;
	}

	return -1;
}

/**
 * Formats a rich message by parsing the input string for custom tags,
 * processing any ICU syntax, and replacing tags with corresponding React
 * elements based on the provided values. It handles both self-closing and
 * wrapping tags, allowing for dynamic content rendering while preserving the
 * structure of the message. The function also includes error handling to
 * ensure that any issues during rendering do not break the overall message
 * formatting.
 */
export function formatRichMessage(
	message: string,
	values: Record<string, unknown> | undefined,
	locale: string,
): string | (string | ReactNode)[] {
	if (!message) return "";

	const handlers: ICUFormatHandlers<ReactNode> = {
		handleValue(value) {
			if (isValidElement(value) || Array.isArray(value)) {
				return value as ReactNode;
			}
			return String(value !== undefined ? value : "");
		},
		recurse(raw, vals) {
			return formatRichMessage(raw, vals, locale);
		},
	};

	const result: (string | ReactNode)[] = [];
	let pos = 0;
	let i = 0;

	while (i < message.length) {
		const code = message.charCodeAt(i);
		if (code === 123) {
			const closeBrace = findClosingBrace(message, i + 1);
			if (closeBrace !== -1) {
				i = closeBrace + 1;
				continue;
			}
		}

		if (code !== 60) {
			i++;
			continue;
		}

		const endTagStart = message.indexOf(">", i);
		if (endTagStart === -1) {
			i++;
			continue;
		}

		const fullTag = message.slice(i + 1, endTagStart);
		if (fullTag.startsWith(" ") || !TAG_RE.test(fullTag.split(" ")[0])) {
			i++;
			continue;
		}

		const isSelfClosing = fullTag.endsWith("/");
		const tagName = fullTag.replace("/", "").trim();
		const closingTag = `</${tagName}>`;
		const closingIndex = isSelfClosing
			? -1
			: findClosingTag(message, tagName, endTagStart + 1);

		if (!isSelfClosing && closingIndex === -1) {
			i++;
			continue;
		}

		if (i > pos) {
			result.push(
				...processICU(message.slice(pos, i), values, locale, handlers),
			);
		}

		if (isSelfClosing) {
			result.push(...resolveSelfClosingTag(fullTag, tagName, values));
			pos = endTagStart + 1;
			i = pos;
			continue;
		}

		const innerContent = message.slice(endTagStart + 1, closingIndex);
		result.push(...resolveWrappingTag(tagName, innerContent, values, locale));
		pos = closingIndex + closingTag.length;
		i = pos;
	}

	if (pos < message.length) {
		result.push(...processICU(message.slice(pos), values, locale, handlers));
	}

	return collapseSegments(result);
}

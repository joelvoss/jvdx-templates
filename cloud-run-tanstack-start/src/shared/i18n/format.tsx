import { cloneElement, isValidElement, type ReactNode } from "react";

import { type ICUFormatHandlers, processICU } from "~/lib/i18n/format";

////////////////////////////////////////////////////////////////////////////////

/**
 * Collapses adjacent string segments into a single string and ensures that if
 * the result is a single string, it returns just that string instead of an
 * array. This helps optimize the output of `formatRichMessage` by reducing
 * unnecessary array nesting and concatenating string literals where possible.
 */
function collapseSegments(segments: (string | ReactNode)[]) {
	if (segments.length === 0) return "";

	const collapsed: (string | ReactNode)[] = [];
	for (const seg of segments) {
		if (
			typeof seg === "string" &&
			collapsed.length > 0 &&
			typeof collapsed[collapsed.length - 1] === "string"
		) {
			collapsed[collapsed.length - 1] += seg;
		} else {
			collapsed.push(seg);
		}
	}

	if (collapsed.length === 1 && typeof collapsed[0] === "string") {
		return collapsed[0];
	}

	return collapsed;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Pushes a segment into the result array. If the segment is an array, it
 * spreads its contents into the result; otherwise, it pushes the segment
 * directly.
 */
function pushSegment(result: (string | ReactNode)[], segment: unknown) {
	if (Array.isArray(segment)) {
		result.push(...segment);
	} else {
		result.push(segment as string | ReactNode);
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves a self-closing tag by looking up the corresponding render function
 * in the values object. If the render function exists and returns a valid React
 * element, it clones the element with a unique key and returns it. If the
 * render function does not exist, it returns the original tag as a string. If
 * any error occurs during rendering, it logs the error and returns the original
 * tag as a fallback.
 */
function resolveSelfClosingTag(
	fullTag: string,
	tagName: string,
	values: Record<string, unknown> | undefined,
	position: number,
) {
	const renderFn = values?.[tagName];
	try {
		if (typeof renderFn === "function") {
			const node = renderFn(undefined);
			if (isValidElement(node)) return [cloneElement(node, { key: position })];
			return [node];
		}
		if (isValidElement(renderFn)) {
			return [cloneElement(renderFn, { key: position })];
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
 * Resolves a wrapping tag by processing its inner content and looking up the
 * corresponding render function in the values object. If the render function
 * exists and returns a valid React element, it clones the element with a
 * unique key and returns it. If the render function does not exist, it returns
 * the processed inner content. If any error occurs during rendering, it logs
 * the error and returns the processed inner content as a fallback.
 */
function resolveWrappingTag(
	tagName: string,
	innerContent: string,
	values: Record<string, unknown> | undefined,
	locale: string,
	position: number,
) {
	const children = formatRichMessage(innerContent, values, locale);
	const renderFn = values?.[tagName];

	try {
		if (typeof renderFn === "function") {
			const node = renderFn(children);
			if (isValidElement(node)) return [cloneElement(node, { key: position })];
			return [node];
		}
		if (Array.isArray(children)) {
			return children.map((child, index) =>
				isValidElement(child)
					? cloneElement(child, { key: `${position}-${index}` })
					: child,
			);
		}
		if (isValidElement(children)) {
			return [cloneElement(children, { key: position })];
		}
		return [children];
	} catch (error) {
		console.error(`Error rendering tag <${tagName}>:`, error);
		return Array.isArray(children) ? children : [children];
	}
}

////////////////////////////////////////////////////////////////////////////////

const TAG_RE = /^[a-zA-Z0-9_-]+(\/)?$/;

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
		handleValue(value, position) {
			if (isValidElement(value)) {
				return cloneElement(value, { key: position });
			}
			if (Array.isArray(value)) {
				return value.map((item, index) =>
					isValidElement(item)
						? cloneElement(item, { key: `${position}-${index}` })
						: item,
				);
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
		if (message.charCodeAt(i) !== 60) {
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

		if (i > pos) {
			pushSegment(
				result,
				collapseSegments(
					processICU(message.slice(pos, i), values, locale, handlers),
				),
			);
		}

		const isSelfClosing = fullTag.endsWith("/");
		const tagName = fullTag.replace("/", "").trim();

		if (isSelfClosing) {
			result.push(...resolveSelfClosingTag(fullTag, tagName, values, i));
			pos = endTagStart + 1;
			i = pos;
			continue;
		}

		const closingTag = `</${tagName}>`;
		const closingIndex = message.indexOf(closingTag, endTagStart);

		if (closingIndex === -1) {
			i++;
			continue;
		}

		const innerContent = message.slice(endTagStart + 1, closingIndex);
		result.push(
			...resolveWrappingTag(tagName, innerContent, values, locale, i),
		);
		pos = closingIndex + closingTag.length;
		i = pos;
	}

	if (pos < message.length) {
		pushSegment(
			result,
			collapseSegments(
				processICU(message.slice(pos), values, locale, handlers),
			),
		);
	}

	return collapseSegments(result);
}

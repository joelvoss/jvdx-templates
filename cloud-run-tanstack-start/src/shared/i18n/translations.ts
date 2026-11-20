import type { ReactNode } from "react";

import {
	type AbstractIntlMessages,
	formatMessage,
	getNestedMessage,
} from "~/lib/i18n";
import { formatRichMessage } from "~/shared/i18n/format";

////////////////////////////////////////////////////////////////////////////////

type TranslationValue = string | number | Date | ReactNode;
type TranslationValues = Record<string, TranslationValue>;
type RichTranslationValues = Record<
	string,
	((chunks: ReactNode) => ReactNode) | TranslationValue
>;
type MarkupTranslationValues = Record<
	string,
	((chunks: string) => string) | TranslationValue
>;

export type NamespacePaths<T> = {
	[K in keyof T & string]: T[K] extends Record<string, unknown>
		? K | `${K}.${NamespacePaths<T[K]>}`
		: never;
}[keyof T & string];

export type MessagePaths<T> = {
	[K in keyof T & string]: T[K] extends string
		? K
		: T[K] extends Record<string, unknown>
			? `${K}.${MessagePaths<T[K]>}`
			: never;
}[keyof T & string];

export type ValueAtPath<
	T,
	P extends string,
> = P extends `${infer Head}.${infer Rest}`
	? Head extends keyof T
		? ValueAtPath<T[Head], Rest>
		: never
	: P extends keyof T
		? T[P]
		: never;

export type ScopedMessageKeys<
	T,
	N extends string | undefined = undefined,
> = N extends string ? MessagePaths<ValueAtPath<T, N>> : MessagePaths<T>;

/**
 * The `Translations` interface defines the shape of the translation function
 * returned by the `translations` factory function. It includes:
 * - A callable signature that takes a translation key and optional values,
 *   returning a formatted string.
 * - A `rich` method for handling rich text translations, which can return a
 *   ReactNode or an array of strings and ReactNodes.
 * - A `markup` method for handling translations that include markup, returning
 *   a string.
 * - A `raw` method for retrieving the raw translation value without any
 *   formatting.
 * This interface allows for flexible translation handling, supporting both
 * simple string replacements and more complex rich text scenarios.
 */
export interface Translations<K extends string = string> {
	(key: K, values?: TranslationValues): string;
	rich(key: K, values?: RichTranslationValues): ReactNode;
	markup(key: K, values?: MarkupTranslationValues): string;
	raw(key: K): any;
}

/**
 * The `translations` function is a factory that creates a translation function
 * based on the provided messages, locale, and optional namespace. It returns a
 * function that can be used to retrieve translated strings, as well as handle
 * rich text and markup translations. The returned function includes methods
 * for different translation scenarios, allowing for flexible and efficient
 * internationalization in React applications.
 */
export function translations<
	M extends AbstractIntlMessages = AbstractIntlMessages,
	N extends (string extends keyof M ? string : NamespacePaths<M>) | undefined =
		undefined,
>(
	messages: M,
	locale: string,
	namespace?: N,
): Translations<string extends keyof M ? string : ScopedMessageKeys<M, N>> {
	const namespaceMessages = namespace
		? getNestedMessage(messages, namespace)
		: messages;

	const tFn = ((key: string, values?: TranslationValues) => {
		const message = getNestedMessage(namespaceMessages, key);
		if (typeof message !== "string") {
			if (message === undefined) {
				return `${namespace ? namespace + "." : ""}${key}`;
			}
			return String(message);
		}
		return formatMessage(message, values || {}, locale);
	}) as Translations;

	tFn.rich = (key: string, values?: RichTranslationValues) => {
		const message = getNestedMessage(namespaceMessages, key);
		if (typeof message !== "string") {
			return `${namespace ? namespace + "." : ""}${key}`;
		}
		return formatRichMessage(message, values || {}, locale);
	};

	tFn.markup = (key: string, values?: MarkupTranslationValues) => {
		const message = getNestedMessage(namespaceMessages, key);
		if (typeof message !== "string") {
			return `${namespace ? namespace + "." : ""}${key}`;
		}
		const result = formatRichMessage(message, values || {}, locale);
		if (Array.isArray(result)) return result.join("");
		return String(result);
	};

	tFn.raw = (key: string) => {
		return getNestedMessage(namespaceMessages, key);
	};

	return tFn;
}

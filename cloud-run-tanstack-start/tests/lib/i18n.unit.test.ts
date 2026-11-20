import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
	deLocalizeUrl,
	extractLocaleFromPath,
	formatMessage,
	getDirFromLocale,
	getNestedMessage,
	i18nMiddleware,
	isValidLocale,
	parseLocaleCookie,
	shouldIgnorePath,
} from "~/lib/i18n";
import {
	formatRichMessage,
	serializeMessagesForScript,
	translations,
} from "~/shared/i18n";
import { messages as appMessages, supportedLocales } from "~/translations";

////////////////////////////////////////////////////////////////////////////////

describe("lib/i18n", () => {
	describe("shouldIgnorePath", () => {
		it("ignores /api paths", () => {
			expect(shouldIgnorePath("/api")).toBe(true);
			expect(shouldIgnorePath("/api/health")).toBe(true);
		});

		it("does not ignore non-api paths", () => {
			expect(shouldIgnorePath("/")).toBe(false);
			expect(shouldIgnorePath("/de/books")).toBe(false);
		});
	});

	describe("isValidLocale", () => {
		it("accepts supported locales", () => {
			expect(isValidLocale("en")).toBe(true);
			expect(isValidLocale("de")).toBe(true);
		});

		it("rejects unsupported locales", () => {
			expect(isValidLocale("fr")).toBe(false);
			expect(isValidLocale(undefined)).toBe(false);
		});
	});

	describe("extractLocaleFromPath", () => {
		it("extracts non-default locale from path", () => {
			expect(extractLocaleFromPath("/de")).toBe("de");
			expect(extractLocaleFromPath("/de/books")).toBe("de");
		});

		it("returns null for default locale and invalid locales", () => {
			expect(extractLocaleFromPath("/en")).toBeNull();
			expect(extractLocaleFromPath("/en/books")).toBeNull();
			expect(extractLocaleFromPath("/fr/books")).toBeNull();
			expect(extractLocaleFromPath("/books")).toBeNull();
		});
	});

	describe("deLocalizeUrl", () => {
		it("removes locale prefix from URL path", () => {
			const url = new URL("https://example.com/de/about");
			const out = deLocalizeUrl(url);
			expect(out.pathname).toBe("/about");
		});

		it("removes locale prefix for root locale paths", () => {
			const url = new URL("https://example.com/de");
			const out = deLocalizeUrl(url);
			expect(out.pathname).toBe("/");
		});

		it("does not modify ignored paths", () => {
			const url = new URL("https://example.com/api/de/about");
			const out = deLocalizeUrl(url);
			expect(out.pathname).toBe("/api/de/about");
		});
	});

	describe("parseLocaleCookie", () => {
		it("parses the __app_locale cookie", () => {
			expect(parseLocaleCookie("__app_locale=de")).toBe("de");
			expect(parseLocaleCookie("foo=bar; __app_locale=en")).toBe("en");
		});

		it("returns null for unrelated cookies", () => {
			expect(parseLocaleCookie("locale=de")).toBeNull();
			expect(parseLocaleCookie(null)).toBeNull();
		});

		it("decodes encoded cookie values", () => {
			expect(parseLocaleCookie("__app_locale=de%2DDE")).toBe("de-DE");
		});
	});

	describe("getNestedMessage", () => {
		it("retrieves nested values by dot-path", () => {
			const messages = { nav: { books: "Books" } };
			expect(getNestedMessage(messages, "nav.books")).toBe("Books");
		});

		it("returns undefined for missing paths", () => {
			const messages = { nav: { books: "Books" } };
			expect(getNestedMessage(messages, "nav.missing")).toBeUndefined();
		});
	});

	describe("formatMessage", () => {
		it("interpolates simple variables", () => {
			expect(formatMessage("Hello {name}", { name: "World" }, "en")).toBe(
				"Hello World",
			);
		});

		it("formats numbers", () => {
			const out = formatMessage("Value: {n, number}", { n: 1234 }, "en");
			expect(out).toContain("1,234");
		});

		it("formats dates/times", () => {
			const out = formatMessage(
				"Date: {d, date}",
				{ d: new Date("2024-01-02T12:00:00.000Z") },
				"en",
			);
			expect(out).toContain("2024");
		});

		it("handles select", () => {
			const msg =
				"{gender, select, male {He} female {She} other {They}} liked it";
			expect(formatMessage(msg, { gender: "male" }, "en")).toBe("He liked it");
			expect(formatMessage(msg, { gender: "other" }, "en")).toBe(
				"They liked it",
			);
		});

		it("handles plural with explicit equals and # replacement", () => {
			const msg = "{n, plural, =0 {no guests} one {# guest} other {# guests}}";
			expect(formatMessage(msg, { n: 0 }, "en")).toBe("no guests");
			expect(formatMessage(msg, { n: 1 }, "en")).toBe("1 guest");
			expect(formatMessage(msg, { n: 2 }, "en")).toBe("2 guests");
		});

		it("supports plural offset with explicit matches before offset subtraction", () => {
			const msg =
				"{n, plural, offset:1 =0 {nobody} =1 {only you} one {you and # other} other {you and # others}}";
			expect(formatMessage(msg, { n: 0 }, "en")).toBe("nobody");
			expect(formatMessage(msg, { n: 1 }, "en")).toBe("only you");
			expect(formatMessage(msg, { n: 2 }, "en")).toBe("you and 1 other");
			expect(formatMessage(msg, { n: 3 }, "en")).toBe("you and 2 others");

			expect(
				formatMessage(
					"{n, plural, other {# authors with {m, plural, one {# book} other {# books}}}}",
					{ n: 2, m: 1 },
					"en",
				),
			).toBe("2 authors with 1 book");
			expect(
				formatMessage(
					"{n, plural, other {#{suffix}}}",
					{ n: 2, suffix: "!" },
					"en",
				),
			).toBe("2!");
			expect(
				formatMessage(
					"{n, plural, other {Use offset: 2 for # items}}",
					{ n: 3 },
					"en",
				),
			).toBe("Use offset: 2 for 3 items");
		});

		it("supports rich tags inside ICU plural branches, nested tags, and unique keys", () => {
			const pluralMsg =
				"{n, plural, one {<strong>#</strong> book} other {<strong>#</strong> books}}";
			const pluralOut = formatRichMessage(
				pluralMsg,
				{
					n: 2,
					strong: (chunks: any) =>
						createElement("strong", { "data-testid": "strong" }, chunks),
				},
				"en",
			);

			expect(Array.isArray(pluralOut)).toBe(true);
			if (!Array.isArray(pluralOut)) return;
			expect(isValidElement(pluralOut[0])).toBe(true);
			expect((pluralOut[0] as any).props.children).toBe("2");
			expect(pluralOut[1]).toBe(" books");

			const multiOut = formatRichMessage(
				"{a, plural, other {<strong>#</strong>}} and {b, plural, other {<strong>#</strong>}}",
				{
					a: 1,
					b: 2,
					strong: (chunks: any) => createElement("strong", null, chunks),
				},
				"en",
			);
			expect(Array.isArray(multiOut)).toBe(true);
			if (!Array.isArray(multiOut)) return;
			const multiKeys = multiOut
				.filter((seg) => isValidElement(seg))
				.map((el) => el.key);
			expect(multiKeys).toHaveLength(2);
			expect(new Set(multiKeys).size).toBe(2);
			expect(multiKeys.every((key) => key !== null)).toBe(true);

			const nestedMsg = "<box>outer <box>inner</box></box>";
			const nestedOut = formatRichMessage(
				nestedMsg,
				{
					box: (chunks: any) =>
						`[${Array.isArray(chunks) ? chunks.join("") : chunks}]`,
				},
				"en",
			);
			expect(nestedOut).toBe("[outer [inner]]");

			const unbalancedOut = formatRichMessage(
				"Hello <box>outer <box>inner</box>",
				{
					box: (chunks: any) =>
						`[${Array.isArray(chunks) ? chunks.join("") : chunks}]`,
				},
				"en",
			);
			expect(unbalancedOut).toBe("Hello <box>outer [inner]");
		});

		it("supports rich tag rendering via formatRichMessage", () => {
			const msg = "Hello <strong>{name}</strong><br/>!";
			const out = formatRichMessage(
				msg,
				{
					name: "World",
					strong: (chunks: any) =>
						createElement("strong", { "data-testid": "strong" }, chunks),
					br: () => createElement("br", { "data-testid": "br" }),
				},
				"en",
			);

			expect(Array.isArray(out)).toBe(true);
			if (!Array.isArray(out)) return;

			const elements = out.filter((x) => isValidElement(x));
			expect(elements.some((el) => (el as any).type === "strong")).toBe(true);
			expect(elements.some((el) => (el as any).type === "br")).toBe(true);
		});
	});

	describe("translations", () => {
		it("resolves namespace and formats messages", () => {
			const messages = {
				ns: {
					greet: "Hello {name}",
					bold: "<strong>{name}</strong>",
				},
			};

			const t = translations(messages, "en", "ns");
			expect(t("greet", { name: "Joel" })).toBe("Hello Joel");

			const markup = t.markup("bold", {
				name: "Joel",
				strong: (chunks: string) => `<strong>${chunks}</strong>`,
			});
			expect(markup).toBe("<strong>Joel</strong>");
		});

		it("falls back to key when missing", () => {
			const messages = { ns: { greet: "hi" } };
			const t = translations(messages, "en", "ns");
			expect(t("missing" as never)).toBe("ns.missing");
		});
	});

	describe("serializeMessagesForScript", () => {
		it("escapes HTML-sensitive characters for inline scripts", () => {
			const serialized = serializeMessagesForScript({
				message: '</script><script>alert("xss")</script>',
			});

			expect(serialized).not.toContain("</script>");
			expect(serialized).toContain("\\u003c/script\\u003e");
			expect(serialized).toContain("\\u003cscript\\u003ealert");
		});
	});

	describe("getDirFromLocale", () => {
		it("returns rtl for known bidi locales", () => {
			expect(getDirFromLocale("ar")).toBe("rtl");
			expect(getDirFromLocale("ar-EG")).toBe("rtl");
		});

		it("returns ltr otherwise", () => {
			expect(getDirFromLocale("en")).toBe("ltr");
			expect(getDirFromLocale("")).toBe("ltr");
		});
	});

	describe("i18nMiddleware", () => {
		it("skips ignored paths", () => {
			const request = new Request("https://example.com/api/health");
			const result = i18nMiddleware(request);
			expect(result).toEqual({});
		});

		it("redirects default locale paths to non-locale URLs", () => {
			const request = new Request("https://example.com/en/books");
			const result = i18nMiddleware(request);

			expect(result.redirect).toBeInstanceOf(Response);
			expect(result.redirect?.status).toBe(301);
			expect(result.redirect?.headers.get("location")).toBe(
				"https://example.com/books",
			);
		});

		it("redirects localized ignored paths to non-localized paths", () => {
			const request = new Request("https://example.com/de/api/health");
			const result = i18nMiddleware(request);

			expect(result.redirect).toBeInstanceOf(Response);
			expect(result.redirect?.status).toBe(301);
			expect(result.redirect?.headers.get("location")).toBe(
				"https://example.com/api/health",
			);
		});

		it("sets the locale cookie when URL locale differs", () => {
			const request = new Request("https://example.com/de/books", {
				headers: { cookie: "__app_locale=en" },
			});
			const result = i18nMiddleware(request);

			expect(result.setCookie).toContain("__app_locale=de");
			expect(result.setCookie).toContain("Path=/");
		});

		it("does not set cookie when locale matches", () => {
			const request = new Request("https://example.com/de/books", {
				headers: { cookie: "__app_locale=de" },
			});
			const result = i18nMiddleware(request);
			expect(result).toEqual({});
		});
	});

	describe("translation catalogs", () => {
		function collectLeafKeys(
			obj: Record<string, unknown>,
			prefix = "",
		): string[] {
			return Object.entries(obj)
				.flatMap(([key, value]) => {
					const path = prefix ? `${prefix}.${key}` : key;
					if (typeof value === "string") return [path];
					if (value && typeof value === "object") {
						return collectLeafKeys(value as Record<string, unknown>, path);
					}
					return [];
				})
				.sort();
		}

		it("keeps identical non-empty leaf keys across all locale catalogs", () => {
			const [baseLocale, ...otherLocales] = supportedLocales;
			const baseKeys = collectLeafKeys(appMessages[baseLocale]);
			expect(baseKeys).toContain("shared.notfound.goBack");

			for (const locale of otherLocales) {
				const localeKeys = collectLeafKeys(appMessages[locale]);
				expect(localeKeys).toEqual(baseKeys);
			}

			for (const locale of supportedLocales) {
				for (const key of baseKeys) {
					const value = getNestedMessage(appMessages[locale], key);
					expect(typeof value, `${locale}.${key}`).toBe("string");
					expect((value as string).length, `${locale}.${key}`).toBeGreaterThan(
						0,
					);
				}
			}
		});
	});
});

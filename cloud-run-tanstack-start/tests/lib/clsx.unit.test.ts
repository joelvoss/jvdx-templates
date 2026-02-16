import { describe, expect, it } from "vitest";

import { clsx } from "~/lib/clsx";

////////////////////////////////////////////////////////////////////////////////

describe("lib/clsx", () => {
	describe("strings", () => {
		it("returns an empty string for no arguments", () => {
			expect(clsx()).toBe("");
		});

		it("returns a single class name", () => {
			expect(clsx("foo")).toBe("foo");
		});

		it("joins multiple class names", () => {
			expect(clsx("foo", "bar")).toBe("foo bar");
		});

		it("handles empty strings", () => {
			expect(clsx("", "foo", "")).toBe("foo");
			expect(clsx("foo", "", "bar")).toBe("foo bar");
		});
	});

	describe("numbers", () => {
		it("handles numeric values", () => {
			expect(clsx(1)).toBe("1");
			expect(clsx(0)).toBe("");
			expect(clsx(42, 100)).toBe("42 100");
		});

		it("mixes strings and numbers", () => {
			expect(clsx("foo", 1, "bar")).toBe("foo 1 bar");
		});
	});

	describe("falsy values", () => {
		it("ignores null", () => {
			expect(clsx(null)).toBe("");
			expect(clsx("foo", null, "bar")).toBe("foo bar");
		});

		it("ignores undefined", () => {
			expect(clsx(undefined)).toBe("");
			expect(clsx("foo", undefined, "bar")).toBe("foo bar");
		});

		it("ignores false", () => {
			expect(clsx(false)).toBe("");
			expect(clsx("foo", false, "bar")).toBe("foo bar");
		});

		it("ignores true (boolean true is not added)", () => {
			expect(clsx(true)).toBe("");
		});

		it("ignores 0", () => {
			expect(clsx(0)).toBe("");
			expect(clsx("foo", 0, "bar")).toBe("foo bar");
		});
	});

	describe("arrays", () => {
		it("handles arrays of strings", () => {
			expect(clsx(["foo", "bar"])).toBe("foo bar");
		});

		it("handles nested arrays", () => {
			expect(clsx(["foo", ["bar", "baz"]])).toBe("foo bar baz");
		});

		it("handles deeply nested arrays", () => {
			expect(clsx(["foo", ["bar", ["baz", "qux"]]])).toBe("foo bar baz qux");
		});

		it("handles empty arrays", () => {
			expect(clsx([])).toBe("");
			expect(clsx("foo", [], "bar")).toBe("foo bar");
		});

		it("filters falsy values in arrays", () => {
			expect(clsx(["foo", null, "bar", undefined, false])).toBe("foo bar");
		});

		it("handles arrays with mixed types", () => {
			expect(clsx(["foo", 1, { bar: true }])).toBe("foo 1 bar");
		});
	});

	describe("objects", () => {
		it("includes keys with truthy values", () => {
			expect(clsx({ foo: true })).toBe("foo");
			expect(clsx({ foo: true, bar: true })).toBe("foo bar");
		});

		it("excludes keys with falsy values", () => {
			expect(clsx({ foo: false })).toBe("");
			expect(clsx({ foo: null })).toBe("");
			expect(clsx({ foo: undefined })).toBe("");
			expect(clsx({ foo: 0 })).toBe("");
			expect(clsx({ foo: "" })).toBe("");
		});

		it("handles mixed truthy and falsy values", () => {
			expect(clsx({ foo: true, bar: false, baz: true })).toBe("foo baz");
		});

		it("handles objects with non-boolean truthy values", () => {
			expect(clsx({ foo: 1, bar: "yes", baz: [] })).toBe("foo bar baz");
		});

		it("handles empty objects", () => {
			expect(clsx({})).toBe("");
		});
	});

	describe("mixed arguments", () => {
		it("handles strings, arrays, and objects together", () => {
			expect(clsx("foo", ["bar", "baz"], { qux: true })).toBe(
				"foo bar baz qux",
			);
		});

		it("handles complex combinations", () => {
			expect(
				clsx(
					"base",
					undefined,
					["array-class", null],
					{ "object-class": true, "disabled-class": false },
					"final",
				),
			).toBe("base array-class object-class final");
		});

		it("handles conditional classes pattern", () => {
			const isActive = true;
			const isDisabled = false;
			expect(
				clsx("btn", isActive && "btn-active", isDisabled && "btn-disabled"),
			).toBe("btn btn-active");
		});

		it("handles object spread pattern", () => {
			const conditionalClasses = {
				"is-active": true,
				"is-hidden": false,
			};
			expect(clsx("component", conditionalClasses)).toBe("component is-active");
		});
	});

	describe("edge cases", () => {
		it("handles whitespace in class names", () => {
			expect(clsx("foo bar")).toBe("foo bar");
		});

		it("handles negative numbers", () => {
			expect(clsx(-1)).toBe("-1");
		});

		it("handles decimal numbers", () => {
			expect(clsx(3.14)).toBe("3.14");
		});

		it("handles many arguments", () => {
			expect(clsx("a", "b", "c", "d", "e", "f")).toBe("a b c d e f");
		});
	});
});

import { describe, expect, it } from "vitest";

import { pick } from "~/lib/pick";

////////////////////////////////////////////////////////////////////////////////

describe("lib/pick", () => {
	describe("basic functionality", () => {
		it("picks a single property from an object", () => {
			const obj = { a: 1, b: 2, c: 3 };
			expect(pick(["a"], obj)).toEqual({ a: 1 });
		});

		it("picks multiple properties from an object", () => {
			const obj = { a: 1, b: 2, c: 3 };
			expect(pick(["a", "c"], obj)).toEqual({ a: 1, c: 3 });
		});

		it("picks all properties when all keys are specified", () => {
			const obj = { a: 1, b: 2 };
			expect(pick(["a", "b"], obj)).toEqual({ a: 1, b: 2 });
		});

		it("returns an empty object when no properties are specified", () => {
			const obj = { a: 1, b: 2, c: 3 };
			expect(pick([], obj)).toEqual({});
		});
	});

	describe("different value types", () => {
		it("picks string values", () => {
			const obj = { name: "Alice", city: "Paris" };
			expect(pick(["name"], obj)).toEqual({ name: "Alice" });
		});

		it("picks boolean values", () => {
			const obj = { active: true, verified: false };
			expect(pick(["active", "verified"], obj)).toEqual({
				active: true,
				verified: false,
			});
		});

		it("picks null and undefined values", () => {
			const obj = { a: null, b: undefined, c: 1 };
			expect(pick(["a", "b"], obj)).toEqual({ a: null, b: undefined });
		});

		it("picks nested objects", () => {
			const obj = { user: { name: "Alice" }, count: 5 };
			expect(pick(["user"], obj)).toEqual({ user: { name: "Alice" } });
		});

		it("picks array values", () => {
			const obj = { items: [1, 2, 3], name: "list" };
			expect(pick(["items"], obj)).toEqual({ items: [1, 2, 3] });
		});

		it("picks function values", () => {
			const fn = () => "hello";
			const obj = { greet: fn, name: "test" };
			const result = pick(["greet"], obj);
			expect(result.greet).toBe(fn);
		});
	});

	describe("edge cases", () => {
		it("handles an empty object", () => {
			const obj = {};
			expect(pick([], obj)).toEqual({});
		});

		it("returns a new object (does not mutate original)", () => {
			const obj = { a: 1, b: 2 };
			const result = pick(["a"], obj);
			expect(result).not.toBe(obj);
			expect(obj).toEqual({ a: 1, b: 2 });
		});

		it("preserves reference equality for nested objects", () => {
			const nested = { x: 1 };
			const obj = { a: nested, b: 2 };
			const result = pick(["a"], obj);
			expect(result.a).toBe(nested);
		});

		it("handles objects with symbol keys (only picks string keys)", () => {
			const sym = Symbol("test");
			const obj = { a: 1, [sym]: 2 } as { a: number };
			expect(pick(["a"], obj)).toEqual({ a: 1 });
		});
	});

	describe("type safety", () => {
		it("maintains correct types for picked properties", () => {
			interface User {
				id: number;
				name: string;
				email: string;
			}
			const user: User = { id: 1, name: "Alice", email: "alice@example.com" };
			const result = pick(["id", "name"], user);

			expect(result).toEqual({ id: 1, name: "Alice" });
			expect(result.id).toBe(1);
			expect(result.name).toBe("Alice");
		});
	});
});

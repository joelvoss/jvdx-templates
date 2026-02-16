import { describe, expect, it } from "vitest";

import { uid } from "~/lib/uid";

////////////////////////////////////////////////////////////////////////////////

describe("lib/uid", () => {
	it("returns default length when no length is provided", () => {
		expect(uid()).toHaveLength(11);
	});

	it("returns default length when length is 0", () => {
		expect(uid(0)).toHaveLength(11);
	});

	it("returns the requested length", () => {
		expect(uid(6)).toHaveLength(6);
		expect(uid(24)).toHaveLength(24);
	});

	it("returns lowercase hex characters", () => {
		const value = uid(32);
		expect(value).toMatch(/^[0-9a-f]+$/);
	});
});

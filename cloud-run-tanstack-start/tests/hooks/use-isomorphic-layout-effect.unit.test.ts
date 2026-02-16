import { describe, expect, it, vi } from "vitest";

import { useIsomorphicLayoutEffect } from "~/hooks/use-isomorphic-layout-effect";

describe("useIsomorphicLayoutEffect", () => {
	describe("server-side behavior", () => {
		it("is a no-op function on the server", () => {
			// In Node.js environment, document is undefined, so the hook should be
			// a no-op.
			expect(typeof document).toBe("undefined");
			expect(useIsomorphicLayoutEffect).toBeTypeOf("function");
		});

		it("does not execute the effect callback on the server", () => {
			const effectFn = vi.fn();

			// Call the hook directly (simulating what React would do)
			useIsomorphicLayoutEffect(effectFn);

			// On server, the effect should never be called
			expect(effectFn).not.toHaveBeenCalled();
		});

		it("does not execute cleanup function on the server", () => {
			const cleanupFn = vi.fn();
			const effectFn = vi.fn(() => cleanupFn);

			useIsomorphicLayoutEffect(effectFn);

			// Neither the effect nor cleanup should be called
			expect(effectFn).not.toHaveBeenCalled();
			expect(cleanupFn).not.toHaveBeenCalled();
		});

		it("ignores dependencies on the server", () => {
			const effectFn = vi.fn();

			useIsomorphicLayoutEffect(effectFn, [1, 2, 3]);
			useIsomorphicLayoutEffect(effectFn, []);
			useIsomorphicLayoutEffect(effectFn);

			// None of these calls should trigger the effect
			expect(effectFn).not.toHaveBeenCalled();
		});

		it("returns undefined (no cleanup needed)", () => {
			const effectFn = vi.fn(() => () => {});

			const result = useIsomorphicLayoutEffect(effectFn);

			expect(result).toBeUndefined();
		});
	});
});

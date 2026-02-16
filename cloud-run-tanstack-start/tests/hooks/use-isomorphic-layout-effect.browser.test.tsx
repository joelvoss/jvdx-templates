import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useIsomorphicLayoutEffect } from "~/hooks/use-isomorphic-layout-effect";

describe("useIsomorphicLayoutEffect", () => {
	describe("client-side behavior", () => {
		it("runs the effect on mount", async () => {
			const effectFn = vi.fn();

			function TestComponent() {
				useIsomorphicLayoutEffect(effectFn);
				return <div data-testid="target">Test</div>;
			}

			await render(<TestComponent />);

			expect(effectFn).toHaveBeenCalled();
		});

		it("runs the cleanup function on unmount", async () => {
			const cleanupFn = vi.fn();

			function TestComponent() {
				useIsomorphicLayoutEffect(() => {
					return cleanupFn;
				});
				return <div data-testid="target">Test</div>;
			}

			const { unmount } = await render(<TestComponent />);

			expect(cleanupFn).not.toHaveBeenCalled();

			unmount();

			expect(cleanupFn).toHaveBeenCalled();
		});

		it("re-runs the effect when dependencies change", async () => {
			const effectFn = vi.fn();

			function TestComponent({ value }: { value: number }) {
				useIsomorphicLayoutEffect(() => {
					effectFn(value);
				}, [value]);
				return <div data-testid="target">{value}</div>;
			}

			const { rerender } = await render(<TestComponent value={1} />);

			expect(effectFn).toHaveBeenLastCalledWith(1);

			await rerender(<TestComponent value={2} />);

			expect(effectFn).toHaveBeenLastCalledWith(2);
		});

		it("does not re-run when dependencies have not changed", async () => {
			const effectFn = vi.fn();

			function TestComponent({
				value,
				other,
			}: {
				value: number;
				other: string;
			}) {
				useIsomorphicLayoutEffect(() => {
					effectFn(value);
				}, [value]);
				return (
					<div data-testid="target">
						{value}-{other}
					</div>
				);
			}

			const { rerender } = await render(<TestComponent value={1} other="a" />);

			const callCount = effectFn.mock.calls.length;

			await rerender(<TestComponent value={1} other="b" />);

			// Effect should not have been called again since `value` didn't change
			expect(effectFn.mock.calls.length).toBe(callCount);
		});

		it("runs cleanup before re-running effect", async () => {
			const calls: string[] = [];

			function TestComponent({ value }: { value: number }) {
				useIsomorphicLayoutEffect(() => {
					calls.push(`effect-${value}`);
					return () => {
						calls.push(`cleanup-${value}`);
					};
				}, [value]);
				return <div data-testid="target">{value}</div>;
			}

			const { rerender } = await render(<TestComponent value={1} />);

			await rerender(<TestComponent value={2} />);

			// Cleanup of previous effect should run before the new effect
			expect(calls).toContain("effect-1");
			expect(calls).toContain("cleanup-1");
			expect(calls).toContain("effect-2");
			expect(calls.indexOf("cleanup-1")).toBeLessThan(
				calls.indexOf("effect-2"),
			);
		});

		it("runs synchronously during render (layout effect behavior)", async () => {
			const order: string[] = [];

			function TestComponent() {
				const ref = useRef<HTMLDivElement>(null);

				useIsomorphicLayoutEffect(() => {
					// Layout effect runs synchronously after DOM mutations
					// but before the browser paints
					if (ref.current) {
						order.push("layout-effect");
					}
				});

				order.push("render");

				return (
					<div ref={ref} data-testid="target">
						Test
					</div>
				);
			}

			await render(<TestComponent />);

			// Layout effect should run after render but synchronously
			expect(order).toContain("render");
			expect(order).toContain("layout-effect");
		});

		it("can access DOM elements synchronously", async () => {
			let measuredWidth: number | null = null;

			function TestComponent() {
				const ref = useRef<HTMLDivElement>(null);

				useIsomorphicLayoutEffect(() => {
					if (ref.current) {
						measuredWidth = ref.current.offsetWidth;
					}
				});

				return (
					<div ref={ref} data-testid="target" style={{ width: "100px" }}>
						Test
					</div>
				);
			}

			await render(<TestComponent />);

			// Layout effect should have measured the DOM element
			expect(measuredWidth).toBe(100);
		});

		it("works with state updates inside the effect", async () => {
			function TestComponent() {
				const [value, setValue] = useState(0);

				useIsomorphicLayoutEffect(() => {
					if (value === 0) {
						setValue(1);
					}
				}, [value]);

				return <div data-testid="value">{value}</div>;
			}

			const screen = await render(<TestComponent />);

			await expect.element(screen.getByTestId("value")).toHaveTextContent("1");
		});
	});
});

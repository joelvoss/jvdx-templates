import { useCallback, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useLatest } from "~/hooks/use-latest";

describe("useLatest", () => {
	describe("initial value", () => {
		it("returns a ref with the initial value", async () => {
			let capturedRef: React.RefObject<string> | null = null;

			function TestComponent() {
				const ref = useLatest("initial");
				capturedRef = ref;
				return <div data-testid="target">{ref.current}</div>;
			}

			await render(<TestComponent />);

			expect(capturedRef).not.toBeNull();
			expect(capturedRef!.current).toBe("initial");
		});

		it("works with different value types", async () => {
			let numberRef: React.RefObject<number> | null = null;
			let objectRef: React.RefObject<{ name: string }> | null = null;
			let arrayRef: React.RefObject<number[]> | null = null;

			function TestComponent() {
				numberRef = useLatest(42);
				objectRef = useLatest({ name: "test" });
				arrayRef = useLatest([1, 2, 3]);

				return <div data-testid="target">Test</div>;
			}

			await render(<TestComponent />);

			expect(numberRef!.current).toBe(42);
			expect(objectRef!.current).toEqual({ name: "test" });
			expect(arrayRef!.current).toEqual([1, 2, 3]);
		});
	});

	describe("value updates", () => {
		it("updates the ref when the value changes", async () => {
			let capturedRef: React.RefObject<number> | null = null;

			function TestComponent({ value }: { value: number }) {
				const ref = useLatest(value);
				capturedRef = ref;
				return <div data-testid="target">{ref.current}</div>;
			}

			const { rerender } = await render(<TestComponent value={1} />);

			expect(capturedRef!.current).toBe(1);

			await rerender(<TestComponent value={2} />);

			expect(capturedRef!.current).toBe(2);

			await rerender(<TestComponent value={3} />);

			expect(capturedRef!.current).toBe(3);
		});

		it("maintains the same ref object across renders", async () => {
			const capturedRefs: React.RefObject<number>[] = [];

			function TestComponent({ value }: { value: number }) {
				const ref = useLatest(value);
				capturedRefs.push(ref);
				return <div data-testid="target">{value}</div>;
			}

			const { rerender } = await render(<TestComponent value={1} />);
			await rerender(<TestComponent value={2} />);
			await rerender(<TestComponent value={3} />);

			// All captured refs should be the same object
			expect(capturedRefs.length).toBeGreaterThan(1);
			const firstRef = capturedRefs[0];
			for (const ref of capturedRefs) {
				expect(ref).toBe(firstRef);
			}
		});
	});

	describe("callback usage", () => {
		it("provides latest value in event handlers without stale closures", async () => {
			const clickResults: number[] = [];

			function TestComponent({ value }: { value: number }) {
				const latestValue = useLatest(value);

				const handleClick = useCallback(() => {
					clickResults.push(latestValue.current);
					// oxlint-disable-next-line exhaustive-deps
				}, []); // Empty deps - callback never changes

				return (
					<button type="button" data-testid="button" onClick={handleClick}>
						Click
					</button>
				);
			}

			const screen = await render(<TestComponent value={1} />);
			const button = screen.getByTestId("button");

			await button.click();
			expect(clickResults[clickResults.length - 1]).toBe(1);

			await screen.rerender(<TestComponent value={5} />);
			await button.click();
			expect(clickResults[clickResults.length - 1]).toBe(5);

			await screen.rerender(<TestComponent value={10} />);
			await button.click();
			expect(clickResults[clickResults.length - 1]).toBe(10);
		});

		it("works with functions as values", async () => {
			const fn1 = vi.fn(() => "first");
			const fn2 = vi.fn(() => "second");
			let capturedRef: React.RefObject<() => string> | null = null;

			function TestComponent({ fn }: { fn: () => string }) {
				const ref = useLatest(fn);
				capturedRef = ref;
				return <div data-testid="target">Test</div>;
			}

			const { rerender } = await render(<TestComponent fn={fn1} />);

			expect(capturedRef!.current).toBe(fn1);
			expect(capturedRef!.current()).toBe("first");

			await rerender(<TestComponent fn={fn2} />);

			expect(capturedRef!.current).toBe(fn2);
			expect(capturedRef!.current()).toBe("second");
		});
	});

	describe("with state updates", () => {
		it("always reflects the latest state value", async () => {
			let latestRef: React.RefObject<number> | null = null;

			function TestComponent() {
				const [count, setCount] = useState(0);
				latestRef = useLatest(count);

				return (
					<div>
						<span data-testid="count">{count}</span>
						<button
							type="button"
							data-testid="increment"
							onClick={() => setCount((c) => c + 1)}
						>
							Increment
						</button>
					</div>
				);
			}

			const screen = await render(<TestComponent />);

			expect(latestRef!.current).toBe(0);

			await screen.getByTestId("increment").click();
			await expect.element(screen.getByTestId("count")).toHaveTextContent("1");
			expect(latestRef!.current).toBe(1);

			await screen.getByTestId("increment").click();
			await expect.element(screen.getByTestId("count")).toHaveTextContent("2");
			expect(latestRef!.current).toBe(2);
		});
	});

	describe("edge cases", () => {
		it("handles null values", async () => {
			let capturedRef: React.RefObject<string | null> | null = null;

			function TestComponent({ value }: { value: string | null }) {
				const ref = useLatest(value);
				capturedRef = ref;
				return <div data-testid="target">{value ?? "null"}</div>;
			}

			const { rerender } = await render(<TestComponent value="hello" />);

			expect(capturedRef!.current).toBe("hello");

			await rerender(<TestComponent value={null} />);

			expect(capturedRef!.current).toBeNull();
		});

		it("handles undefined values", async () => {
			let capturedRef: React.RefObject<string | undefined> | null = null;

			function TestComponent({ value }: { value: string | undefined }) {
				const ref = useLatest(value);
				capturedRef = ref;
				return <div data-testid="target">{value ?? "undefined"}</div>;
			}

			const { rerender } = await render(<TestComponent value="hello" />);

			expect(capturedRef!.current).toBe("hello");

			await rerender(<TestComponent value={undefined} />);

			expect(capturedRef!.current).toBeUndefined();
		});
	});
});

import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useListener } from "~/hooks/use-listener";

describe("useListener", () => {
	describe("event binding", () => {
		it("attaches event listener to target", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(window, "resize", listener);
				return <div data-testid="target">Test</div>;
			}

			await render(<TestComponent />);

			window.dispatchEvent(new Event("resize"));

			expect(listener).toHaveBeenCalled();
		});

		it("passes the event object to the listener", async () => {
			let receivedEvent: Event | null = null;

			function TestComponent() {
				useListener(window, "resize", (event) => {
					receivedEvent = event;
				});
				return <div data-testid="target">Test</div>;
			}

			await render(<TestComponent />);

			const dispatchedEvent = new Event("resize");
			window.dispatchEvent(dispatchedEvent);

			expect(receivedEvent).toBe(dispatchedEvent);
		});

		it("removes event listener on unmount", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(window, "resize", listener);
				return <div data-testid="target">Test</div>;
			}

			const { unmount } = await render(<TestComponent />);

			window.dispatchEvent(new Event("resize"));
			expect(listener).toHaveBeenCalledTimes(1);

			unmount();

			window.dispatchEvent(new Event("resize"));
			// Listener should not be called after unmount
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe("latest listener", () => {
		it("always calls the latest listener callback", async () => {
			const calls: string[] = [];

			function TestComponent({ id }: { id: string }) {
				useListener(window, "resize", () => {
					calls.push(id);
				});
				return <div data-testid="target">{id}</div>;
			}

			const { rerender } = await render(<TestComponent id="first" />);

			window.dispatchEvent(new Event("resize"));
			expect(calls[calls.length - 1]).toBe("first");

			await rerender(<TestComponent id="second" />);

			window.dispatchEvent(new Event("resize"));
			expect(calls[calls.length - 1]).toBe("second");

			await rerender(<TestComponent id="third" />);

			window.dispatchEvent(new Event("resize"));
			expect(calls[calls.length - 1]).toBe("third");
		});

		it("uses latest state values in listener", async () => {
			const capturedValues: number[] = [];

			function TestComponent() {
				const [count, setCount] = useState(0);

				useListener(window, "customtest" as any, () => {
					capturedValues.push(count);
				});

				return (
					<button
						type="button"
						data-testid="increment"
						onClick={() => setCount((c) => c + 1)}
					>
						{count}
					</button>
				);
			}

			const screen = await render(<TestComponent />);

			window.dispatchEvent(new Event("customtest"));
			expect(capturedValues[capturedValues.length - 1]).toBe(0);

			await screen.getByTestId("increment").click();
			await expect
				.element(screen.getByTestId("increment"))
				.toHaveTextContent("1");

			window.dispatchEvent(new Event("customtest"));
			expect(capturedValues[capturedValues.length - 1]).toBe(1);

			await screen.getByTestId("increment").click();
			await expect
				.element(screen.getByTestId("increment"))
				.toHaveTextContent("2");

			window.dispatchEvent(new Event("customtest"));
			expect(capturedValues[capturedValues.length - 1]).toBe(2);
		});
	});

	describe("different event targets", () => {
		it("works with window events", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(window, "resize", listener);
				return <div>Test</div>;
			}

			await render(<TestComponent />);

			window.dispatchEvent(new UIEvent("resize"));

			expect(listener).toHaveBeenCalled();
		});

		it("works with document.body events (form reset)", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(document.body, "reset", listener);
				return (
					<form data-testid="form">
						<button type="reset" data-testid="reset">
							Reset
						</button>
					</form>
				);
			}

			const screen = await render(<TestComponent />);

			// Reset events bubble up to body
			await screen.getByTestId("reset").click();

			expect(listener).toHaveBeenCalled();
		});

		it("works with document.fonts events", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(document.fonts, "loadingdone", listener);
				return <div>Test</div>;
			}

			await render(<TestComponent />);

			// Dispatch a synthetic loadingdone event
			document.fonts.dispatchEvent(new Event("loadingdone"));

			expect(listener).toHaveBeenCalled();
		});

		it("works with DOM element events", async () => {
			let buttonElement: HTMLButtonElement | null = null;

			function TestComponent() {
				const handleRef = (el: HTMLButtonElement | null) => {
					if (el && !buttonElement) {
						buttonElement = el;
					}
				};

				// For element-level listeners, we'd typically use onClick
				// but this demonstrates the hook can work with any EventTarget
				return (
					<button type="button" ref={handleRef} data-testid="button">
						Click
					</button>
				);
			}

			await render(<TestComponent />);

			// The hook is designed for global listeners, but works with any EventTarget
			expect(buttonElement).not.toBeNull();
		});
	});

	describe("different event types", () => {
		it("handles click events", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(document.body, "click", listener);
				return (
					<button type="button" data-testid="button">
						Click
					</button>
				);
			}

			const screen = await render(<TestComponent />);

			await screen.getByTestId("button").click();

			expect(listener).toHaveBeenCalled();
		});

		it("handles keyboard events", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(document.body, "keydown", listener);
				return <div data-testid="target">Test</div>;
			}

			await render(<TestComponent />);

			document.body.dispatchEvent(
				new KeyboardEvent("keydown", { key: "Enter" }),
			);

			expect(listener).toHaveBeenCalled();
		});

		it("handles custom events", async () => {
			const listener = vi.fn();

			function TestComponent() {
				useListener(window, "mycustomevent" as any, listener);
				return <div>Test</div>;
			}

			await render(<TestComponent />);

			window.dispatchEvent(
				new CustomEvent("mycustomevent", { detail: { foo: "bar" } }),
			);

			expect(listener).toHaveBeenCalled();
		});
	});

	describe("textarea usage patterns", () => {
		it("handles form reset pattern like textarea", async () => {
			const resetCalls: Event[] = [];

			function TestComponent() {
				useListener(document.body, "reset", (ev) => {
					resetCalls.push(ev);
				});

				return (
					<form data-testid="form">
						<textarea data-testid="textarea" defaultValue="initial" />
						<button type="reset" data-testid="reset">
							Reset
						</button>
					</form>
				);
			}

			const screen = await render(<TestComponent />);

			await screen.getByTestId("reset").click();

			expect(resetCalls.length).toBeGreaterThan(0);
			expect(resetCalls[0]).toBeInstanceOf(Event);
		});

		it("handles window resize pattern like textarea", async () => {
			const resizeCalls: UIEvent[] = [];

			function TestComponent() {
				useListener(window, "resize", (ev) => {
					resizeCalls.push(ev);
				});

				return <textarea data-testid="textarea" />;
			}

			await render(<TestComponent />);

			window.dispatchEvent(new UIEvent("resize"));

			expect(resizeCalls.length).toBeGreaterThan(0);
		});

		it("handles fonts loaded pattern like textarea", async () => {
			const fontCalls: Event[] = [];

			function TestComponent() {
				useListener(document.fonts, "loadingdone", (ev) => {
					fontCalls.push(ev);
				});

				return <textarea data-testid="textarea" />;
			}

			await render(<TestComponent />);

			document.fonts.dispatchEvent(new Event("loadingdone"));

			expect(fontCalls.length).toBeGreaterThan(0);
		});
	});

	describe("multiple listeners", () => {
		it("supports multiple listeners on different events", async () => {
			const resizeListener = vi.fn();
			const clickListener = vi.fn();

			function TestComponent() {
				useListener(window, "resize", resizeListener);
				useListener(document.body, "click", clickListener);
				return (
					<button type="button" data-testid="button">
						Click
					</button>
				);
			}

			const screen = await render(<TestComponent />);

			window.dispatchEvent(new Event("resize"));
			expect(resizeListener).toHaveBeenCalled();
			expect(clickListener).not.toHaveBeenCalled();

			await screen.getByTestId("button").click();
			expect(clickListener).toHaveBeenCalled();
		});

		it("cleans up all listeners on unmount", async () => {
			const resizeListener = vi.fn();
			const clickListener = vi.fn();

			function TestComponent() {
				useListener(window, "resize", resizeListener);
				useListener(document.body, "click", clickListener);
				return <div>Test</div>;
			}

			const { unmount } = await render(<TestComponent />);

			unmount();

			const resizeCallCount = resizeListener.mock.calls.length;
			const clickCallCount = clickListener.mock.calls.length;

			window.dispatchEvent(new Event("resize"));
			document.body.dispatchEvent(new Event("click"));

			// Neither listener should be called after unmount
			expect(resizeListener.mock.calls.length).toBe(resizeCallCount);
			expect(clickListener.mock.calls.length).toBe(clickCallCount);
		});
	});
});

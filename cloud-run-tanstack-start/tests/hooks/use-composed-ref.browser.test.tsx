import { createRef, useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useComposedRef } from "~/hooks/use-composed-ref";

function TestComponent({ userRef }: { userRef: React.Ref<HTMLDivElement> }) {
	const libRef = useRef<HTMLDivElement>(null);
	const composedRef = useComposedRef(libRef, userRef);

	return (
		<div data-testid="wrapper">
			<div ref={composedRef} data-testid="target">
				Target Element
			</div>
			<span data-testid="lib-ref-set">{libRef.current ? "true" : "false"}</span>
		</div>
	);
}

describe("useComposedRef", () => {
	describe("with callback ref", () => {
		it("calls the user callback ref with the element", async () => {
			const userRef = vi.fn();

			await render(<TestComponent userRef={userRef} />);

			expect(userRef).toHaveBeenCalled();
			expect(userRef).toHaveBeenLastCalledWith(expect.any(HTMLDivElement));
		});

		it("cleans up the previous callback ref when it changes", async () => {
			const userRef1 = vi.fn();
			const userRef2 = vi.fn();

			const { rerender } = await render(<TestComponent userRef={userRef1} />);

			expect(userRef1).toHaveBeenCalled();
			expect(userRef1).toHaveBeenLastCalledWith(expect.any(HTMLDivElement));

			await rerender(<TestComponent userRef={userRef2} />);

			// userRef1 should have been called with null to clean up
			expect(userRef1).toHaveBeenLastCalledWith(null);

			// userRef2 should have been called with the element
			expect(userRef2).toHaveBeenCalled();
			expect(userRef2).toHaveBeenLastCalledWith(expect.any(HTMLDivElement));
		});
	});

	describe("with object ref", () => {
		it("sets the current property on the user object ref", async () => {
			const userRef = createRef<HTMLDivElement>();

			await render(<TestComponent userRef={userRef} />);

			expect(userRef.current).toBeInstanceOf(HTMLDivElement);
			expect(userRef.current?.dataset.testid).toBe("target");
		});

		it("updates the object ref when rerendering", async () => {
			const userRef1 = createRef<HTMLDivElement>();
			const userRef2 = createRef<HTMLDivElement>();

			const { rerender } = await render(<TestComponent userRef={userRef1} />);

			expect(userRef1.current).toBeInstanceOf(HTMLDivElement);

			await rerender(<TestComponent userRef={userRef2} />);

			// userRef1 should be cleaned up
			expect(userRef1.current).toBeNull();
			// userRef2 should have the element
			expect(userRef2.current).toBeInstanceOf(HTMLDivElement);
		});
	});

	describe("with null/undefined ref", () => {
		it("handles null user ref", async () => {
			const screen = await render(<TestComponent userRef={null} />);

			await expect.element(screen.getByTestId("target")).toBeInTheDocument();
		});

		it("handles undefined user ref", async () => {
			const screen = await render(
				<TestComponent
					userRef={undefined as unknown as React.Ref<HTMLDivElement>}
				/>,
			);

			await expect.element(screen.getByTestId("target")).toBeInTheDocument();
		});

		it("handles changing from a ref to null", async () => {
			const userRef = vi.fn();

			const { rerender } = await render(<TestComponent userRef={userRef} />);

			expect(userRef).toHaveBeenCalled();
			expect(userRef).toHaveBeenLastCalledWith(expect.any(HTMLDivElement));

			await rerender(<TestComponent userRef={null} />);

			// Previous ref should be cleaned up
			expect(userRef).toHaveBeenLastCalledWith(null);
		});
	});

	describe("libRef", () => {
		it("always updates the libRef", async () => {
			let capturedLibRef: React.RefObject<HTMLDivElement | null> | null = null;

			function CaptureLibRefComponent({
				userRef,
			}: {
				userRef: React.Ref<HTMLDivElement>;
			}) {
				const libRef = useRef<HTMLDivElement>(null);
				capturedLibRef = libRef;
				const composedRef = useComposedRef(libRef, userRef);

				return <div ref={composedRef} data-testid="target" />;
			}

			await render(<CaptureLibRefComponent userRef={null} />);

			expect(capturedLibRef).not.toBeNull();
			expect(capturedLibRef!.current).toBeInstanceOf(HTMLDivElement);
		});
	});

	describe("unmounting", () => {
		it("calls callback ref with null on unmount", async () => {
			const userRef = vi.fn();

			const { unmount } = await render(<TestComponent userRef={userRef} />);

			expect(userRef).toHaveBeenCalled();
			expect(userRef).toHaveBeenLastCalledWith(expect.any(HTMLDivElement));

			unmount();

			expect(userRef).toHaveBeenLastCalledWith(null);
		});

		it("sets object ref to null on unmount", async () => {
			const userRef = createRef<HTMLDivElement>();

			const { unmount } = await render(<TestComponent userRef={userRef} />);

			expect(userRef.current).toBeInstanceOf(HTMLDivElement);

			unmount();

			expect(userRef.current).toBeNull();
		});
	});
});

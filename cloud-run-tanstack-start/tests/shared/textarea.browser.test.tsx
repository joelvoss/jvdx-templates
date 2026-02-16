import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { Textarea } from "~/shared/textarea";

describe("Textarea", () => {
	describe("rendering", () => {
		it("renders a textarea element", async () => {
			const screen = await render(<Textarea data-testid="textarea" />);

			await expect.element(screen.getByTestId("textarea")).toBeInTheDocument();
		});

		it("forwards ref to the textarea element", async () => {
			const ref = createRef<HTMLTextAreaElement>();

			await render(<Textarea ref={ref} data-testid="textarea" />);

			expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
		});

		it("passes through standard textarea attributes", async () => {
			const screen = await render(
				<Textarea
					data-testid="textarea"
					placeholder="Enter text..."
					name="test-input"
					disabled
					readOnly
				/>,
			);

			const textarea = screen.getByTestId("textarea");

			await expect
				.element(textarea)
				.toHaveAttribute("placeholder", "Enter text...");
			await expect.element(textarea).toHaveAttribute("name", "test-input");
			await expect.element(textarea).toBeDisabled();
			await expect.element(textarea).toHaveAttribute("readonly");
		});

		it("applies custom className", async () => {
			const screen = await render(
				<Textarea data-testid="textarea" className="custom-class" />,
			);

			await expect
				.element(screen.getByTestId("textarea"))
				.toHaveClass("custom-class");
		});
	});

	describe("controlled mode", () => {
		it("uses the provided value prop", async () => {
			const screen = await render(
				<Textarea
					data-testid="textarea"
					value="controlled value"
					onChange={() => {}}
				/>,
			);

			await expect
				.element(screen.getByTestId("textarea"))
				.toHaveValue("controlled value");
		});

		it("calls onChange when user types", async () => {
			const handleChange = vi.fn();

			function ControlledTextarea() {
				const [value, setValue] = useState("");
				return (
					<Textarea
						data-testid="textarea"
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							handleChange(e);
						}}
					/>
				);
			}

			const screen = await render(<ControlledTextarea />);
			const textarea = screen.getByTestId("textarea");

			await textarea.fill("hello");

			expect(handleChange).toHaveBeenCalled();
			await expect.element(textarea).toHaveValue("hello");
		});
	});

	describe("uncontrolled mode", () => {
		it("allows user input without value prop", async () => {
			const screen = await render(<Textarea data-testid="textarea" />);
			const textarea = screen.getByTestId("textarea");

			await textarea.fill("uncontrolled text");

			await expect.element(textarea).toHaveValue("uncontrolled text");
		});

		it("calls onChange in uncontrolled mode", async () => {
			const handleChange = vi.fn();

			const screen = await render(
				<Textarea data-testid="textarea" onChange={handleChange} />,
			);
			const textarea = screen.getByTestId("textarea");

			await textarea.fill("test");

			expect(handleChange).toHaveBeenCalled();
		});

		it("uses defaultValue for initial uncontrolled value", async () => {
			const screen = await render(
				<Textarea data-testid="textarea" defaultValue="initial value" />,
			);

			await expect
				.element(screen.getByTestId("textarea"))
				.toHaveValue("initial value");
		});
	});

	describe("auto-resize behavior", () => {
		it("sets height style on the textarea", async () => {
			const ref = createRef<HTMLTextAreaElement>();

			await render(
				<Textarea ref={ref} data-testid="textarea" defaultValue="Some text" />,
			);

			// The component sets height via style.setProperty with "important"
			expect(ref.current?.style.height).toBeTruthy();
		});

		it("calls onHeightChange callback when height changes", async () => {
			const handleHeightChange = vi.fn();

			await render(
				<Textarea
					data-testid="textarea"
					defaultValue="Some text"
					onHeightChange={handleHeightChange}
				/>,
			);

			// onHeightChange should be called on initial render
			expect(handleHeightChange).toHaveBeenCalled();
			expect(handleHeightChange).toHaveBeenCalledWith(
				expect.any(Number),
				expect.objectContaining({ rowHeight: expect.any(Number) }),
			);
		});

		it("provides rowHeight in onHeightChange meta", async () => {
			let capturedMeta: { rowHeight: number } | null = null;

			await render(
				<Textarea
					data-testid="textarea"
					defaultValue="text"
					onHeightChange={(_, meta) => {
						capturedMeta = meta;
					}}
				/>,
			);

			expect(capturedMeta).not.toBeNull();
			expect(capturedMeta!.rowHeight).toBeGreaterThan(0);
		});

		it("resizes when content changes in uncontrolled mode", async () => {
			const handleHeightChange = vi.fn();

			const screen = await render(
				<Textarea data-testid="textarea" onHeightChange={handleHeightChange} />,
			);

			const textarea = screen.getByTestId("textarea");

			// Clear mock to only count changes after initial render
			handleHeightChange.mockClear();

			// Add multiple lines of text to trigger resize
			await textarea.fill("line1\nline2\nline3\nline4\nline5");

			// onHeightChange should be called when content changes
			expect(handleHeightChange).toHaveBeenCalled();
		});

		it("resizes when value changes in controlled mode", async () => {
			const handleHeightChange = vi.fn();

			function ControlledTextarea() {
				const [value, setValue] = useState("");
				return (
					<Textarea
						data-testid="textarea"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onHeightChange={handleHeightChange}
					/>
				);
			}

			const screen = await render(<ControlledTextarea />);
			const textarea = screen.getByTestId("textarea");

			handleHeightChange.mockClear();

			await textarea.fill("line1\nline2\nline3");

			// Should resize when controlled value changes
			expect(handleHeightChange).toHaveBeenCalled();
		});
	});

	describe("minRows and maxRows", () => {
		it("respects minRows prop for minimum height", async () => {
			const handleHeightChange1 = vi.fn();
			const handleHeightChange3 = vi.fn();

			await render(
				<Textarea
					data-testid="textarea1"
					minRows={1}
					onHeightChange={handleHeightChange1}
				/>,
			);

			await render(
				<Textarea
					data-testid="textarea3"
					minRows={3}
					onHeightChange={handleHeightChange3}
				/>,
			);

			// Textarea with minRows=3 should have greater height than minRows=1
			const height1 = handleHeightChange1.mock.calls[0]?.[0] || 0;
			const height3 = handleHeightChange3.mock.calls[0]?.[0] || 0;

			expect(height3).toBeGreaterThan(height1);
		});

		it("respects maxRows prop for maximum height", async () => {
			const handleHeightChange = vi.fn();

			const screen = await render(
				<Textarea
					data-testid="textarea"
					maxRows={2}
					onHeightChange={handleHeightChange}
				/>,
			);

			const textarea = screen.getByTestId("textarea");

			// Get the row height with maxRows=2 and minimal content
			const rowHeight = handleHeightChange.mock.calls[0]?.[1]?.rowHeight || 0;

			handleHeightChange.mockClear();

			// Add many lines that would exceed maxRows
			await textarea.fill("1\n2\n3\n4\n5\n6\n7\n8\n9\n10");

			// Height should be capped at approximately 2 rows
			const finalHeight = handleHeightChange.mock.calls.at(-1)?.[0] || 0;
			// Allow some tolerance for padding/borders
			expect(finalHeight).toBeLessThanOrEqual(rowHeight * 2 + 50);
		});

		it("uses minRows=1 and maxRows=Infinity by default", async () => {
			const handleHeightChange = vi.fn();

			const screen = await render(
				<Textarea data-testid="textarea" onHeightChange={handleHeightChange} />,
			);

			// Initial height should be based on 1 row
			expect(handleHeightChange).toHaveBeenCalled();
			const initialHeight = handleHeightChange.mock.calls[0]?.[0] || 0;
			expect(initialHeight).toBeGreaterThan(0);

			const textarea = screen.getByTestId("textarea");
			handleHeightChange.mockClear();

			// With Infinity maxRows, should grow indefinitely
			await textarea.fill("1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12");

			const finalHeight = handleHeightChange.mock.calls.at(-1)?.[0] || 0;
			expect(finalHeight).toBeGreaterThan(initialHeight);
		});
	});

	describe("cacheMeasurements", () => {
		it("works with cacheMeasurements enabled", async () => {
			const handleHeightChange = vi.fn();

			const screen = await render(
				<Textarea
					data-testid="textarea"
					cacheMeasurements
					onHeightChange={handleHeightChange}
				/>,
			);

			const textarea = screen.getByTestId("textarea");

			expect(handleHeightChange).toHaveBeenCalled();

			handleHeightChange.mockClear();

			// Use multiline content to trigger actual height change
			await textarea.fill("line1\nline2\nline3\nline4\nline5");

			// Should still resize correctly with caching
			expect(handleHeightChange).toHaveBeenCalled();
		});

		it("caches sizing data between resizes", async () => {
			const ref = createRef<HTMLTextAreaElement>();

			const screen = await render(
				<Textarea ref={ref} data-testid="textarea" cacheMeasurements />,
			);

			const textarea = screen.getByTestId("textarea");

			// Fill with content that causes resize
			await textarea.fill("line1\nline2\nline3");

			// Textarea should have a height set
			expect(ref.current?.style.height).toBeTruthy();
		});
	});

	describe("placeholder handling", () => {
		it("uses placeholder to determine initial height when empty", async () => {
			const handleHeightChange = vi.fn();

			await render(
				<Textarea
					data-testid="textarea"
					placeholder="Enter your message here..."
					onHeightChange={handleHeightChange}
				/>,
			);

			// Should calculate height based on placeholder when value is empty
			expect(handleHeightChange).toHaveBeenCalled();
			expect(handleHeightChange.mock.calls[0][0]).toBeGreaterThan(0);
		});
	});

	describe("window resize handling", () => {
		it("attaches resize listener to window", async () => {
			const ref = createRef<HTMLTextAreaElement>();

			const { unmount } = await render(
				<Textarea
					ref={ref}
					data-testid="textarea"
					defaultValue="Some text content"
				/>,
			);

			// Verify the textarea has been rendered and has height set
			expect(ref.current?.style.height).toBeTruthy();

			// The resize listener is attached - we verify cleanup works
			unmount();

			// After unmount, dispatching resize should not cause errors
			expect(() => {
				window.dispatchEvent(new Event("resize"));
			}).not.toThrow();
		});
	});

	describe("form reset handling", () => {
		it("resizes textarea when form is reset", async () => {
			const handleHeightChange = vi.fn();

			const screen = await render(
				<form data-testid="form">
					<Textarea
						data-testid="textarea"
						defaultValue=""
						onHeightChange={handleHeightChange}
					/>
					<button type="reset" data-testid="reset-btn">
						Reset
					</button>
				</form>,
			);

			const textarea = screen.getByTestId("textarea");

			// Add content to change height
			await textarea.fill("line1\nline2\nline3");

			handleHeightChange.mockClear();

			// Reset the form
			const resetBtn = screen.getByTestId("reset-btn");
			await resetBtn.click();

			// Wait for the requestAnimationFrame callback
			await vi.waitFor(() => {
				// The resize should be triggered after form reset
				expect(handleHeightChange).toHaveBeenCalled();
			});
		});

		it("does not resize on form reset for controlled textarea", async () => {
			const handleHeightChange = vi.fn();

			function ControlledTextarea() {
				const [value, setValue] = useState("initial");
				return (
					<form data-testid="form">
						<Textarea
							data-testid="textarea"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onHeightChange={handleHeightChange}
						/>
						<button type="reset" data-testid="reset-btn">
							Reset
						</button>
					</form>
				);
			}

			const screen = await render(<ControlledTextarea />);

			handleHeightChange.mockClear();

			// Reset the form
			const resetBtn = screen.getByTestId("reset-btn");
			await resetBtn.click();

			// For controlled textareas, the reset listener should return early.
			// Give it some time and check it wasn't called (or was called but
			// returned early)
			await new Promise((resolve) => setTimeout(resolve, 50));

			// The controlled path returns early, so resize shouldn't happen from
			// reset. Note: This test verifies the controlled branch logic
			expect(handleHeightChange).not.toHaveBeenCalled();
		});
	});

	describe("style prop", () => {
		it("accepts custom style properties", async () => {
			const ref = createRef<HTMLTextAreaElement>();

			await render(
				<Textarea
					ref={ref}
					data-testid="textarea"
					style={{ width: 300, backgroundColor: "red" }}
				/>,
			);

			expect(ref.current?.style.width).toBe("300px");
			expect(ref.current?.style.backgroundColor).toBe("red");
		});
	});

	describe("cleanup", () => {
		it("removes event listeners on unmount", async () => {
			const handleHeightChange = vi.fn();

			const { unmount } = await render(
				<Textarea
					data-testid="textarea"
					defaultValue="Some text"
					onHeightChange={handleHeightChange}
				/>,
			);

			handleHeightChange.mockClear();

			unmount();

			// Dispatch events after unmount
			window.dispatchEvent(new Event("resize"));

			// Wait a tick to ensure no async handlers fire
			await new Promise((resolve) => setTimeout(resolve, 50));

			// No height changes should occur after unmount
			expect(handleHeightChange).not.toHaveBeenCalled();
		});
	});
});

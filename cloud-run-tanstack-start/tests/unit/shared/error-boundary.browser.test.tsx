import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ErrorBoundary } from "~/shared/error-boundary";

////////////////////////////////////////////////////////////////////////////////

vi.mock("@tanstack/react-router", () => {
	return {
		isNotFound: (error: any) => error?.message === "NF",
	};
});

////////////////////////////////////////////////////////////////////////////////

type BombProps = { boom: boolean; message?: string };

function Bomb({ boom, message = "boom" }: BombProps) {
	if (boom) throw new Error(message);
	return <div data-testid="ok">ok</div>;
}

////////////////////////////////////////////////////////////////////////////////

describe("ErrorBoundary", () => {
	it("renders children when there is no error", async () => {
		const screen = await render(
			<ErrorBoundary fallback={<div data-testid="fallback" />}>
				<div data-testid="ok">ok</div>
			</ErrorBoundary>,
		);

		await expect.element(screen.getByTestId("ok")).toBeInTheDocument();
	});

	it("renders fallback when a child throws", async () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		const screen = await render(
			<ErrorBoundary
				fallback={({ error }) => (
					<div data-testid="fallback">{error?.message}</div>
				)}
			>
				<Bomb boom />
			</ErrorBoundary>,
		);

		await expect
			.element(screen.getByTestId("fallback"))
			.toHaveTextContent("boom");

		consoleSpy.mockRestore();
	});

	it("resets when resetKey changes", async () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		function Wrapper() {
			const [boom, setBoom] = useState(true);
			const [resetKey, setResetKey] = useState(0);

			return (
				<div>
					<button
						data-testid="fix"
						onClick={() => {
							setBoom(false);
							setResetKey((k) => k + 1);
						}}
					>
						fix
					</button>
					<ErrorBoundary
						getResetKey={() => resetKey}
						fallback={({ error }) => (
							<div data-testid="fallback">{error?.message}</div>
						)}
					>
						<Bomb boom={boom} />
					</ErrorBoundary>
				</div>
			);
		}

		const screen = await render(<Wrapper />);
		await expect.element(screen.getByTestId("fallback")).toBeInTheDocument();

		await screen.getByTestId("fix").click();

		await expect.element(screen.getByTestId("ok")).toBeInTheDocument();

		consoleSpy.mockRestore();
	});

	it("maps notFound errors to a friendly message", async () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		const screen = await render(
			<ErrorBoundary
				fallback={({ error }) => (
					<div data-testid="fallback">{error?.message}</div>
				)}
			>
				<Bomb boom message="NF" />
			</ErrorBoundary>,
		);

		await expect
			.element(screen.getByTestId("fallback"))
			.toHaveTextContent("The requested resource was not found");

		consoleSpy.mockRestore();
	});
});

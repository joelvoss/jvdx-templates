import { render, screen } from '@testing-library/react';
import { server } from '../__mocks__/msw-server';
import { CsrfProvider, useCsrf } from '@/hooks/use-csrf';

describe('useCsrf', () => {
	// NOTE(joel): Establish API mocking before all tests.
	beforeAll(() => {
		server.listen();
	});

	// NOTE(joel): Reset any request handlers that we may add during the tests,
	// so they don't affect other tests.
	afterEach(() => {
		server.resetHandlers();
	});

	// NOTE(joel): Clean up after the tests are finished.
	afterAll(() => {
		server.close();
	});

	//////////////////////////////////////////////////////////////////////////////

	function Comp({ defaultCsrf }: { defaultCsrf?: string }) {
		const csrf = useCsrf(defaultCsrf);

		if (csrf.isLoading) {
			return <span data-testid="loading" />;
		}

		return <span data-testid="done">{JSON.stringify(csrf)}</span>;
	}

	//////////////////////////////////////////////////////////////////////////////

	describe('base', () => {
		test('fetches a CSRF token', async () => {
			render(
				<CsrfProvider>
					<Comp />
				</CsrfProvider>,
			);

			const loadingEl = screen.queryByTestId('loading');
			// @ts-expect-error
			expect(loadingEl).toBeInTheDocument();

			const doneEl = await screen.findByTestId('done');
			// @ts-expect-error
			expect(doneEl).toBeInTheDocument();
			expect(doneEl.innerHTML).toBe(
				'{"token":"test-csrf-token","isLoading":false}',
			);
		});

		test('uses a pre-populated token from context', async () => {
			render(
				<CsrfProvider csrf="pre-populated-token">
					<Comp />
				</CsrfProvider>,
			);

			const loadingEl = screen.queryByTestId('loading');
			// @ts-expect-error
			expect(loadingEl).not.toBeInTheDocument();

			const doneEl = await screen.findByTestId('done');
			// @ts-expect-error
			expect(doneEl).toBeInTheDocument();
			expect(doneEl.innerHTML).toBe(
				'{"token":"pre-populated-token","isLoading":false}',
			);
		});

		test('sets a pre-populated token on context and uses it', async () => {
			render(
				<CsrfProvider>
					<Comp defaultCsrf="pre-populated-token" />
				</CsrfProvider>,
			);

			const loadingEl = screen.queryByTestId('loading');
			// @ts-expect-error
			expect(loadingEl).not.toBeInTheDocument();

			const doneEl = await screen.findByTestId('done');
			// @ts-expect-error
			expect(doneEl).toBeInTheDocument();
			expect(doneEl.innerHTML).toBe(
				'{"token":"pre-populated-token","isLoading":false}',
			);
		});
	});

	describe('throw', () => {
		test('throw if rendered without a parent context provider', () => {
			// NOTE(joel): Catch automatic error logging by React.
			const origErr = console.error;
			console.error = jest.fn();

			try {
				render(<Comp />);
			} catch (err: any) {
				expect(err instanceof TypeError).toBe(true);
				expect(err.message).toBe(
					"No context found. Please wrap components using 'useCsrf' in a '<CsrfProvider>'.",
				);
			}

			console.error = origErr;
		});
	});
});

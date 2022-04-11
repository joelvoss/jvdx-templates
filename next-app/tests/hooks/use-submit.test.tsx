import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSubmit } from '@/hooks/use-submit';

describe('useSubmit', () => {
	type CompProps = {
		method?: string;
		action?: string;
		value?: any;
		onSubmit?: any;
		options?: any;
	};

	function Comp(props: CompProps) {
		const { method, action, value, onSubmit, options = {} } = props;
		const submit = useSubmit(onSubmit, options);

		return (
			<form method={method} action={action} onSubmit={submit}>
				<label htmlFor="text-input">Text input</label>
				<input type="text" id="test" name="test" defaultValue={value} />
				<button type="submit">Submit</button>
			</form>
		);
	}

	function WithoutForm({ onSubmit }: { onSubmit?: any }) {
		const submit = useSubmit(onSubmit);

		return (
			<>
				<label htmlFor="text-input">Text input</label>
				<input type="text" id="test" name="test" />
				<button type="submit" onClick={submit}>
					Submit
				</button>
			</>
		);
	}

	function WithWrongElement({ onSubmit }: { onSubmit?: any }) {
		const submit = useSubmit(onSubmit);

		return (
			<>
				<label htmlFor="text-input">Text input</label>
				<input type="text" id="test" name="test" />
				<div onClick={submit}>Submit</div>
			</>
		);
	}

	describe('throw', () => {
		test('throws without callback', () => {
			// NOTE(joel): Catch automatic error logging by React.
			const origErr = console.error;
			console.error = jest.fn();

			try {
				render(<Comp />);
			} catch (err: any) {
				expect(err instanceof Error).toBe(true);
				expect(err.message).toBe('First argument must be of type "function"');
			}

			console.error = origErr;
		});

		test('throws without a form', async () => {
			const origErr = console.error;
			console.error = jest.fn();

			render(<WithoutForm onSubmit={jest.fn()} />);

			userEvent.click(screen.getByText(/submit/i));

			expect(console.error).toBeCalledWith(
				'Cannot submit a <button> without a <form>',
			);

			console.error = origErr;
		});

		test('throws when submitting from wrong element', async () => {
			const origErr = console.error;
			console.error = jest.fn();

			render(<WithWrongElement onSubmit={jest.fn()} />);

			userEvent.click(screen.getByText(/submit/i));

			expect(console.error).toBeCalledWith(
				'Cannot submit element that is not <form>, <button>, or <input type="submit|image">',
			);

			console.error = origErr;
		});
	});

	describe('base', () => {
		test('converts form to query parameter on GET requests', () => {
			const onSubmit = jest.fn();
			render(<Comp value="test-value" onSubmit={onSubmit} />);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/?test=test-value');
			expect(Array.from(fd).toString()).toBe('test,test-value');
		});

		test('submits POST requests', () => {
			const onSubmit = jest.fn();
			render(<Comp method="POST" value="test-value" onSubmit={onSubmit} />);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/');
			expect(Array.from(fd).toString()).toBe('test,test-value');
		});

		test('handle action parameter', () => {
			const onSubmit = jest.fn();
			render(
				<Comp
					method="GET"
					action="/api/path"
					value="test-value"
					onSubmit={onSubmit}
				/>,
			);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/api/path?test=test-value');
			expect(Array.from(fd).toString()).toBe('test,test-value');
		});

		test('handle action parameter with POST', () => {
			const onSubmit = jest.fn();
			render(
				<Comp
					method="POST"
					action="/api/path"
					value="test-value"
					onSubmit={onSubmit}
				/>,
			);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/api/path');
			expect(Array.from(fd).toString()).toBe('test,test-value');
		});
	});

	describe('options', () => {
		test('options.method', () => {
			const onSubmit = jest.fn();
			render(
				<Comp
					method="POST"
					value="test-value"
					onSubmit={onSubmit}
					options={{ method: 'GET' }}
				/>,
			);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/?test=test-value');
			expect(Array.from(fd).toString()).toBe('test,test-value');
		});

		test('options.action', () => {
			const onSubmit = jest.fn();
			render(
				<Comp
					method="GET"
					action="/api/path"
					value="test-value"
					onSubmit={onSubmit}
					options={{ action: '/overwritten/path' }}
				/>,
			);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe(
				'http://localhost/overwritten/path?test=test-value',
			);
			expect(Array.from(fd).toString()).toBe('test,test-value');
		});

		test('options.serialize', () => {
			const onSubmit = jest.fn();
			render(
				<Comp
					value="test-value"
					onSubmit={onSubmit}
					options={{ serialize: true }}
				/>,
			);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fdSerialized = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/?test=test-value');
			expect(fdSerialized).toEqual({ test: 'test-value' });
		});

		test('options.redirect', async () => {
			const routerPush = jest.fn();
			const useRouter = jest.spyOn(require('next/router'), 'useRouter');
			useRouter.mockImplementation(() => ({
				push: routerPush,
			}));

			const onSubmit = jest.fn();
			render(
				<Comp
					value="test-value"
					onSubmit={onSubmit}
					options={{ redirect: '/redirected' }}
				/>,
			);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/?test=test-value');
			expect(Array.from(fd).toString()).toBe('test,test-value');

			await waitFor(() =>
				expect(routerPush).toBeCalledWith('http://localhost/redirected'),
			);

			useRouter.mockRestore();
		});

		test('options.replace', async () => {
			const routerReplace = jest.fn();
			const useRouter = jest.spyOn(require('next/router'), 'useRouter');
			useRouter.mockImplementation(() => ({
				replace: routerReplace,
			}));

			const onSubmit = jest.fn();
			render(
				<Comp
					value="test-value"
					onSubmit={onSubmit}
					options={{ replace: true, redirect: '/replaced' }}
				/>,
			);

			userEvent.click(screen.getByText(/submit/i));

			const url = onSubmit.mock.calls[0][0];
			const fd = onSubmit.mock.calls[0][1];

			// NOTE(joel): Jest cannot compare URL and FormData types, so we have
			// to stringify them beforehand.
			expect(url.toString()).toBe('http://localhost/?test=test-value');
			expect(Array.from(fd).toString()).toBe('test,test-value');

			await waitFor(() =>
				expect(routerReplace).toBeCalledWith('http://localhost/replaced'),
			);

			useRouter.mockRestore();
		});
	});
});

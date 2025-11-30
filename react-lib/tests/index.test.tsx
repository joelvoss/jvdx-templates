import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Counter } from '../src/index';

describe('<Counter>', () => {
	it('should render', async () => {
		const screen = await render(<Counter />);
		await expect.element(screen.getByText(/Count/i)).toBeInTheDocument();
	});

	it('should increment count on click', async () => {
		const screen = await render(<Counter />);
		await screen.getByText(/\+1/i).click();
		await expect.element(screen.getByText(/Count: 1/i)).toBeInTheDocument();
	});

	it('should decrement count on click', async () => {
		const screen = await render(<Counter />);
		await screen.getByText(/-1/i).click();
		await expect.element(screen.getByText(/Count: -1/i)).toBeInTheDocument();
	});
});

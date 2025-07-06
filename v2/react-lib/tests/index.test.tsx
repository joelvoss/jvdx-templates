import { afterEach, describe, expect, it } from 'vitest';
import { Counter } from '../src/index';
import { cleanup, render, screen, userEvent } from './test-utils';

afterEach(() => {
	cleanup();
});

describe('<Counter>', () => {
	it('should render', () => {
		render(<Counter />);
		expect(screen.getByText(/Count/i)).toBeInTheDocument();
	});

	it('should increment count on click', async () => {
		render(<Counter />);
		await userEvent.click(screen.getByText(/\+1/i));
		expect(await screen.findByText(/Count: 1/i)).toBeInTheDocument();
	});

	it('should decrement count on click', async () => {
		render(<Counter />);
		await userEvent.click(screen.getByText(/-1/i));
		expect(await screen.findByText(/Count: -1/i)).toBeInTheDocument();
	});
});

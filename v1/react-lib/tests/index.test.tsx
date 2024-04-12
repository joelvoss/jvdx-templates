// @ts-nocheck
import * as React from 'react';
import { render, screen, waitFor, userEvent } from './test-utils';

import { MyComponent } from '../src/index';

describe('<MyComponent />', () => {
	it('should not have ARIA violations', async () => {
		let { container } = render(<MyComponent />);
		await expect(container).toHaveNoAxeViolations();
	});

	it('should render proper HTML', async () => {
		render(<MyComponent />);

		// Assert default state
		expect(screen.getByText(/clicked/i)).toBeInTheDocument();

		// Perform some action and await the expected change
		userEvent.click(screen.getByRole('button', { name: /\+1/i }));
		await waitFor(() => screen.getByText(/clicked 1 times/i));

		// Assert DOM after action
		expect(screen.getByText(/clicked 1 times/i)).toBeInTheDocument();

		// Performe more actions and await the expected change
		userEvent.click(screen.getByRole('button', { name: /\-1/i }));
		userEvent.click(screen.getByRole('button', { name: /\-1/i }));
		await waitFor(() => screen.getByText(/clicked -1 times/i));

		// Assert DOM after actions
		expect(screen.getByText(/clicked -1 times/i)).toBeInTheDocument();
	});
});

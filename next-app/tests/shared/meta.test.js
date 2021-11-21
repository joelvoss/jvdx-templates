/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { Meta } from '@/shared/meta';
import { HeadProvider } from '../jest.setup';

describe('<Meta>', () => {
	test('renders proper HTML', () => {
		// NOTE(joel): Since we're rendering inside <head>, we have to use a special
		// <HeaderProvider> component to flush meta tags in tests.
		const { baseElement } = render(<Meta />, { wrapper: HeadProvider });

		// NOTE(joel): We have to get the document.head ourself based off of the
		// rendered `baseElement`.
		const head = baseElement.parentElement?.firstChild;

		expect(head).toMatchSnapshot();
	});
});

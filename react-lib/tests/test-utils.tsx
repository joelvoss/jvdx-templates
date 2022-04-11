// @ts-nocheck

import * as React from 'react';
import { render as tlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export { screen, waitFor, userEvent };

type RenderOptions = {
	baseElement?: Element | DocumentFragment;
	strict?: boolean;
	wrapper?: React.ElementType
}

/**
 * render renders a given element.
 */
export function render(element: React.ReactElement, options: RenderOptions = {}) {
	const {
		baseElement,
		strict = false,
		wrapper: InnerWrapper = React.Fragment,
	} = options;

	const Mode = strict ? React.StrictMode : React.Fragment;

	const Wrapper = ({ children }) => (
		<Mode>
			<InnerWrapper>{children}</InnerWrapper>
		</Mode>
	);

	return tlRender(element, {
		baseElement,
		wrapper: Wrapper,
	});
}

import '@testing-library/jest-dom/extend-expect';
import 'whatwg-fetch';

import * as React from 'react';
import { HeadManagerContext } from 'next/dist/shared/lib/head-manager-context';
import ReactDOMServer from 'react-dom/server';

////////////////////////////////////////////////////////////////////////////////

/**
 * Collect tags from next/head.
 * @see https://github.com/vercel/next.js/discussions/11060
 */
export function HeadProvider({ children }) {
	let head = React.useRef();

	React.useEffect(() => {
		global.document.head.insertAdjacentHTML(
			'afterbegin',
			ReactDOMServer.renderToString(<>{head.current}</>) || '',
		);
	});

	const ctx = {
		updateHead: state => void (head.current = state),
		mountedInstances: new Set(),
	};

	return (
		<HeadManagerContext.Provider value={ctx}>
			{children}
		</HeadManagerContext.Provider>
	);
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { useCounter } from '../../src/index';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	<StrictMode>
		<Example />
	</StrictMode>,
);

////////////////////////////////////////////////////////////////////////////////

export function Example() {
	const { count, increment, decrement } = useCounter();

	return (
		<div>
			<h1>Basic example:</h1>
			<div>
				<p>Count: {count}</p>
				<button onClick={increment}>+1</button>
				<button onClick={decrement}>-1</button>
			</div>
		</div>
	);
}

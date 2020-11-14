import * as React from 'react';

export function MyComponent() {
	const [count, setCount] = React.useState(0);
	return (
		<div>
			<p>Clicked {count} times</p>
			<button onClick={() => setCount(s => s + 1)}>+1</button>
			<button onClick={() => setCount(s => s - 1)}>-1</button>
		</div>
	);
}

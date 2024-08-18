import { useCounter } from './hooks/useCounter';

export function Counter() {
	const { count, increment, decrement } = useCounter();
	return (
		<div>
			<p>Count: {count}</p>
			<button type="button" onClick={increment}>+1</button>
			<button type="button" onClick={decrement}>-1</button>
		</div>
	);
}

export { useCounter };

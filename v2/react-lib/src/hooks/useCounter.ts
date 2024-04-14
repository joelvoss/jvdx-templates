import { useState } from 'react';

export function useCounter() {
	const [count, setCount] = useState(0);
	return {
		count,
		increment: () => setCount(count + 1),
		decrement: () => setCount(count - 1),
	};
}

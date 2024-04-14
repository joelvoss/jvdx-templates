import { add } from './add';

export function calculator(op: string, ...numbers: number[]) {
	if (op === 'add') {
		const [a, b] = numbers;
		return add(a, b);
	}
	return -1;
}

// export { add };

import { add } from './add';

enum Operations {
	Add = 'add',
}

export type Operation = Operations | (string & {});

export function calculator(op: Operation, ...numbers: number[]) {
	if (op === Operations.Add) {
		const [a, b] = numbers;
		return add(a, b);
	}
	console.log('Invalid operation');
	return -1;
}

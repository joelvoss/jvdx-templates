import { add } from './add';

export enum Operations {
	Add = 'add',
}

export type Operation = Operations | (string & {});

export function calculator(op: Operation, ...numbers: number[]) {
	if (op === Operations.Add) {
		if (numbers.length < 2) {
			throw new Error('Operation "add" requires at least 2 operands');
		}
		const [a, b] = numbers;
		return add(a, b);
	}
	throw new Error(`Unsupported operation: ${op}`);
}

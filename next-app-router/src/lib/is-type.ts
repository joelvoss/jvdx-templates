type TypeName =
	| 'string'
	| 'number'
	| 'boolean'
	| 'function'
	| 'object'
	| 'symbol'
	| 'undefined';

type TypeMap = {
	string: string;
	number: number;
	boolean: boolean;
	function: (...args: any[]) => any;
	object: object;
	symbol: symbol;
	undefined: undefined;
};

/**
 * isType checks if a value is of a specific type.
 */
export function isType<T extends TypeName>(
	val: unknown,
	type: T,
): val is TypeMap[T] {
	switch (type) {
		case 'string':
			return typeof val === 'string' || val instanceof String;
		case 'number':
			return typeof val === 'number';
		case 'boolean':
			return typeof val === 'boolean';
		case 'function':
			return typeof val === 'function';
		case 'object':
			return typeof val === 'object' && val !== null;
		case 'symbol':
			return typeof val === 'symbol';
		case 'undefined':
			return typeof val === 'undefined';
		default:
			return false;
	}
}

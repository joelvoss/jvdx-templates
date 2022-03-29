export async function add(...args: number[]) {
	return args.reduce((total, value) => total + value, 0);
}

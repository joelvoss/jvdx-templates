export async function add(...args) {
	return args.reduce((total, value) => total + value, 0);
}

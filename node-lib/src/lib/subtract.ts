export async function subtract(...args: number[]) {
	const [base, ...rest] = args;
	return rest.reduce((total, value) => total - value, base);
}

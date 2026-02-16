type GenericObject = { [key: string]: any };

/**
 * Creates a new object by picking specified properties from the given object.
 */
export function pick<T extends GenericObject, K extends keyof T>(
	props: K[],
	obj: T,
) {
	const picked = {} as Pick<T, K>;
	for (const prop of props) {
		picked[prop] = obj[prop];
	}
	return picked;
}

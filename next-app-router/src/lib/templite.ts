const regexp = /{{(.*?)}}/g;

/**
 * templite allows you to denote dynamic portions of a string using double
 * curly brackets ({{ example }}) and then replace them with matching values
 * from your data source.
 */
export function templite(
	str: string,
	datasource: { [key: string]: any } | Array<any>,
) {
	const replacer = (_: string, key: string) => {
		let index = 0;
		let ds = datasource;
		const keyParts = key.trim().split('.');

		// NOTE(joel): Replace every `key` with it's counterpart inside the
		// datasource until every datasource key (even nested) has been used.
		while (ds && index < keyParts.length) {
			// NOTE(joel): Typescript doesn't know we can index an array via number
			// literals, e.g. `"0"` or `"1"`.
			// @ts-ignore
			ds = ds[keyParts[index++]];
		}

		return ds != null ? (ds as unknown as string) : '';
	};

	return str.replace(regexp, replacer);
}

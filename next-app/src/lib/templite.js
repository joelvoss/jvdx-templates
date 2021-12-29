const regexp = /{{(.*?)}}/g;

/**
 * templite allows you to denote dynamic portions of a string using double
 * curly brackets ({{ example }}) & then replace them with matching values from
 * your data source.
 * @param {string} str
 * @param {Object | Array} datasource
 * @returns {string}
 */
export function templite(str, datasource) {
	const replacer = (x, key, y) => {
		// NOTE(joel): We misuse the replacer arguments to store a copy of the
		// datasource and a counter variable.
		x = 0;
		y = datasource;
		key = key.trim().split('.');

		// NOTE(joel): Replace every `key` with it's counterpart inside the
		// datasource until every datasource key has been used.
		while (y && x < key.length) {
			y = y[key[x++]];
		}

		return y != null ? y : '';
	};

	return str.replace(regexp, replacer);
}

import type { Options } from './context';

////////////////////////////////////////////////////////////////////////////////

type Require<T, Keys extends keyof T> = Pick<Required<T>, Keys> & Omit<T, Keys>;

export type Parser<T> = {
	parse: (value: string) => T | null;
	serialize?: (value: T) => string;
	eq?: (a: T, b: T) => boolean;
};

type ParserBuilder<T> = Required<Parser<T>> &
	Options & {
		withOptions<This>(this: This, options: Options): This;
		withDefault(
			this: ParserBuilder<T>,
			defaultValue: NonNullable<T>,
		): Omit<ParserBuilder<T>, 'parseServerSide'> & {
			readonly defaultValue: NonNullable<T>;
			parseServerSide(value: string | string[] | undefined): NonNullable<T>;
		};
		parseServerSide(value: string | string[] | undefined): T | null;
	};

////////////////////////////////////////////////////////////////////////////////

/**
 * Wrap a set of parse/serialize functions into a builder pattern parser
 * you can pass to one of the hooks, making its default value type safe.
 */
export function createParser<T>(
	parser: Require<Parser<T>, 'parse' | 'serialize'>,
): ParserBuilder<T> {
	function parseServerSideNullable(value: string | string[] | undefined) {
		if (typeof value === 'undefined') return null;
		let str = '';
		if (Array.isArray(value)) {
			// @see https://url.spec.whatwg.org/#dom-urlsearchparams-get
			if (value[0] === undefined) return null;
			str = value[0];
		}
		if (typeof value === 'string') {
			str = value;
		}
		return safeParse(parser.parse, str);
	}

	return {
		eq: (a, b) => a === b,
		...parser,
		parseServerSide: parseServerSideNullable,
		withDefault(defaultValue) {
			return {
				...this,
				defaultValue,
				parseServerSide(value) {
					return parseServerSideNullable(value) ?? defaultValue;
				},
			};
		},
		withOptions(options: Options) {
			return { ...this, ...options };
		},
	};
}

////////////////////////////////////////////////////////////////////////////////

export const parseAsString = createParser({
	parse: v => v,
	serialize: v => `${v}`,
});

export const parseAsInteger = createParser({
	parse: v => {
		const int = Number.parseInt(v);
		if (Number.isNaN(int)) {
			return null;
		}
		return int;
	},
	serialize: v => Math.round(v).toFixed(),
});

export const parseAsIndex = createParser({
	parse: v => {
		const int = parseAsInteger.parse(v);
		if (int === null) {
			return null;
		}
		return int - 1;
	},
	serialize: v => parseAsInteger.serialize(v + 1),
});

export const parseAsHex = createParser({
	parse: v => {
		const int = Number.parseInt(v, 16);
		if (Number.isNaN(int)) {
			return null;
		}
		return int;
	},
	serialize: v => {
		const hex = Math.round(v).toString(16);
		return hex.padStart(hex.length + (hex.length % 2), '0');
	},
});

export const parseAsFloat = createParser({
	parse: v => {
		const float = Number.parseFloat(v);
		if (Number.isNaN(float)) {
			return null;
		}
		return float;
	},
	serialize: v => v.toString(),
});

export const parseAsBoolean = createParser({
	parse: v => v === 'true',
	serialize: v => (v ? 'true' : 'false'),
});

function compareDates(a: Date, b: Date) {
	return a.valueOf() === b.valueOf();
}

export const parseAsTimestamp = createParser({
	parse: v => {
		const ms = Number.parseInt(v);
		if (Number.isNaN(ms)) {
			return null;
		}
		return new Date(ms);
	},
	serialize: (v: Date) => v.valueOf().toString(),
	eq: compareDates,
});

export const parseAsIsoDateTime = createParser({
	parse: v => {
		const date = new Date(v);
		if (Number.isNaN(date.valueOf())) {
			return null;
		}
		return date;
	},
	serialize: (v: Date) => v.toISOString(),
	eq: compareDates,
});

export const parseAsIsoDate = createParser({
	parse: v => {
		const date = new Date(v.slice(0, 10));
		if (Number.isNaN(date.valueOf())) {
			return null;
		}
		return date;
	},
	serialize: (v: Date) => v.toISOString().slice(0, 10),
	eq: compareDates,
});

export function parseAsStringEnum<Enum extends string>(validValues: Enum[]) {
	return createParser({
		parse: (query: string) => {
			const asEnum = query as unknown as Enum;
			if (validValues.includes(asEnum)) {
				return asEnum;
			}
			return null;
		},
		serialize: (value: Enum) => value.toString(),
	});
}

export function parseAsStringLiteral<Literal extends string>(
	validValues: readonly Literal[],
) {
	return createParser({
		parse: (query: string) => {
			const asConst = query as unknown as Literal;
			if (validValues.includes(asConst)) {
				return asConst;
			}
			return null;
		},
		serialize: (value: Literal) => value.toString(),
	});
}

export function parseAsNumberLiteral<Literal extends number>(
	validValues: readonly Literal[],
) {
	return createParser({
		parse: (query: string) => {
			const asConst = Number.parseFloat(query) as unknown as Literal;
			if (validValues.includes(asConst)) {
				return asConst;
			}
			return null;
		},
		serialize: (value: Literal) => value.toString(),
	});
}

export function parseAsJson<T>(runtimeParser: (value: unknown) => T) {
	return createParser({
		parse: query => {
			try {
				const obj = JSON.parse(query);
				return runtimeParser(obj);
			} catch {
				return null;
			}
		},
		serialize: value => JSON.stringify(value),
		eq(a, b) {
			// NOTE(joel): Check for referential equality first
			return a === b || JSON.stringify(a) === JSON.stringify(b);
		},
	});
}

export function parseAsArrayOf<ItemType>(
	itemParser: Parser<ItemType>,
	separator = ',',
) {
	const itemEq = itemParser.eq ?? ((a: ItemType, b: ItemType) => a === b);
	const encodedSeparator = encodeURIComponent(separator);
	// TODO(joel): Handle default item values and make return type non-nullable.
	return createParser({
		parse: query => {
			if (query === '') return [] as ItemType[];

			return query
				.split(separator)
				.map(item =>
					safeParse(
						itemParser.parse,
						item.replaceAll(encodedSeparator, separator),
					),
				)
				.filter(value => value !== null && value !== undefined) as ItemType[];
		},
		serialize: values =>
			values
				.map<string>(value => {
					const str = itemParser.serialize
						? itemParser.serialize(value)
						: String(value);
					return str.replaceAll(separator, encodedSeparator);
				})
				.join(separator),
		eq(a, b) {
			if (a === b) return true;
			if (a.length !== b.length) return false;
			return a.every((value, index) => itemEq(value, b[index]));
		},
	});
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Safely parses a string using the provided parser function.
 * If parsing fails, it returns null instead of throwing an error.
 */
export function safeParse<T>(parser: Parser<T>['parse'], value: string) {
	try {
		return parser(value);
	} catch (_) {
		return null;
	}
}

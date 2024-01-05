// NOTE(joel): Taken from https://stackoverflow.com/questions/51603250/typescript-3-parameter-list-intersection-type/51604379#51604379
export type TupleTypes<T> = { [P in keyof T]: T[P] } extends {
	[key: number]: infer V;
}
	? NullOrObject<V>
	: never;

export type NullOrObject<T> = T extends null | undefined ? {} : T;

export type UnionToIntersection<U> = (
	U extends any ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never;

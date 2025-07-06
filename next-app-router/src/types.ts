import type { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

// NOTE(joel): Taken from https://stackoverflow.com/questions/51603250/typescript-3-parameter-list-intersection-type/51604379#51604379
export type TupleTypes<T> = { [P in keyof T]: T[P] } extends {
	[key: number]: infer V;
}
	? NullOrObject<V>
	: never;

// biome-ignore lint/complexity/noBannedTypes: It's fine.
export type NullOrObject<T> = T extends null | undefined ? {} : T;

export type UnionToIntersection<U> = (
	U extends any
		? (k: U) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

export type MiddlewareResponse =
	| {
			json?: NextResponse;
			redirect?: NextResponse;
			next?: NextResponse;
	  }
	| undefined;

export type ChainableMiddleware = (
	request: NextRequest,
	event: NextFetchEvent,
) => Promise<NextResponse>;

export type MiddlewareFactory = (
	middleware: ChainableMiddleware,
) => ChainableMiddleware;

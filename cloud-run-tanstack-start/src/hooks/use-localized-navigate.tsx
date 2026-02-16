import { useRouter } from "@tanstack/react-router";
import type {
	AnyRouter,
	FromPathOption,
	NavigateOptions,
	RegisteredRouter,
} from "@tanstack/router-core";
import { useCallback } from "react";

////////////////////////////////////////////////////////////////////////////////

export const LOCALE_ROUTE = "{-$locale}" as const;

////////////////////////////////////////////////////////////////////////////////

type CollapseDoubleSlashes<TString extends string> =
	TString extends `${infer THead}//${infer TTail}`
		? CollapseDoubleSlashes<`${THead}/${TTail}`>
		: TString;

type RemoveAll<
	TString extends string,
	TSub extends string,
> = TString extends `${infer THead}${TSub}${infer TTail}`
	? RemoveAll<`${THead}${TTail}`, TSub>
	: TString;

type RemoveLocaleFromString<TString extends string> = CollapseDoubleSlashes<
	RemoveAll<TString, typeof LOCALE_ROUTE>
>;

type RemoveLocaleParam<TVal> = TVal extends string
	? RemoveLocaleFromString<TVal>
	: TVal;

////////////////////////////////////////////////////////////////////////////////

type UseLocalizedNavigateOptions<
	TRouter extends AnyRouter = RegisteredRouter,
	TDefaultFrom extends string = string,
> = {
	from?: FromPathOption<TRouter, TDefaultFrom>;
};

type LocalizedTo =
	| NavigateOptions["to"]
	| RemoveLocaleParam<NavigateOptions["to"]>;

type LocalizedNavigateOptions = Omit<NavigateOptions, "to"> & {
	to?: LocalizedTo;
};

/**
 * A wrapper around TanStack Router's useNavigate hook with updated types to
 * allow for localized paths. The actual path augmentation is being done
 * in the router configuration.
 */
export function useLocalizedNavigate<
	TRouter extends AnyRouter = RegisteredRouter,
	TDefaultFrom extends string = string,
>(_defaultOpts?: UseLocalizedNavigateOptions<TRouter, TDefaultFrom>) {
	const router = useRouter();

	return useCallback(
		(options: LocalizedNavigateOptions) => {
			return router.navigate({
				...options,
				from: options.from ?? _defaultOpts?.from,
			} as any);
		},
		[_defaultOpts?.from, router],
	);
}

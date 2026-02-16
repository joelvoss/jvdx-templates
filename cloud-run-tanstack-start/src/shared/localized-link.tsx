import type { LinkComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

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

export type To =
	| LinkComponentProps["to"]
	| RemoveLocaleParam<LinkComponentProps["to"]>;

export type LocalizedLinkProps = {
	to?: To;
} & Omit<LinkComponentProps, "to">;

/**
 * LocalizedLink Component that wraps the Link component from @tanstack/
 * react-router with updated types to allow for localized paths. The actual
 * path augmentation is being done in the router configuration.
 */
export function LocalizedLink(props: LocalizedLinkProps) {
	return <Link {...props} to={props.to as LinkComponentProps["to"]} />;
}

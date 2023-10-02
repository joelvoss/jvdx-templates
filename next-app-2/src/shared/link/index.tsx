'use client';

import { useMemo } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { mergeProps } from '@/lib/merge-props';
import { getGlobalProgress } from '@/shared/progress';
import { formatUrl } from './format-url';
import { addBasePath } from './add-base-path';

import type { LinkProps as NextLinkProps } from 'next/link';
import type { MouseEvent } from 'react';
import type { UrlObject } from 'url';

////////////////////////////////////////////////////////////////////////////////

const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;

////////////////////////////////////////////////////////////////////////////////

export interface LinkProps
	extends React.PropsWithChildren<
		Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> &
			NextLinkProps
	> {}

export function Link(props: LinkProps) {
	const progress = getGlobalProgress();
	const pathname = usePathname();

	const { href: hrefProp, as: asProp } = props;

	// NOTE(joel): Since `<Link>` accepts `href` as `string` or `UrlObject`
	//  we have to parse it to be able to decide, if we have to start our
	// progress bar. Code ist modified from `next/link` source code.
	// @see https://github.com/vercel/next.js/blob/canary/packages/next/src/client/link.tsx#L454
	let { href, as } = useMemo(() => {
		const resolvedHref = formatStringOrUrl(hrefProp);
		return {
			href: resolvedHref,
			as: asProp ? formatStringOrUrl(asProp) : resolvedHref,
		};
	}, [hrefProp, asProp]);

	if (ABSOLUTE_URL_REGEX.test(as)) {
		href = as;
	} else {
		href = addBasePath(as);
	}

	const linkProps = mergeProps(props, {
		onClick: (event: MouseEvent<HTMLAnchorElement>) => {
			if (shouldTriggerStartEvent(href, event)) progress.start();
			if (props.onClick) props.onClick(event);
		},
		prefetch: false,
		locale: false,
		'data-active': href === pathname,
	});

	return <NextLink {...linkProps} />;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Formats a URL object or string to a string.
 */
function formatStringOrUrl(urlObjOrString: UrlObject | string) {
	if (typeof urlObjOrString === 'string') {
		return urlObjOrString;
	}
	return formatUrl(urlObjOrString);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Returns `true` if the link should trigger a start event.
 */
function shouldTriggerStartEvent(href: string, clickEvent?: React.MouseEvent) {
	const current = window.location;
	const target = new URL(href, location.href);
	// NOTE(joel): Modified events -> Fallback to browser behaviour
	if (clickEvent && isModifiedEvent(clickEvent)) return false;
	// NOTE(joel): External URL
	if (current.origin !== target.origin) return false;
	// NOTE(joel): Same URL
	if (current.pathname === target.pathname && current.search === target.search)
		return false;
	return true;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Returns `true` if the event is a modified click event.
 * Source: https://github.com/vercel/next.js/blob/canary/packages/next/src/client/link.tsx#L180
 */
function isModifiedEvent(event: React.MouseEvent) {
	const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement;
	const target = eventTarget.getAttribute('target');
	return (
		(target && target !== '_self') ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey || // triggers resource download
		(event.nativeEvent && event.nativeEvent.which === 2)
	);
}

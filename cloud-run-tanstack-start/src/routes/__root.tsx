/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import {
	Outlet,
	HeadContent,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { useContext } from "react";

import {
	type AbstractIntlMessages,
	getDirFromLocale,
	translations,
} from "~/lib/i18n";
import { I18nScript, I18nContext } from "~/shared/i18n";
import { SvgSprite } from "~/shared/svg-sprite";
import { ToastRegion } from "~/shared/toast";

import globalCss from "~/global.css?url";

////////////////////////////////////////////////////////////////////////////////

interface RouterContext {
	queryClient: QueryClient;
	i18n: {
		locale: string;
		messages: Record<string, AbstractIntlMessages>;
	};
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: (ctx) => {
		const { i18n } = ctx.match.context;
		const t = translations(i18n.messages, i18n.locale, "head");

		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{ title: t("title.root") },
			],
			links: [
				{ rel: "stylesheet", href: globalCss },
				{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
				{ rel: "icon", sizes: "32x32", href: "/favicon.ico" },
			],
		};
	},
	component: RootComponent,
});

////////////////////////////////////////////////////////////////////////////////

/**
 * The root component that wraps the entire app.
 */
function RootComponent() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("RootComponent must be used within an IntlProvider");
	}

	const { locale } = context;
	const dir = getDirFromLocale(locale);

	return (
		<html>
			<head lang={locale} dir={dir}>
				<HeadContent />
			</head>
			<body>
				<div className="contents">
					<Outlet />
				</div>
				<ToastRegion />
				<SvgSprite />
				<I18nScript />
				<Scripts />
			</body>
		</html>
	);
}

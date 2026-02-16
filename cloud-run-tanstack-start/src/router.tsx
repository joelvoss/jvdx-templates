import {
	matchQuery,
	MutationCache,
	type Query,
	QueryClient,
	type QueryKey,
} from "@tanstack/react-query";
import {
	type AnyRouter,
	createRouter,
	type NavigateOptions,
	type ToOptions,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { Fragment } from "react";
import { RouterProvider as RACRouteProvider } from "react-aria-components";

import {
	deLocalizeUrl,
	getCurrentLocale,
	getCurrentMessages,
	localizeUrl,
} from "~/lib/i18n";
import { routeTree } from "~/routeTree.gen";
import { ErrorComponent } from "~/shared/error";
import { I18nProvider } from "~/shared/i18n";
import { NotFoundComponent } from "~/shared/not-found";

////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns the application router. This function is being
 * executed on both the server and the client.
 */
export async function getRouter() {
	// NOTE(joel): Setup a shared QueryClient instance for the router context.
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
			},
		},
		mutationCache: new MutationCache({
			onSuccess: (_data, _variables, _context, mutation) => {
				// NOTE(joel): Invalidate all matching tags at once or everything if no
				// meta is provided.
				void queryClient.invalidateQueries({
					predicate: (query: Query) =>
						mutation.meta?.invalidates?.some((queryKey) =>
							matchQuery({ queryKey }, query),
						) ?? true,
					refetchType: "all",
				});

				// NOTE(joel): Await all matching tags at once.
				if (mutation.meta?.awaits && mutation.meta.awaits.length > 0) {
					let promises: Promise<void>[] = [];
					for (let queryKey of mutation.meta.awaits) {
						promises.push(
							queryClient.invalidateQueries(
								{ queryKey, refetchType: "all" },
								{ cancelRefetch: false },
							),
						);
					}
					return Promise.all(promises);
				}
			},
		}),
	});

	// NOTE(joel): Fetch the current locale and messages before creating the
	// router since we need to provide them in the router context for the intl
	// integration.
	const { locale } = getCurrentLocale();
	const messages = await getCurrentMessages(locale);

	const router = createRouter({
		routeTree,
		context: {
			queryClient,
			i18n: { locale, messages },
		},
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultErrorComponent: ErrorComponent,
		defaultNotFoundComponent: NotFoundComponent,
		// NOTE(joel): Configures how the router will rewrite the location between
		// the actual href and the internal href of the router.
		rewrite: {
			input: ({ url }) => deLocalizeUrl(url),
			output: ({ url }) => localizeUrl(url),
		},
	});

	// NOTE(joel): Order matters for these setup functions since they all use the
	// `Wrap` pattern to provide context to the entire router. The i18n
	// integration needs to be set up before the SSR query integration since the
	// latter relies on the i18n context to provide the correct messages for
	// hydration.
	setupRouterUseI18nIntegration({ router });
	setupRouterReactAriaIntegration({ router });
	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Sets up React Aria integration for the given router.
 * We use the same `Wrap` pattern as in the React Query integration to provide
 * the necessary context to React Aria components.
 */
function setupRouterReactAriaIntegration<Router extends AnyRouter>(opts: {
	router: Router;
}) {
	const OGWrap = opts.router.options.Wrap || Fragment;

	opts.router.options.Wrap = ({ children }) => {
		return (
			<RACRouteProvider
				navigate={(href, routerOpts) =>
					opts.router.navigate({ ...href, ...routerOpts })
				}
				useHref={(href) => opts.router.buildLocation(href).href}
			>
				<OGWrap>{children}</OGWrap>
			</RACRouteProvider>
		);
	};
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Sets up our intl integration for the given router.
 * Important: We also need to render a script tag with the current messages on
 * the client to prevent an extra round trip to fetch messages after hydration.
 * This is done in `routes/__root.tsx`, since script-tags need be rendered
 * inside the `<body>` tag (and `<OGWrap>` wraps the entire router, including
 * the html and head tags).
 */
function setupRouterUseI18nIntegration<Router extends AnyRouter>(opts: {
	router: Router;
}) {
	const OGWrap = opts.router.options.Wrap || Fragment;
	const OGContext = opts.router.options.context || {};

	opts.router.options.Wrap = ({ children }) => {
		const { locale, messages } = OGContext.i18n || {};
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return (
			<>
				<I18nProvider locale={locale} messages={messages} timeZone={tz}>
					<OGWrap>{children}</OGWrap>
				</I18nProvider>
			</>
		);
	};
}

////////////////////////////////////////////////////////////////////////////////

// NOTE: Configure the type of the `href` and `routerOptions` props on all
// React Aria components.
declare module "react-aria-components" {
	interface RouterConfig {
		href: ToOptions;
		routerOptions: Omit<NavigateOptions, keyof ToOptions>;
	}
}

// NOTE: Extend the mutation meta to include invalidation information.
declare module "@tanstack/react-query" {
	interface Register {
		mutationMeta: {
			invalidates?: Array<QueryKey>;
			awaits?: Array<QueryKey>;
		};
	}
}

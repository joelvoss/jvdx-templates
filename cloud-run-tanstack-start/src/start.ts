import { createMiddleware, createStart } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import {
	ensureAnonymousSession,
	validateMutationRequestForServerFn,
} from "~/lib/auth";
import { i18nMiddleware } from "~/lib/i18n";

////////////////////////////////////////////////////////////////////////////////

export const requestI18nMiddleware = createMiddleware().server(
	async ({ next, request }) => {
		const i18n = i18nMiddleware(request);
		if (i18n.redirect) return i18n.redirect;

		if (i18n.setCookie) {
			setResponseHeader("set-cookie", i18n.setCookie);
		}

		return next();
	},
);

////////////////////////////////////////////////////////////////////////////////

export const requestSessionMiddleware = createMiddleware().server(
	async ({ next }) => {
		await ensureAnonymousSession();
		return next();
	},
);

////////////////////////////////////////////////////////////////////////////////

export const requestMutationGuard = createMiddleware().server(
	async ({ next, request }) => {
		const violation = await validateMutationRequestForServerFn(request);
		if (violation) {
			return new Response(violation, { status: 403 });
		}

		return next();
	},
);

////////////////////////////////////////////////////////////////////////////////

export const startInstance = createStart(() => ({
	requestMiddleware: [
		requestI18nMiddleware,
		requestSessionMiddleware,
		requestMutationGuard,
	],
}));

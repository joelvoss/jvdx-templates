import handler from "@tanstack/react-start/server-entry";
import { FastResponse } from "srvx";

import { i18nMiddleware } from "~/lib/i18n";

////////////////////////////////////////////////////////////////////////////////

globalThis.Response = FastResponse;

/**
 * The server entry point for handling requests.
 */
export default {
	async fetch(request: Request) {
		let { redirect, setCookie } = i18nMiddleware(request);

		// NOTE(joel): Redirect before TanStack Start handles the request.
		if (redirect) return redirect;

		const response = await handler.fetch(request);

		// NOTE(joel): Append Set-Cookie header to the TanStack Start response.
		if (setCookie) {
			response.headers.append("Set-Cookie", setCookie);
		}

		return response;
	},
};

import { csrf, CSRFRequest } from '@/lib/csrf';
import { getHost } from '@/lib/get-host';
import { initMiddleware } from '@/lib/init-middleware';

////////////////////////////////////////////////////////////////////////////////

import type { ServerResponse } from 'http';

type Query = { [key: string]: string | string[] | undefined };

type PreviewData = string | false | object | undefined;

type Redirect =
	| {
			statusCode: 301 | 302 | 303 | 307 | 308;
			destination: string;
			basePath?: false;
	  }
	| {
			permanent: boolean;
			destination: string;
			basePath?: false;
	  };

type SSRContext<
	Params extends Query = Query,
	Data extends PreviewData = PreviewData,
> = {
	// NOTE(joel): Request type after all middlewares are applied.
	req: CSRFRequest & {
		baseURL?: string;
	};
	res: ServerResponse;
	params?: Params;
	query: Query;
	preview?: boolean;
	previewData?: Data;
	resolvedUrl: string;
	locale?: string;
	locales?: string[];
	defaultLocale?: string;
};

type SSRResult<P> =
	| { props: P | Promise<P> }
	| { redirect: Redirect }
	| { notFound: true };

type SSRHandler<P = any> = (context: SSRContext) => Promise<SSRResult<P>>;

type SSROptions = {
	origin?: Array<string | RegExp> | string | RegExp | boolean;
};

////////////////////////////////////////////////////////////////////////////////

export function withSSRMiddlewares(
	handler: SSRHandler,
	options: SSROptions = {},
) {
	const { origin = true /* Reflect request origin */ } = options;

	const csrfMiddleware = initMiddleware(csrf({ origin }));

	return async (context: SSRContext) => {
		await csrfMiddleware(context.req, context.res);

		const { origin } = getHost(context.req);
		context.req.baseURL = origin;

		return handler(context);
	};
}

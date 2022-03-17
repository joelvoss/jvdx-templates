import cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import { allowedMethods } from '@/lib/allowed-methods';
import { csrf } from '@/lib/csrf';
import { initMiddleware } from '@/lib/init-middleware';

import type { CSRFRequest } from '@/lib/csrf';

////////////////////////////////////////////////////////////////////////////////

type APIHandler = (req: NextApiRequest, res: NextApiResponse) => void;

type APIMiddlewareOptions = {
	allowedMethods?: string[];
	origin?: Array<string | RegExp> | string | RegExp | boolean;
	preflightContinue?: boolean;
	optionsSuccessStatus?: number;
};

// NOTE(joel): Request type after all middlewares are applied.
export type ExtendedAPIRequest = NextApiRequest & CSRFRequest;

////////////////////////////////////////////////////////////////////////////////

export function withApiMiddlewares(
	handler: APIHandler,
	options: APIMiddlewareOptions = {},
) {
	const {
		allowedMethods: methods = ['OPTIONS', 'GET'],
		origin = true /* Reflect request origin */,
		preflightContinue = false,
		optionsSuccessStatus = 204,
	} = options;

	const allowedMethodsMiddleware = initMiddleware(allowedMethods({ methods }));
	const corsMiddleware = initMiddleware(
		cors({ origin, methods, preflightContinue, optionsSuccessStatus }),
	);
	const csrfMiddleware = initMiddleware(csrf({ origin }));

	return async (req: NextApiRequest, res: NextApiResponse) => {
		await allowedMethodsMiddleware(req, res);
		await corsMiddleware(req, res);
		await csrfMiddleware(req, res);

		return handler(req, res);
	};
}

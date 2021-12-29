import cors from 'cors';
import { allowedMethods } from './allowed-methods';
import { csrf } from './csrf';
import { initMiddleware } from './init-middleware';

////////////////////////////////////////////////////////////////////////////////

export function withApiMiddlewares(handler, options = {}) {
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

	return async (req, res) => {
		await allowedMethodsMiddleware(req, res);
		await corsMiddleware(req, res);
		await csrfMiddleware(req, res);

		return handler(req, res);
	};
}

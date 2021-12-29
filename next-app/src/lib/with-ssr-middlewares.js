import { csrf } from './csrf';
import { getHost } from './get-host';
import { initMiddleware } from './init-middleware';

////////////////////////////////////////////////////////////////////////////////

export function withSSRMiddlewares(handler, options = {}) {
	const { origin = true /* Reflect request origin */ } = options;

	const csrfMiddleware = initMiddleware(csrf({ origin }));

	return async context => {
		await csrfMiddleware(context.req, context.res);

		const { origin } = getHost(context.req);
		context.req.baseURL = origin;

		return handler(context);
	};
}

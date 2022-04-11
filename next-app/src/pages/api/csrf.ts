import { getMethod } from '@/lib/get-method';
import { withApiMiddlewares } from '@/lib/with-api-middlewares';

import type { NextApiResponse } from 'next';
import type { ExtendedAPIRequest } from '@/lib/with-api-middlewares';

////////////////////////////////////////////////////////////////////////////////

/**
 * OPTIONS | GET - /{parent=csrf}
 * Main request handler for all incoming request.
 */
export default withApiMiddlewares(
	(req, res) => {
		const method = getMethod(req);

		if (method === 'GET') {
			return handleGET(req, res);
		}
	},
	{ allowedMethods: ['OPTIONS', 'GET'] },
);

/**
 * GET - /{parent=csrf}
 * Returns a CSRF token. Used client side to retrieve a CSRF token if it cannot
 * be seeded through SSR.
 */
function handleGET(req: ExtendedAPIRequest, res: NextApiResponse) {
	const { csrf } = req;
	return res.status(200).json({ token: csrf?.token });
}

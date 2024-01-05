import { withApiMiddlewares } from '@/lib/with-api-middlewares';
import { getMethod } from '@/lib/get-method';

import type { NextApiResponse } from 'next';
import type { ExtendedAPIRequest } from '@/lib/with-api-middlewares';

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): In-memory 'database' used to store example data.
// This is obviously not production ready!
let tmpData: { [key: string]: string } = {};

////////////////////////////////////////////////////////////////////////////////

/**
 * OPTIONS | GET | POST - /{parent=form}
 * Main request handler for all incoming request.
 */
export default withApiMiddlewares(
	(req, res) => {
		const method = getMethod(req);

		if (method === 'GET') {
			return handleGET(req, res);
		}

		if (method === 'POST') {
			return handlePOST(req, res);
		}
	},
	{ allowedMethods: ['OPTIONS', 'GET', 'POST'] },
);

////////////////////////////////////////////////////////////////////////////////

/**
 * GET - /{parent=form}
 * Returns the `tmpData`.
 */
function handleGET(_: ExtendedAPIRequest, res: NextApiResponse) {
	res.status(200).json(tmpData);
	return;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * POST - /{parent=form}
 * Adds new data to `tmpData` and returns it.
 */
async function handlePOST(req: ExtendedAPIRequest, res: NextApiResponse) {
	const { csrf } = req;

	// NOTE(joel): CSRF protection is only useful when data is being mutated
	if (!csrf?.verified) {
		res.status(403).json({ code: 'csrf/FORBIDDEN' });
		return;
	}
	const data = req.body;

	for (let key of Object.keys(data)) {
		if (!key.startsWith('__')) {
			tmpData[key] = data[key];
		}
	}

	await new Promise(r => setTimeout(r, 500));

	if (req.body?.__redirectTo) {
		res.redirect(303, req.body?.__redirectTo);
		return;
	}
	res.status(200).json(tmpData);
	return;
}

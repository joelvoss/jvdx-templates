import { withApiMiddlewares } from '@/lib/with-api-middlewares';
import { getMethod } from '@/lib/get-method';

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): In-memory 'database' used to store example data.
// This is obviously not production ready!
let tmpData = {};

////////////////////////////////////////////////////////////////////////////////

/**
 * OPTIONS | GET | POST - /{parent=form}
 * Main request handler for all incoming request.
 * @param {Request} req
 * @param {Response} res
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
 * @param {Request} req
 * @param {Response} res
 * @returns {Object}
 */
function handleGET(req, res) {
	return res.status(200).json(tmpData);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * POST - /{parent=form}
 * Adds new data to `tmpData` and returns it.
 * @param {Request} req
 * @param {Response} res
 * @returns {Object}
 */
async function handlePOST(req, res) {
	const { csrf } = req;

	// NOTE(joel): CSRF protection is only useful when data is being mutated
	if (!csrf?.verified) {
		return res.status(403).json({ code: 'csrf/FORBIDDEN' });
	}
	const data = req.body;

	for (let key of Object.keys(data)) {
		if (!key.startsWith('__')) {
			tmpData[key] = data[key];
		}
	}

	await new Promise(r => setTimeout(r, 500));

	if (req.body?.__redirectTo) {
		return res.redirect(303, req.body?.__redirectTo);
	}
	return res.status(200).json(tmpData);
}

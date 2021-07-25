import cors from 'cors';
import { initMiddleware } from '@/lib/init-middleware';
import { csrf } from '@/lib/csrf';

////////////////////////////////////////////////////////////////////////////////

const ALLOWED_METHODS = ['OPTIONS', 'GET', 'POST'];

const corsMiddleware = initMiddleware(
	cors({
		origin: true /* Reflect request origin */,
		methods: ALLOWED_METHODS,
		preflightContinue: false,
		optionsSuccessStatus: 204,
	}),
);

const csrfMiddleware = initMiddleware(
	csrf({ origin: true /* Reflect request origin */ }),
);

////////////////////////////////////////////////////////////////////////////////

// NOTE(joel): In-memory 'database' used to store example data.
let tmpData = {};

////////////////////////////////////////////////////////////////////////////////

/**
 * Main request handler for all incoming request.
 * @param {Request} req
 * @param {Response} res
 */
export default async function handler(req, res) {
	// NOTE(joel): Run middlewares first.
	await corsMiddleware(req, res);
	await csrfMiddleware(req, res);

	const _method = req.method && req.method.toUpperCase();

	if (_method && !ALLOWED_METHODS.includes(_method)) {
		res.setHeader('Allow', ALLOWED_METHODS);
		res.status(405).json({
			code: 'METHOD_NOT_ALLOWED',
			error: `Method "${_method}" not allowed`,
		});
	}

	if (_method === 'GET') {
		return handleGET(req, res);
	}

	if (_method === 'POST') {
		return handlePOST(req, res);
	}
}

/**
 * GET /form
 * Returns the CSRF token.
 * @param {Request} req
 * @param {Response} res
 */
function handleGET(req, res) {
	return res.status(200).json(tmpData);
}

/**
 * POST /form
 * Returns the CSRF token.
 * @param {Request} req
 * @param {Response} res
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

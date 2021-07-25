import cors from 'cors';
import { csrf } from '@/lib/csrf';
import { initMiddleware } from '@/lib/init-middleware';

////////////////////////////////////////////////////////////////////////////////

const ALLOWED_METHODS = ['OPTIONS', 'GET'];

const corsMiddleware = initMiddleware(
	cors({
		origin: true /* Reflect request origin */,
		methods: ['OPTIONS', 'GET'],
		preflightContinue: false,
		optionsSuccessStatus: 204,
	}),
);

const csrfMiddleware = initMiddleware(
	csrf({ origin: true /* Reflect request origin */ }),
);

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
}

/**
 * GET /csrf
 * Returns the CSRF token.
 * @param {Request} req
 * @param {Response} res
 */
function handleGET(req, res) {
	const { csrf } = req;
	return res.status(200).json({ token: csrf.token });
}

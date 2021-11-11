import cors from 'cors';
import { csrf } from '@/lib/csrf';
import { allowedMethods } from '@/lib/allowed-methods';
import { initMiddleware } from '@/lib/init-middleware';
import { getMethod } from '@/lib/get-method';

////////////////////////////////////////////////////////////////////////////////

const ALLOWED_METHODS = ['OPTIONS', 'GET'];

////////////////////////////////////////////////////////////////////////////////

const allowedMethodsMiddleware = initMiddleware(
	allowedMethods({ methods: ALLOWED_METHODS }),
);

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

/**
 * Main request handler for all incoming request.
 * @param {Request} req
 * @param {Response} res
 */
export default async function handler(req, res) {
	await allowedMethodsMiddleware(req, res);
	await corsMiddleware(req, res);
	await csrfMiddleware(req, res);

	const method = getMethod(req);

	if (method === 'GET') {
		return handleGET(req, res);
	}
}

/**
 * GET - /{parent=csrf}
 * Returns a CSRF token. Used client side to retrieve a CSRF token if it cannot
 * be seeded through SSR.
 * @param {Request} req
 * @param {Response} res
 */
function handleGET(req, res) {
	const { csrf } = req;
	return res.status(200).json({ token: csrf.token });
}

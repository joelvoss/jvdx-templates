import express from 'express';
import { cacheControl } from '@/helper/cache-control';
import { error, info } from '@/helper/console';

import type { Request, Response } from 'express';

// eslint-disable-next-line new-cap
export const router = express.Router();

/**
 * GET - /{parent=hello-world}
 */
export function helloWorldRoute(req: Request, res: Response) {
	try {
		const { query } = req;
		info(`routes/hello-world - Processed query '${JSON.stringify(query)}'`);
		return res.status(200).json({ message: 'ok', query });
	} catch (err: any) {
		error(err.message);
		const statusCode = err.status || 500;
		return res.status(statusCode).json(err.message);
	}
}

router.get(`/`, cacheControl({ enabled: false }), helloWorldRoute);

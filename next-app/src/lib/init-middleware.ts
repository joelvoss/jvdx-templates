import type { IncomingMessage, ServerResponse } from 'http';

type Middleware<Req extends IncomingMessage, Res extends ServerResponse> = (
	req: Req,
	res: Res,
	next: (result?: any) => void,
) => void;

/**
 * initMiddleware awaits a given middleware to execute before continuing
 * and throws an error when an error happens in the middleware.
 */
export function initMiddleware<
	Req extends IncomingMessage,
	Res extends ServerResponse,
>(middleware: Middleware<Req, Res>) {
	return (req: Req, res: Res) =>
		new Promise((resolve, reject) => {
			middleware(req, res, result => {
				if (result instanceof Error) {
					return reject(result);
				}
				return resolve(result);
			});
		});
}

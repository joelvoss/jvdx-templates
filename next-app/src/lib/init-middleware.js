/**
 * @callback Middleware
 * @param {Request} req
 * @param {Response} res
 * @param {(result: T) => void} cb
 * @template T
 */

/**
 * initMiddleware awaits a given middleware to execute before continuing
 * and throws an error when an error happens in the middleware.
 * @param {Middleware<T>} middleware
 * @returns {(req: Request, res: Response) => Promise<T>}
 * @template T
 */
export function initMiddleware(middleware) {
	return (req, res) =>
		new Promise((resolve, reject) => {
			middleware(req, res, result => {
				if (result instanceof Error) {
					return reject(result);
				}
				return resolve(result);
			});
		});
}

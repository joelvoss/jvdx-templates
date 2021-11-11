import { getMethod } from '@/lib/get-method';

/**
 * allowedMethods
 * @param {{ methods: string[] }} options
 * @returns {(req: Reqest, res: Response, done: Function) => void}
 */
export function allowedMethods(options = {}) {
	if (options.methods == null) {
		throw new TypeError(`"options.methods" required.`);
	}
	if (!Array.isArray(options.methods)) {
		throw new TypeError(
			`"options.methods" must be an array if method strings.`,
		);
	}

	return (req, res, done) => {
		const method = getMethod(req);
		if (method && !options.methods.includes(method)) {
			res.setHeader('Allow', options.methods);
			return res.status(405).json({
				code: 'METHOD_NOT_ALLOWED',
				error: `Method "${method}" not allowed`,
			});
		}
		done();
	};
}

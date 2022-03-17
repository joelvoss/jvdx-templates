import { getMethod } from '@/lib/get-method';
import { isArray, isNonNull } from '@/lib/assertions';

import type { IncomingMessage, ServerResponse } from 'http';

type AllowedMethodsOptions = {
	methods?: string[];
};

type AllowedMethodsRequest = IncomingMessage;

type AllowedMethodsResponse<T = any> = ServerResponse & {
	json: (body: T) => void;
	status: (statusCode: number) => AllowedMethodsResponse<T>;
};

/**
 * allowedMethods is a middleware that checks if a given set of request methods
 * are present on the incoming request object.
 */
export function allowedMethods(options: AllowedMethodsOptions = {}) {
	if (!isNonNull(options.methods)) {
		throw new TypeError(`"options.methods" required.`);
	}

	if (!isArray(options.methods)) {
		throw new TypeError(`"options.methods" must be an array of method names.`);
	}

	return (
		req: AllowedMethodsRequest,
		res: AllowedMethodsResponse,
		done: (result?: any) => void,
	) => {
		const method = getMethod(req);
		const methods = options.methods as string[];

		if (method && !methods.includes(method)) {
			res.setHeader('Allow', methods);
			return res.status(405).json({
				code: 'METHOD_NOT_ALLOWED',
				error: `Method "${method}" not allowed`,
			});
		}
		done();
	};
}

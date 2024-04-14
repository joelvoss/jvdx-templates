import type { StatusCode } from 'hono/utils/http-status';

interface HTTPExceptionOptions {
	res?: Response;
	message?: string;
	code?: string;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * `HTTPException` should be thrown when a fatal error occurs in a route
 * handler.
 */
export class HTTPException extends Error {
	readonly code?: string;
	readonly res?: Response;
	readonly status: StatusCode;

	constructor(status: StatusCode = 500, options?: HTTPExceptionOptions) {
		super(options?.message);
		this.code = options?.code;
		this.res = options?.res;
		this.status = status;
	}

	getResponse(): Response {
		if (this.res) return this.res;
		let message = this.message || 'Internal Server Error';
		let code = this.code || 'INTERNAL_SERVER_ERROR';
		let body = JSON.stringify({ message, code });
		let headers = {
			'content-type': 'application/json; charset=UTF-8',
		};
		return new Response(body, {
			status: this.status,
			headers,
		});
	}
}

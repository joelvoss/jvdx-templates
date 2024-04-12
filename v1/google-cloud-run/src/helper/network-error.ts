/**
 * NetworkError is a special error instance that can be used to indicate
 * a network error.
 */
export class NetworkError extends Error {
	name: string;
	message: string;
	status: number;
	originalError: Error;

	constructor(message: Error | string, statusCode: number = 500) {
		super();

		if (message instanceof Error) {
			this.originalError = message;
			({ message } = message);
		} else {
			this.originalError = new Error(message);
			this.originalError.stack = this.stack;
		}

		this.name = 'NetworkError';
		this.message = message;
		this.status = statusCode;
	}
}

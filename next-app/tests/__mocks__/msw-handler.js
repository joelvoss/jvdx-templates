/**
 * NOTE(joel): This file contains mocks for REST API calls made by our
 * client side code. This includes request against our own `/api` routes.
 */
import { rest } from 'msw';

export const handlers = [
	// NOTE(joel): Mock our CSRF api route.
	rest.get('/api/csrf', (_, res, ctx) =>
		res(
			ctx.status(200),
			ctx.json({
				token: 'test-csrf-token',
			}),
		),
	),
];

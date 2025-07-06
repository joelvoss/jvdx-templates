import { describe, expect, test, vi } from 'vitest';
import { build } from '../src/index';

// NOTE(joel): See `__mocks__/@google-cloud/firestore.ts` for mock
// implementation.
vi.mock('@google-cloud/firestore');

describe('API (v1)', () => {
	describe('GET /v1/books', () => {
		test('success', async () => {
			let app = build();

			let res = await app.request('/v1/books');
			let data = await res.json();

			expect(res.status).toBe(200);
			expect(data).toMatchSnapshot();
		});
	});

	describe('POST /v1/books', () => {
		test('success', async () => {
			let app = build();

			let res = await app.request('/v1/books', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'My first Book', author: 'me' }),
			});
			let data = await res.json();

			expect(res.status).toBe(200);
			expect(data).toMatchSnapshot();
		});

		test('invalid payload', async () => {
			let app = build();

			let res = await app.request('/v1/books', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					/* title: 'My first Book', */ author: 'Test Author',
				}),
			});
			let data = await res.json();

			expect(res.status).toBe(400);
			expect(data).toMatchSnapshot();
		});
	});

	describe('GET /v1/books/:id', () => {
		test('success', async () => {
			let app = build();

			let res = await app.request(
				'/v1/books/04e3d6d9-8e83-4351-8f5b-59d597d0c9f7',
			);
			let data = await res.json();

			expect(res.status).toBe(200);
			expect(data).toMatchSnapshot();
		});

		test('not found', async () => {
			let app = build();

			let res = await app.request('/v1/books/not-found');
			let data = await res.json();

			expect(res.status).toBe(404);
			expect(data).toMatchSnapshot();
		});
	});
});

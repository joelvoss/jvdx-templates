import http from 'http';
import listen from 'test-listen';
import fetch, { Response, Headers, Request } from 'cross-fetch';
import { request } from 'request-lit';
import { app } from '../src/index';

if (!global.fetch) {
	global.fetch = fetch;
	global.Response = Response;
	global.Headers = Headers;
	global.Request = Request;
}

async function setupServer() {
	const server = http.createServer(app);
	const baseURL = await listen(server);

	return {
		server,
		baseURL,
	};
}

let consoleLogSpy, consoleErrorSpy;

describe(`/users`, () => {
	beforeEach(async () => {
		consoleLogSpy = console.log;
		consoleErrorSpy = console.error;
		console.log = jest.fn();
		console.error = jest.fn();
	});

	afterEach(() => {
		console.log = consoleLogSpy;
		console.error = consoleErrorSpy;
	});

	it(`GET /users`, async () => {
		const { server, baseURL } = await setupServer();

		const { data } = await request.get('users', { baseURL });
		expect(data).toStrictEqual({
			count: 0,
			users: [],
		});

		server.close();
	});

	it(`POST /users`, async () => {
		const { server, baseURL } = await setupServer();

		const { data } = await request.post(
			'users',
			{ name: 'Test name' },
			{ baseURL },
		);

		expect(data).toMatchObject({
			name: 'Test name',
		});

		server.close();
	});

	it(`GET /users/:userId`, async () => {
		const { server, baseURL } = await setupServer();

		const {
			data: { users },
		} = await request.get('users', { baseURL });
		const { uid, name } = users[0];
		const { data } = await request.get(`users/${uid}`, { baseURL });
		expect(data).toStrictEqual({ uid, name });

		server.close();
	});

	it(`PUT /users/:userId`, async () => {
		const { server, baseURL } = await setupServer();

		const {
			data: { users },
		} = await request.get('users', { baseURL });
		const { uid } = users[0];
		const { data } = await request.put(
			`users/${uid}`,
			{ name: 'New test name' },
			{ baseURL },
		);

		expect(data).toStrictEqual({ uid, name: 'New test name' });

		server.close();
	});

	it(`DELETE /users/:userId`, async () => {
		const { server, baseURL } = await setupServer();

		const {
			data: { users },
		} = await request.get('users', { baseURL });
		const { uid } = users[0];
		const { status: statusCode } = await request.delete(`users/${uid}`, {
			baseURL,
		});

		expect(statusCode).toBe(200);

		server.close();
	});
});

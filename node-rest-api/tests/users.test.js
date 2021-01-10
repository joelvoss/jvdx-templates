import http from 'http';
import listen from 'test-listen';
import got from 'got';
import { app } from '../src/index';

async function setupServer() {
	const server = http.createServer(app);
	const prefixUrl = await listen(server);

	return {
		server,
		prefixUrl,
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
		const { server, prefixUrl } = await setupServer();

		const res = await got('users', { prefixUrl }).json();
		expect(res).toStrictEqual({
			count: 0,
			users: [],
		});

		server.close();
	});

	it(`POST /users`, async () => {
		const { server, prefixUrl } = await setupServer();

		const res = await got('users', {
			prefixUrl,
			method: 'POST',
			json: { name: 'Test name' },
		}).json();

		expect(res).toMatchObject({
			name: 'Test name',
		});

		server.close();
	});

	it(`GET /users/:userId`, async () => {
		const { server, prefixUrl } = await setupServer();

		const { users } = await got('users', { prefixUrl }).json();
		const { uid, name } = users[0];
		const res = await got(`users/${uid}`, { prefixUrl }).json();
		expect(res).toStrictEqual({ uid, name });

		server.close();
	});

	it(`PUT /users/:userId`, async () => {
		const { server, prefixUrl } = await setupServer();

		const { users } = await got('users', { prefixUrl }).json();
		const { uid } = users[0];
		const res = await got(`users/${uid}`, {
			prefixUrl,
			method: 'PUT',
			json: {
				name: 'New test name',
			},
		}).json();
		expect(res).toStrictEqual({ uid, name: 'New test name' });

		server.close();
	});

	it(`DELETE /users/:userId`, async () => {
		const { server, prefixUrl } = await setupServer();

		const { users } = await got('users', { prefixUrl }).json();
		const { uid } = users[0];
		const res = await got(`users/${uid}`, {
			prefixUrl,
			method: 'DELETE',
			resolveBodyOnly: false,
		});
		expect(res.statusCode).toBe(200);

		server.close();
	});
});

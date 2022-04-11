// @ts-nocheck

import { CloudEvent } from 'cloudevents';
import { getFunction } from '@google-cloud/functions-framework/build/src/testing';

////////////////////////////////////////////////////////////////////////////////

describe('helloHttp', () => {
	beforeAll(async () => {
		await import('../src/index');
	});

	test('handle a HTTP event', async () => {
		const handler = getFunction('helloHttp');

		const req = { query: {}, body: {} };
		const result = jest.fn();
		const res = { json: result };

		handler(req, res);

		expect(result).toBeCalledTimes(1);
		expect(result).toBeCalledWith({
			message: 'Hello World!',
		});
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('helloGCS', () => {
	beforeAll(async () => {
		await import('../src/index');
	});

	let origConsoleLog;
	beforeEach(() => {
		origConsoleLog = console.log;
		console.log = jest.fn();
	});
	afterEach(() => {
		console.log = origConsoleLog;
	});

	test('handle a GCS event', () => {
		const handler = getFunction('helloGCS');
		handler(
			new CloudEvent({
				id: 'g1bb3r1sh',
				type: 'google.storage.object.finalize',
				source: 'https://test.source',
				data: {
					name: 'file-g1bb3r1sh',
					resourceState: 'exists',
					metageneration: '1',
					bucket: 'bucket-name',
					timeCreated: '2022-21-03T12:00:00.000Z',
					updated: '2022-21-03T12:00:00.000Z',
				},
			}),
		);

		expect(console.log.mock.calls).toEqual([
			['Event ID: g1bb3r1sh'],
			['Event Type: google.storage.object.finalize'],
			['Bucket: bucket-name'],
			['File: file-g1bb3r1sh'],
			['Metageneration: 1'],
			['Created: 2022-21-03T12:00:00.000Z'],
			['Updated: 2022-21-03T12:00:00.000Z'],
		]);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe('helloPubSub', () => {
	beforeAll(async () => {
		await import('../src/index');
	});

	let origConsoleLog;
	beforeEach(() => {
		origConsoleLog = console.log;
		console.log = jest.fn();
	});
	afterEach(() => {
		console.log = origConsoleLog;
	});

	test('handle a PubSub event', () => {
		const handler = getFunction('helloPubSub');
		handler(
			new CloudEvent({
				id: 'g1bb3r1sh',
				type: 'google.pubsub.topic.publish',
				source: 'https://test.source',
				data: {
					message: {
						data: Buffer.from('from the PubSub message').toString('base64'),
						attributes: {
							atr: 'test-attribute',
						},
						messageId: 'message-g1bb3r1sh',
						publishTime: '2022-21-03T12:00:00.000Z',
						orderingKey: '',
					},
				},
			}),
		);

		expect(console.log.mock.calls).toEqual([
			['Hello from the PubSub message!'],
		]);
	});
});

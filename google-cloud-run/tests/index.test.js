import { v4 as uuidv4 } from 'uuid';
import {
	handleHTTPTrigger,
	handleStorageTrigger,
	handlePubSubTrigger,
} from '../src/index';

////////////////////////////////////////////////////////////////////////////////

describe(`handleHTTPTrigger`, () => {
	it(`should print hello world`, async () => {
		// Mock ExpressJS 'req' and 'res' parameters
		const req = { query: {}, body: {} };
		const res = { send: jest.fn() };

		handleHTTPTrigger(req, res);

		expect(res.send).toBeCalledTimes(1);
		expect(res.send).toBeCalledWith('Hello World!');
	});
});

////////////////////////////////////////////////////////////////////////////////

describe(`handleStorageTrigger`, () => {
	let spyConsoleError, spyConsoleLog;
	const mockConsole = function () {
		spyConsoleError = jest.spyOn(console, `error`).mockImplementation();
		spyConsoleLog = jest.spyOn(console, `log`).mockImplementation();
	};

	const restoreConsole = function () {
		spyConsoleError.mockRestore();
		spyConsoleLog.mockRestore();
	};

	beforeEach(mockConsole);
	afterEach(restoreConsole);

	it(`should return a filename`, async () => {
		const filename = uuidv4();
		const eventType = 'google.storage.object.finalize';
		const event = {
			name: filename,
			resourceState: 'exists',
			metageneration: '1',
			bucket: 'bucket-name',
			timeCreated: '',
			updated: '',
		};
		const context = {
			eventId: 'g1bb3r1sh',
			eventType: eventType,
		};

		handleStorageTrigger(event, context);
		expect(console.log).toBeCalledWith(`  File: ${filename}`);
		expect(console.log).toBeCalledWith(`  Event Type: ${eventType}`);
	});
});

////////////////////////////////////////////////////////////////////////////////

describe(`handlePubSubTrigger`, () => {
	let spyConsoleError, spyConsoleLog;
	const mockConsole = function () {
		spyConsoleError = jest.spyOn(console, `error`).mockImplementation();
		spyConsoleLog = jest.spyOn(console, `log`).mockImplementation();
	};

	const restoreConsole = function () {
		spyConsoleError.mockRestore();
		spyConsoleLog.mockRestore();
	};

	beforeEach(mockConsole);
	afterEach(restoreConsole);

	it('should print a name', () => {
		// Create mock Pub/Sub event
		const name = uuidv4();
		const event = {
			data: Buffer.from(name).toString('base64'),
		};

		// Call tested function and verify its behavior
		handlePubSubTrigger(event);
		expect(console.log).toBeCalledWith(`Hello, ${name}!`);
	});
});

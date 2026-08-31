import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

////////////////////////////////////////////////////////////////////////////////
// Mocks

let mockListBooks = vi.fn();
let mockClose = vi.fn();
let mockAddContext = vi.fn();
let mockInfo = vi.fn();
let mockError = vi.fn();

vi.mock('~/adapters/firestore', () => ({
	Firestore: {
		listBooks: mockListBooks,
		close: mockClose,
	},
}));

vi.mock('~/lib/logger', () => ({
	logger: {
		addContext: mockAddContext,
		info: mockInfo,
		error: mockError,
	},
}));

////////////////////////////////////////////////////////////////////////////////
// Tests

describe('Cloud Run job entrypoint', () => {
	let main: typeof import('../src/index').main;
	let run: typeof import('../src/index').run;

	beforeEach(async () => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		process.exitCode = undefined;

		mockClose.mockResolvedValue(undefined);
		main = (await import('../src/index')).main;
		run = (await import('../src/index')).run;
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		process.exitCode = undefined;
	});

	test('runs the job, logs normalized task metadata, and closes Firestore', async () => {
		vi.stubEnv('CLOUD_RUN_TASK_INDEX', '2');
		vi.stubEnv('CLOUD_RUN_TASK_ATTEMPT', '1');
		mockListBooks.mockResolvedValue([
			{ id: 'book-1', title: 'Dune', author: 'Frank Herbert' },
			{ id: 'book-2', title: 'Neuromancer', author: 'William Gibson' },
		]);

		await main();

		expect(mockAddContext).toHaveBeenCalledWith({
			taskIndex: 2,
			taskAttempt: 1,
		});
		expect(mockInfo).toHaveBeenNthCalledWith(1, 'Cloud Run job started');
		expect(mockInfo).toHaveBeenNthCalledWith(2, 'Cloud Run job finished', {
			processedBooks: 2,
		});
		expect(mockClose).toHaveBeenCalledTimes(1);
	});

	test('closes Firestore when the job fails', async () => {
		let error = new Error('Firestore unavailable');
		mockListBooks.mockRejectedValue(error);

		await expect(main()).rejects.toThrow(error);

		expect(mockClose).toHaveBeenCalledTimes(1);
	});

	test('logs failures and sets a non-zero exit code', async () => {
		let error = new Error('Firestore unavailable');
		mockListBooks.mockRejectedValue(error);

		await run();

		expect(mockError).toHaveBeenCalledWith('Firestore unavailable', { error });
		expect(process.exitCode).toBe(1);
	});
});

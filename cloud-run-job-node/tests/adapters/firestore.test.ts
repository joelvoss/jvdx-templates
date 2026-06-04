import { beforeEach, describe, expect, test, vi } from 'vitest';

////////////////////////////////////////////////////////////////////////////////
// Mocks

let mockCollection = vi.fn();
let mockGet = vi.fn();
let mockInfo = vi.fn();

vi.mock('@google-cloud/firestore', () => ({
	Firestore: vi.fn(function () {
		return {
			collection: mockCollection,
		};
	}),
}));

vi.mock('../../src/lib/logger', () => ({
	logger: {
		info: mockInfo,
	},
}));

////////////////////////////////////////////////////////////////////////////////
// Tests

describe('Firestore adapter', () => {
	let Firestore: typeof import('../../src/adapters/firestore').Firestore;

	beforeEach(async () => {
		vi.resetModules();
		vi.clearAllMocks();

		mockCollection.mockReturnValue({ get: mockGet });
		Firestore = (await import('../../src/adapters/firestore')).Firestore;
	});

	describe('listBooks', () => {
		test('reads every document from the books collection', async () => {
			mockGet.mockResolvedValue({
				docs: [
					{
						id: 'book-1',
						data: () => ({ title: 'Dune', author: 'Frank Herbert' }),
					},
					{
						id: 'book-2',
						data: () => ({ title: 'Neuromancer', author: 'William Gibson' }),
					},
				],
			});

			let books = await Firestore.listBooks();

			expect(mockInfo).toHaveBeenCalledWith('Listing books from Firestore');
			expect(mockCollection).toHaveBeenCalledWith('books');
			expect(mockGet).toHaveBeenCalledTimes(1);
			expect(books).toEqual([
				{
					id: 'book-1',
					title: 'Dune',
					author: 'Frank Herbert',
				},
				{
					id: 'book-2',
					title: 'Neuromancer',
					author: 'William Gibson',
				},
			]);
		});

		test('returns an empty list when the collection has no documents', async () => {
			mockGet.mockResolvedValue({ docs: [] });

			let books = await Firestore.listBooks();

			expect(books).toEqual([]);
		});

		test('lets Firestore read failures reject to the caller', async () => {
			let error = new Error('Firestore unavailable');
			mockGet.mockRejectedValue(error);

			await expect(Firestore.listBooks()).rejects.toThrow(error);
		});
	});
});

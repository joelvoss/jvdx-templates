import { beforeEach, describe, expect, test, vi } from 'vitest';

////////////////////////////////////////////////////////////////////////////////
// Mocks

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockDoc = vi.fn(() => {
	return {
		get: mockGet,
		set: mockSet,
		update: mockUpdate,
		delete: mockDelete,
	};
});

const mockCollection = vi.fn(() => {
	return {
		get: mockGet,
		doc: mockDoc,
	};
});

vi.mock('@google-cloud/firestore', function () {
	return {
		Firestore: vi.fn(function () {
			return {
				collection: mockCollection,
				doc: mockDoc,
			};
		}),
	};
});

////////////////////////////////////////////////////////////////////////////////
// Tests

describe('Firestore adapter', () => {
	let Firestore: typeof import('~/adapters/firestore').Firestore;

	beforeEach(async () => {
		vi.resetModules();
		vi.resetAllMocks();
		Firestore = (await import('~/adapters/firestore')).Firestore;
	});

	describe('getBooks', () => {
		test('returns all books from the collection', async () => {
			const mockBooks = [
				{ id: '1', title: 'Book One', author: 'Author One' },
				{ id: '2', title: 'Book Two', author: 'Author Two' },
			];

			mockGet.mockResolvedValue({
				docs: mockBooks.map(book => ({
					id: book.id,
					data: () => ({ title: book.title, author: book.author }),
				})),
			});

			const result = await Firestore.getBooks();

			expect(mockCollection).toHaveBeenCalledWith('books');
			expect(mockGet).toHaveBeenCalled();
			expect(result).toEqual(mockBooks);
		});

		test('returns empty array when no books exist', async () => {
			mockGet.mockResolvedValueOnce({ docs: [] });

			const result = await Firestore.getBooks();

			expect(result).toEqual([]);
		});
	});

	describe('getBook', () => {
		test('returns book when it exists', async () => {
			const mockBook = {
				id: 'test-id',
				title: 'Test Book',
				author: 'Test Author',
			};

			mockGet.mockResolvedValueOnce({
				exists: true,
				data: () => mockBook,
			});

			const result = await Firestore.getBook({ id: 'test-id' });

			expect(mockCollection).toHaveBeenCalledWith('books');
			expect(mockDoc).toHaveBeenCalledWith('test-id');
			expect(mockGet).toHaveBeenCalled();
			expect(result).toEqual(mockBook);
		});

		test('returns null when book does not exist', async () => {
			mockGet.mockResolvedValueOnce({
				exists: false,
			});

			const result = await Firestore.getBook({ id: 'non-existent-id' });

			expect(mockCollection).toHaveBeenCalledWith('books');
			expect(mockDoc).toHaveBeenCalledWith('non-existent-id');
			expect(result).toBeNull();
		});
	});

	describe('createBook', () => {
		test('creates a new book with generated ID', async () => {
			const payload = { title: 'New Book', author: 'New Author' };
			mockSet.mockResolvedValueOnce(undefined);

			const result = await Firestore.createBook(payload);

			expect(mockCollection).toHaveBeenCalledWith('books');
			expect(mockDoc).toHaveBeenCalled();
			expect(mockSet).toHaveBeenCalledWith(
				expect.objectContaining({
					id: expect.any(String),
					title: 'New Book',
					author: 'New Author',
				}),
			);
			expect(result).toBe(true);
		});
	});

	describe('updateBook', () => {
		test('updates an existing book with partial data', async () => {
			mockUpdate.mockResolvedValueOnce(undefined);

			const result = await Firestore.updateBook({
				id: 'test-id',
				title: 'Updated Title',
			});

			expect(mockCollection).toHaveBeenCalledWith('books');
			expect(mockDoc).toHaveBeenCalledWith('test-id');
			expect(mockUpdate).toHaveBeenCalledWith({ title: 'Updated Title' });
			expect(result).toBe(true);
		});

		test('updates book with multiple fields', async () => {
			mockUpdate.mockResolvedValueOnce(undefined);

			const result = await Firestore.updateBook({
				id: 'test-id',
				title: 'Updated Title',
				author: 'Updated Author',
			});

			expect(mockUpdate).toHaveBeenCalledWith({
				title: 'Updated Title',
				author: 'Updated Author',
			});
			expect(result).toBe(true);
		});
	});

	describe('deleteBook', () => {
		test('deletes a book by ID', async () => {
			mockDelete.mockResolvedValueOnce(undefined);

			const result = await Firestore.deleteBook({ id: 'test-id' });

			expect(mockCollection).toHaveBeenCalledWith('books');
			expect(mockDoc).toHaveBeenCalledWith('test-id');
			expect(mockDelete).toHaveBeenCalled();
			expect(result).toBe(true);
		});
	});
});

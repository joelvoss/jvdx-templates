'use server';

import { randomUUID } from 'node:crypto';
import { FileSystemDB } from '@/db/file-system-db';

////////////////////////////////////////////////////////////////////////////////

export type Book = {
	id: string;
	title: string;
	author: string;
	year: number;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Fetches the list of books from the database.
 */
export async function createBook(formData: Partial<Book>) {
	const db = await FileSystemDB.getItems();
	const books = (db.books || []) as Book[];
	const updatedBooks = [
		...books,
		{
			id: randomUUID(),
			title: formData.title,
			author: formData.author,
			year: Number(formData.year),
		},
	];
	await FileSystemDB.updateItems({ books: updatedBooks });
	return updatedBooks;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Updates an existing book in the database.
 */
export async function updateBook(formData: Partial<Book>) {
	const db = await FileSystemDB.getItems();
	const books = (db.books || []) as Book[];
	const updatedBooks = books.map((b: Book) =>
		b.id === formData.id
			? {
					...b,
					...formData,
					...(formData.year ? { year: Number(formData.year) } : {}),
				}
			: b,
	);
	await FileSystemDB.updateItems({ books: updatedBooks });
	return updatedBooks;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Deletes a book from the database.
 */
export async function deleteBook(id: string) {
	const db = await FileSystemDB.getItems();
	const books = (db.books || []) as Book[];
	const updatedBooks = books.filter((b: Book) => b.id !== id);
	await FileSystemDB.updateItems({ books: updatedBooks });
	return updatedBooks;
}

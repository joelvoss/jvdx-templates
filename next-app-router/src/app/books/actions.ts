'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { FileSystemDB } from '@/db/file-system-db';

////////////////////////////////////////////////////////////////////////////////

export type Book = {
	id: string;
	title: string;
	author: string;
	year: number;
};

/**
 * Fetches the list of books from the database.
 */
export async function createBook(formData: Partial<Book>) {
	const updatedDb = await FileSystemDB.updateItems(db => {
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
		return { ...db, books: updatedBooks };
	});
	revalidatePath('/books');
	return (updatedDb.books as Book[]).at(-1) as Book;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Updates an existing book in the database.
 */
export async function updateBook(formData: Partial<Book>) {
	const updatedDb = await FileSystemDB.updateItems(db => {
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
		return { ...db, books: updatedBooks };
	});
	revalidatePath('/books');
	return (updatedDb.books as Book[]).find(
		book => book.id === formData.id,
	) as Book;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Deletes a book from the database.
 */
export async function deleteBook(id: string) {
	await FileSystemDB.updateItems(db => {
		const books = (db.books || []) as Book[];
		const updatedBooks = books.filter((b: Book) => b.id !== id);
		return { ...db, books: updatedBooks };
	});
	revalidatePath('/books');
	return undefined;
}

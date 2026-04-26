import * as v from "valibot";

////////////////////////////////////////////////////////////////////////////////

export const BookSchema = v.object({
	id: v.string(),
	title: v.string(),
	author: v.string(),
	isbn: v.string(),
	description: v.string(),
	publishedYear: v.number(),
	coverImageUrl: v.string(),
	createdAt: v.number(),
	updatedAt: v.number(),
});

export type Book = v.InferOutput<typeof BookSchema>;

////////////////////////////////////////////////////////////////////////////////

export const GetBooksSchema = v.object({
	sort: v.optional(v.picklist(["title", "author", "year"]), undefined),
});

////////////////////////////////////////////////////////////////////////////////

export const GetBookSchema = v.object({
	id: v.string(),
});

////////////////////////////////////////////////////////////////////////////////

export const CreateBookSchema = v.object({
	title: v.pipe(v.string(), v.minLength(2)),
	author: v.pipe(v.string(), v.minLength(2)),
	isbn: v.pipe(v.string(), v.check(isValidISBN)),
	publishedYear: v.pipe(
		v.union([v.string(), v.number()]),
		v.toNumber(),
		v.check(isValidPublishedYear),
	),
	description: v.optional(v.pipe(v.string(), v.check(isValidDescription))),
	coverImageUrl: v.optional(v.pipe(v.string(), v.check(isValidCoverImageUrl))),
});

////////////////////////////////////////////////////////////////////////////////

export const UpdateBookSchema = v.object({
	id: v.string(),
	...v.partial(CreateBookSchema).entries,
});

////////////////////////////////////////////////////////////////////////////////

export const DeleteBookSchema = v.object({
	id: v.string(),
});

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates whether a given string is a valid ISBN-10 or ISBN-13. The function
 * first normalizes the input by removing hyphens and spaces, and converting it
 * to uppercase. It then checks if the cleaned string matches the pattern for
 * either ISBN-10 (9 digits followed by a digit or 'X') or ISBN-13 (13 digits).
 * The function returns true if the input is a valid ISBN, and false otherwise.
 */
function isValidISBN(isbn: string): boolean {
	const cleaned = normalizeISBN(isbn);
	return /^(\d{9}[\dX]|\d{13})$/.test(cleaned);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates whether a given description is valid. A valid description is
 * either an empty string or a string that is at least 10 characters long. The
 * function returns true if the description is valid, and false otherwise.
 */
function isValidDescription(description: string) {
	return description === "" || description.length >= 10;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates whether a given URL is a valid cover image URL. A valid cover
 * image URL is either an empty string or a string that can be successfully
 * parsed as a URL. The function returns true if the URL is valid, and false
 * otherwise.
 */
function isValidCoverImageUrl(url: string) {
	if (url === "") return true;

	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Validates whether a given year is a valid published year. A valid published
 * year is a finite integer that is between 1000 and the current year. The
 * function returns true if the year is valid, and false otherwise.
 */
function isValidPublishedYear(year: number) {
	return (
		Number.isFinite(year) &&
		Number.isInteger(year) &&
		year >= 1000 &&
		year <= new Date().getFullYear()
	);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Normalizes an ISBN string by removing hyphens and spaces, and converting it
 * to uppercase. This function is used to standardize ISBN inputs before
 * validation or storage, ensuring that different formats of the same ISBN are
 * treated as equivalent.
 */
export function normalizeISBN(isbn: string) {
	return isbn.replace(/[-\s]/g, "").toUpperCase();
}

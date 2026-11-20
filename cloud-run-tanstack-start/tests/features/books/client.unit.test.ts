import { QueryClient } from "@tanstack/react-query";
import { isNotFound, notFound } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBookMock, updateBookMock, deleteBookMock, getBookMock } =
	vi.hoisted(() => ({
		createBookMock: vi.fn(),
		updateBookMock: vi.fn(),
		deleteBookMock: vi.fn(),
		getBookMock: vi.fn(),
	}));

vi.mock("~/features/books/server", () => ({
	createBook: createBookMock,
	updateBook: updateBookMock,
	deleteBook: deleteBookMock,
	getBook: getBookMock,
	getBooks: vi.fn(),
}));

import {
	bookQueryOptions,
	booksQueryOptions,
	createBookMutationOpts,
	deleteBookMutationOpts,
	updateBookMutationOpts,
} from "~/features/books/client";
import { Route as BookRoute } from "~/routes/{-$locale}/books/$id/route";

////////////////////////////////////////////////////////////////////////////////

describe("features/books/client", () => {
	beforeEach(() => {
		createBookMock.mockReset();
		updateBookMock.mockReset();
		deleteBookMock.mockReset();
		getBookMock.mockReset();
	});
	it("builds stable query keys", () => {
		expect(booksQueryOptions({ sort: undefined }).queryKey).toEqual([
			"books",
			undefined,
			50,
		]);
		expect(booksQueryOptions({ sort: "title" }).queryKey).toEqual([
			"books",
			"title",
			50,
		]);
		expect(bookQueryOptions({ id: "123" }).queryKey).toEqual(["book", "123"]);
	});

	it("wires mutation invalidation keys", () => {
		const createOpts = createBookMutationOpts();
		expect(createOpts.meta).toEqual({ invalidates: [["books"]] });

		const updateOpts = updateBookMutationOpts({ id: "1" });
		expect(updateOpts.meta).toEqual({
			invalidates: [["books"], ["book", "1"]],
		});

		const deleteOpts = deleteBookMutationOpts({ id: "1" });
		expect(deleteOpts.meta).toEqual({
			invalidates: [["books"], ["book", "1"]],
		});
	});

	it("createBookMutationOpts trims and drops empty form values", async () => {
		const opts = createBookMutationOpts();
		const fd = new FormData();
		fd.set("title", " New Book ");
		fd.set("author", "   ");
		fd.set("isbn", "978-1111111111");
		fd.set("publishedYear", "2024");

		await expect(
			Promise.resolve().then(() => (opts as any).mutationFn(fd)),
		).rejects.toMatchObject({
			issues: {
				nested: expect.any(Object),
			},
		});
	});

	it("createBookMutationOpts ignores non-string FormData entries", async () => {
		const opts = createBookMutationOpts();
		const fd = new FormData();
		fd.set("title", " New Book ");
		fd.set("author", "Someone");
		fd.set("isbn", "not-an-isbn");
		fd.set("publishedYear", "2024");
		fd.append("coverImageUrl", new Blob(["x"], { type: "text/plain" }));

		await expect(
			Promise.resolve().then(() => (opts as any).mutationFn(fd)),
		).rejects.toMatchObject({
			issues: expect.any(Object),
		});
	});

	it("updateBookMutationOpts requires id in the FormData", async () => {
		const opts = updateBookMutationOpts({ id: "1" });
		const fd = new FormData();
		fd.set("title", "Updated");

		await expect(
			Promise.resolve().then(() => (opts as any).mutationFn(fd)),
		).rejects.toMatchObject({
			issues: {
				nested: expect.any(Object),
			},
		});
	});

	it("maps server errors consistently to root issues across create, update, and delete", async () => {
		createBookMock.mockRejectedValueOnce(
			new Error("A book with this ISBN already exists."),
		);
		updateBookMock.mockRejectedValueOnce(new Error("Book not found"));
		deleteBookMock.mockRejectedValueOnce(new Error("Forbidden"));

		const createFd = new FormData();
		createFd.set("title", "New Book");
		createFd.set("author", "Someone");
		createFd.set("isbn", "978-1111111111");
		createFd.set("publishedYear", "2024");

		const updateFd = new FormData();
		updateFd.set("id", "book-1");
		updateFd.set("title", "Updated");

		await expect(
			(createBookMutationOpts() as any).mutationFn(createFd),
		).rejects.toEqual({
			issues: { root: ["A book with this ISBN already exists."] },
		});

		await expect(
			(updateBookMutationOpts({ id: "book-1" }) as any).mutationFn(updateFd),
		).rejects.toEqual({
			issues: { root: ["Book not found"] },
		});

		await expect(
			(deleteBookMutationOpts({ id: "book-1" }) as any).mutationFn(),
		).rejects.toEqual({
			issues: { root: ["Forbidden"] },
		});
	});

	it("falls back to root issues when an error message is a non-Valibot JSON array", async () => {
		deleteBookMock.mockRejectedValueOnce(new Error('[{"error":"bad"}]'));

		await expect(
			(deleteBookMutationOpts({ id: "book-1" }) as any).mutationFn(),
		).rejects.toEqual({
			issues: { root: ['[{"error":"bad"}]'] },
		});
	});

	it("throws notFound from book route loader and only retries non-404 errors in the browser", async () => {
		getBookMock.mockResolvedValueOnce(null);

		const queryClient = new QueryClient();
		const loader = BookRoute.options.loader;
		expect(loader).toBeTypeOf("function");
		if (typeof loader !== "function") return;

		let thrown: unknown;
		try {
			await loader({
				context: { queryClient },
				params: { id: "missing-book" },
			} as any);
		} catch (error) {
			thrown = error;
		}

		expect(isNotFound(thrown)).toBe(true);
		expect(getBookMock).toHaveBeenCalledTimes(1);

		const retry = bookQueryOptions({ id: "missing-book" }).retry;
		expect(retry).toBeTypeOf("function");
		if (typeof retry !== "function") return;

		const notFoundError = notFound() as unknown as Error;
		expect(retry(0, new Error("Transient"))).toBe(false);
		expect(retry(0, notFoundError)).toBe(false);

		vi.stubGlobal("window", {});
		try {
			expect(retry(0, notFoundError)).toBe(false);
			expect(retry(0, new Error("Transient"))).toBe(true);
			expect(retry(3, new Error("Transient"))).toBe(false);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});

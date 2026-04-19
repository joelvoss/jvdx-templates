import { describe, expect, it } from "vitest";

import {
	bookQueryOptions,
	booksQueryOptions,
	createBookMutationOpts,
	deleteBookMutationOpts,
	updateBookMutationOpts,
} from "~/features/books/client";

////////////////////////////////////////////////////////////////////////////////

describe("features/books/client", () => {
	it("builds stable query keys", () => {
		expect(booksQueryOptions({ sort: undefined }).queryKey).toEqual([
			"books",
			undefined,
		]);
		expect(booksQueryOptions({ sort: "title" }).queryKey).toEqual([
			"books",
			"title",
		]);
		expect(bookQueryOptions({ id: "123" }).queryKey).toEqual(["book", "123"]);
	});

	it("wires mutation meta await keys", () => {
		const createOpts = createBookMutationOpts({});
		expect(createOpts.meta).toEqual({ awaits: [["books"]] });

		const updateOpts = updateBookMutationOpts({ id: "1" });
		expect(updateOpts.meta).toEqual({
			awaits: [["book", "1"], ["books"]],
		});

		const deleteOpts = deleteBookMutationOpts({ id: "1" });
		expect(deleteOpts.meta).toEqual({
			awaits: [["books"]],
			invalidates: [["book", "1"]],
		});
	});

	it("createBookMutationOpts trims and drops empty form values", async () => {
		const opts = createBookMutationOpts({});
		const fd = new FormData();
		fd.set("title", " New Book ");
		fd.set("author", "   ");
		fd.set("isbn", "978-1111111111");
		fd.set("publishedYear", "2024");

		await expect((opts as any).mutationFn(fd)).rejects.toMatchObject({
			issues: {
				nested: expect.any(Object),
			},
		});
	});

	it("createBookMutationOpts ignores non-string FormData entries", async () => {
		const opts = createBookMutationOpts({});
		const fd = new FormData();
		fd.set("title", " New Book ");
		fd.set("author", "Someone");
		fd.set("isbn", "not-an-isbn");
		fd.set("publishedYear", "2024");
		fd.append("coverImageUrl", new Blob(["x"], { type: "text/plain" }));

		await expect((opts as any).mutationFn(fd)).rejects.toMatchObject({
			issues: expect.any(Object),
		});
	});

	it("updateBookMutationOpts requires id in the FormData", async () => {
		const opts = updateBookMutationOpts({ id: "1" });
		const fd = new FormData();
		fd.set("title", "Updated");

		await expect((opts as any).mutationFn(fd)).rejects.toMatchObject({
			issues: {
				nested: expect.any(Object),
			},
		});
	});
});

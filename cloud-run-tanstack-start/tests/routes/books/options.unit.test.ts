import { describe, expect, it } from "vitest";

import { bookQueryOptions } from "~/routes/{-$locale}/_default/books/$id/-queries";
import { updateBookMutationOpts } from "~/routes/{-$locale}/_default/books/$id/edit/-mutations";
import { booksQueryOptions } from "~/routes/{-$locale}/_default/books/-queries";
import { createBookMutationOpts } from "~/routes/{-$locale}/_default/books/new/-mutations";

////////////////////////////////////////////////////////////////////////////////

describe("books route options", () => {
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
		expect(updateOpts.meta).toEqual({ awaits: [["book", { id: "1" }]] });
	});

	it("createBookMutationOpts trims and drops empty form values", async () => {
		const opts = createBookMutationOpts({});
		const fd = new FormData();
		fd.set("title", " New Book ");
		fd.set("author", "   "); // should be trimmed and dropped
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

		// The key point is: Blob entries are ignored and don't crash,
		// and validation still runs (here it fails due to an invalid ISBN).
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

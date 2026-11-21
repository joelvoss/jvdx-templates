import type { Book } from "~/features/books/schema";

////////////////////////////////////////////////////////////////////////////////

type DocData = Record<string, unknown>;
type Filter = { field: string; op: string; value: unknown };
type Order = { field: string; direction: "asc" | "desc" };

const store = new Map<string, Map<string, DocData>>();
let autoIdCounter = 1;
let nextFailure: {
	operation: "read" | "write" | "delete" | "any";
	message: string;
	persistent: boolean;
} | null = null;

function ensureCollection(name: string) {
	let collection = store.get(name);
	if (!collection) {
		collection = new Map();
		store.set(name, collection);
	}
	return collection;
}

function consumeFailure(operation: "read" | "write" | "delete") {
	if (
		nextFailure &&
		(nextFailure.operation === "any" || nextFailure.operation === operation)
	) {
		const { message, persistent } = nextFailure;
		if (!persistent) nextFailure = null;
		throw new Error(message);
	}
}

class DocumentSnapshot {
	id: string;
	private _data?: DocData;

	constructor(id: string, data?: DocData) {
		this.id = id;
		this._data = data;
	}

	get exists() {
		return this._data !== undefined;
	}

	data() {
		return this._data ? structuredClone(this._data) : undefined;
	}
}

class QuerySnapshot {
	docs: DocumentSnapshot[];

	constructor(docs: DocumentSnapshot[]) {
		this.docs = docs;
	}

	get empty() {
		return this.docs.length === 0;
	}
}

class Query {
	protected _collection: string;
	protected _filters: Filter[];
	protected _orders: Order[];
	protected _limit: number;

	constructor(
		collection: string,
		filters: Filter[] = [],
		orders: Order[] = [],
		limit = Number.POSITIVE_INFINITY,
	) {
		this._collection = collection;
		this._filters = filters;
		this._orders = orders;
		this._limit = limit;
	}

	where(field: string, op: string, value: unknown) {
		return new Query(
			this._collection,
			[...this._filters, { field, op, value }],
			this._orders,
			this._limit,
		);
	}

	orderBy(field: string, direction: "asc" | "desc" = "asc") {
		return new Query(
			this._collection,
			this._filters,
			[...this._orders, { field, direction }],
			this._limit,
		);
	}

	limit(count: number) {
		return new Query(this._collection, this._filters, this._orders, count);
	}

	async get() {
		consumeFailure("read");
		const col = ensureCollection(this._collection);
		let docs = Array.from(col.entries()).map(
			([id, data]) => new DocumentSnapshot(id, data),
		);

		for (const filter of this._filters) {
			docs = docs.filter((doc) => {
				const data = doc.data() ?? {};
				const value = filter.field === "id" ? doc.id : data[filter.field];
				switch (filter.op) {
					case "==":
						return value === filter.value;
					case "!=":
						return value !== filter.value;
					default:
						return true;
				}
			});
		}

		if (this._orders.length > 0) {
			docs.sort((a, b) => {
				for (const order of this._orders) {
					const aVal = order.field === "id" ? a.id : a.data()?.[order.field];
					const bVal = order.field === "id" ? b.id : b.data()?.[order.field];
					if (aVal === bVal) continue;
					if (aVal === undefined) return order.direction === "asc" ? 1 : -1;
					if (bVal === undefined) return order.direction === "asc" ? -1 : 1;
					const aCmp =
						typeof aVal === "number" || typeof aVal === "string"
							? aVal
							: String(aVal);
					const bCmp =
						typeof bVal === "number" || typeof bVal === "string"
							? bVal
							: String(bVal);
					const dir = order.direction === "asc" ? 1 : -1;
					return aCmp < bCmp ? -dir : dir;
				}
				return 0;
			});
		}

		return new QuerySnapshot(docs.slice(0, this._limit));
	}
}

class DocumentReference {
	private _collection: string;
	private _id: string;

	constructor(collection: string, id: string) {
		this._collection = collection;
		this._id = id;
	}

	get id() {
		return this._id;
	}

	async get() {
		consumeFailure("read");
		const col = ensureCollection(this._collection);
		return new DocumentSnapshot(this._id, col.get(this._id));
	}

	set(data: DocData) {
		consumeFailure("write");
		ensureCollection(this._collection).set(this._id, structuredClone(data));
	}

	update(data: DocData) {
		consumeFailure("write");
		const col = ensureCollection(this._collection);
		const existing = col.get(this._id) ?? {};
		col.set(this._id, structuredClone({ ...existing, ...data }));
	}

	delete() {
		consumeFailure("delete");
		ensureCollection(this._collection).delete(this._id);
	}
}

class CollectionReference extends Query {
	doc(id?: string) {
		return new DocumentReference(
			this._collection,
			id ?? `book-${autoIdCounter++}`,
		);
	}
}

class Transaction {
	async get(ref: DocumentReference | Query) {
		return ref.get();
	}

	set(ref: DocumentReference, data: DocData) {
		ref.set(data);
	}

	update(ref: DocumentReference, data: DocData) {
		ref.update(data);
	}

	delete(ref: DocumentReference) {
		ref.delete();
	}
}

export class InMemoryFirestore {
	constructor(_options?: Record<string, unknown>) {}

	collection(name: string) {
		return new CollectionReference(name);
	}

	doc(path: string) {
		const [collection, id] = path.split("/");
		return new DocumentReference(collection, id);
	}

	async runTransaction<T>(fn: (transaction: Transaction) => Promise<T>) {
		return fn(new Transaction());
	}
}

////////////////////////////////////////////////////////////////////////////////

export const firestore = new InMemoryFirestore();

export function resetFirestore(books: Book[] = []) {
	store.clear();
	autoIdCounter = books.length + 1;
	nextFailure = null;

	const booksCol = ensureCollection("books");
	const isbnsCol = ensureCollection("book_isbns");
	for (const book of books) {
		booksCol.set(book.id, structuredClone(book) as unknown as DocData);
		isbnsCol.set(book.isbn.replace(/[-\s]/g, "").toUpperCase(), {
			bookId: book.id,
		});
	}
}

export function failNextFirestoreOperation(
	operation: "read" | "write" | "delete" | "any",
	message: string,
	persistent = false,
) {
	nextFailure = { operation, message, persistent };
}

export function snapshotBooks(): Book[] {
	const booksCol = store.get("books");
	if (!booksCol) return [];
	return Array.from(booksCol.values()).map((doc) =>
		structuredClone(doc),
	) as unknown as Book[];
}

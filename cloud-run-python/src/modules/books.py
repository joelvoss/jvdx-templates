import uuid

from pydantic import BaseModel

from src.adapter import firestore

# //////////////////////////////////////////////////////////////////////////////


class BookNotFound(Exception):
    """
    Exception raised when a book with a specified ID is not found in the
    database.

    Attributes:
        book_id (str): The ID of the book that was not found.
    """

    def __init__(self, book_id: str):
        self.book_id = book_id
        super().__init__(f"Book with ID '{book_id}' not found")


# //////////////////////////////////////////////////////////////////////////////


class Book(BaseModel):
    id: str
    title: str
    author: str


class BookList(BaseModel):
    books: list[Book]
    total: int


async def list_books() -> BookList:
    """
    List all books in the database.

    Returns:
        BookList: A list of books and the total count.
    """
    client = firestore.get_client()
    books: list[Book] = []
    async for doc in client.collection("books").stream():
        data = doc.to_dict() or {}
        books.append(
            Book(
                id=doc.id,
                title=data.get("title", ""),
                author=data.get("author", ""),
            )
        )
    return BookList(books=books, total=len(books))


# //////////////////////////////////////////////////////////////////////////////


async def get_book(book_id: str) -> Book:
    """
    Retrieve a book by its ID.

    Args:
        book_id (str): The ID of the book to retrieve.
    Returns:
        Book: The book with the specified ID.
    Raises:
        BookNotFound: If no book with the given ID exists.
    """
    client = firestore.get_client()
    doc = await client.collection("books").document(book_id).get()
    if not doc.exists:
        raise BookNotFound(book_id)
    data = doc.to_dict() or {}
    return Book(
        id=doc.id,
        title=data.get("title", ""),
        author=data.get("author", ""),
    )


# //////////////////////////////////////////////////////////////////////////////


class CreateBook(BaseModel):
    title: str | None = None
    author: str | None = None


async def create_book(payload: CreateBook) -> Book:
    """
    Create a new book record in the database.

    Args:
        payload (CreateBook): The data for the new book.
    Returns:
        Book: The created book with its assigned ID.
    """
    client = firestore.get_client()
    book_id = str(uuid.uuid4())
    book = Book(
        id=book_id,
        title=payload.title or f"Title {book_id}",
        author=payload.author or f"Author {book_id}",
    )
    await client.document("books", book.id).set(book.model_dump())
    return book


# //////////////////////////////////////////////////////////////////////////////


class UpdateBook(BaseModel):
    title: str | None = None
    author: str | None = None


async def update_book(book_id: str, payload: UpdateBook) -> Book:
    """
    Update an existing book record in the database. Every invocation fetches at
    least the current book data to ensure the returned book reflects the latest
    state, even if no updates are applied.

    Args:
        id (str): The ID of the book to update.
        payload (UpdateBook): The data to update for the book.
    Returns:
        Book: The updated book.
    """
    client = firestore.get_client()
    doc_ref = client.document("books", book_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise BookNotFound(book_id)

    current = doc.to_dict() or {}
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if updates:
        await doc_ref.update(updates)

    return Book(
        id=book_id,
        **{k: v for k, v in current.items() if k != "id" and k not in updates},
        **updates,
    )


# //////////////////////////////////////////////////////////////////////////////


async def delete_book(book_id: str) -> None:
    """
    Delete a book record from the database. If the book does not exist, this
    function will succeed without error.

    Args:
        id (str): The ID of the book to delete.
    """
    client = firestore.get_client()
    await client.document("books", book_id).delete()

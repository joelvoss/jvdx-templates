import uuid

from fastapi import HTTPException
from google.cloud import exceptions, firestore  # type: ignore
from pydantic import BaseModel

db = firestore.AsyncClient()


class Book(BaseModel):
    id: str
    title: str
    author: str


class NewBook(BaseModel):
    title: str
    author: str


class UpdateBook(BaseModel):
    title: str | None = None
    author: str | None = None


async def get_books() -> list[Book]:
    """
    Get all books from the 'books' collection.

    Returns:
        list[Book]: List of books.
    """
    books: list[Book] = []
    async for doc in db.collection("books").stream():
        books.append(Book(**{"id": doc.id, **doc.to_dict()}))
    return books


async def get_book(id: str) -> Book | None:
    """
    Get a book from the 'books' collection by it's ID.

    Args:
        id (str): Book ID.
    Returns:
        Book: Book object.
    """
    doc = await db.collection("books").document(id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Book with ID '{id}' not found")
    return Book(**{"id": doc.id, **doc.to_dict()})


async def create_book(payload: NewBook) -> bool:
    """
    Create a new book in the 'books' collection.

    Args:
        payload (NewBook): Book data.
    Returns:
        bool: True if successful.
    """
    book = {"id": str(uuid.uuid4()), **payload.model_dump()}
    await db.collection("books").document(book["id"]).set(book)
    return True


async def update_book(id: str, payload: UpdateBook) -> bool:
    """
    Update a book in the 'books' collection by it's ID.

    Args:
        payload (_UpdateBook): Book data.
    Returns:
        bool: True if successful.
    """
    try:
        await (
            db.collection("books")
            .document(id)
            .update(payload.model_dump(exclude_unset=True))
        )
        return True
    except exceptions.NotFound:
        raise HTTPException(
            status_code=404,
            detail=f"Error updating book. Reason: Book with ID '{id}' not found",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating book. Reason: {str(e)}",
        )


async def delete_book(id: str) -> bool:
    """
    Delete a book from the 'books' collection by it's ID.
    If the document did not exist when the delete was sent (i.e. nothing was
    deleted), this method will still succeed.

    Args:
        id (str): Book ID.
    Returns:
        bool: True if successful.
    """
    await db.collection("books").document(id).delete()
    return True

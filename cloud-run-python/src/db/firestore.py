import uuid
from typing import Self

from fastapi import HTTPException
from google.cloud import exceptions, firestore
from pydantic import BaseModel, model_validator

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

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> Self:
        if self.title is None and self.author is None:
            raise ValueError("At least one field must be provided for update")
        return self


async def get_books() -> list[Book]:
    """
    Get all books from the 'books' collection.

    Returns:
        list[Book]: List of books.
    """
    books: list[Book] = []
    async for doc in db.collection("books").stream():
        data = doc.to_dict() or {}
        books.append(Book(**{**data, "id": doc.id}))
    return books


async def get_book(id: str) -> Book:
    """
    Get a book from the 'books' collection by its ID.

    Args:
        id (str): Book ID.
    Returns:
        Book: Book object.
    """
    doc = await db.collection("books").document(id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Book with ID '{id}' not found")
    data = doc.to_dict() or {}
    return Book(**{**data, "id": doc.id})


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
    Update a book in the 'books' collection by its ID.

    Args:
        id (str): Book ID.
        payload (UpdateBook): Book data.
    Returns:
        bool: True if successful.
    """
    data = payload.model_dump(exclude_unset=True)
    try:
        await db.collection("books").document(id).update(data)
        return True
    except exceptions.NotFound:
        raise HTTPException(
            status_code=404,
            detail=f"Book with ID '{id}' not found",
        )


async def delete_book(id: str) -> bool:
    """
    Delete a book from the 'books' collection by its ID.
    If the document did not exist when the delete was sent (i.e. nothing was
    deleted), this method will still succeed.

    Args:
        id (str): Book ID.
    Returns:
        bool: True if successful.
    """
    await db.collection("books").document(id).delete()
    return True

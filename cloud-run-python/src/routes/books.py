from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from src.db import firestore

router = APIRouter(prefix="/books", tags=["books"])


class Books(BaseModel):
    books: list[firestore.Book]
    total: int


class ResponseOK(BaseModel):
    message: str


@router.get("", response_model=Books)
async def get_books() -> Any:
    """
    GET /v1/books
    """
    books = await firestore.get_books()
    total = len(books)
    return Books(books=books, total=total)


@router.post("", response_model=ResponseOK)
async def create_book(payload: firestore.NewBook) -> Any:
    """
    POST /v1/books
    """
    await firestore.create_book(payload)
    return ResponseOK(message="ok")


@router.get("/{id}", response_model=firestore.Book)
async def get_book(id: str) -> Any:
    """
    GET /v1/books/{id}
    """
    book = await firestore.get_book(id)
    return book


@router.post("/{id}", response_model=ResponseOK)
async def update_book(id: str, payload: firestore.UpdateBook) -> Any:
    """
    POST /v1/books/{id}
    """
    await firestore.update_book(id, payload)
    return ResponseOK(message="ok")


@router.delete("/{id}", response_model=ResponseOK)
async def delete_book(id: str) -> Any:
    """
    DELETE /v1/books/{id}
    """
    await firestore.delete_book(id)
    return ResponseOK(message="ok")

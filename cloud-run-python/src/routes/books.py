from fastapi import APIRouter, HTTPException

from src.modules import books

router = APIRouter(prefix="/books", tags=["books"])


@router.get("")
async def get_books() -> books.BookList:
    return await books.list_books()


@router.post("")
async def create_book(payload: books.CreateBook) -> books.Book:
    return await books.create_book(payload)


@router.get("/{book_id}")
async def get_book(book_id: str) -> books.Book:
    try:
        return await books.get_book(book_id)
    except books.BookNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{book_id}")
async def update_book(book_id: str, payload: books.UpdateBook) -> books.Book:
    try:
        return await books.update_book(book_id, payload)
    except books.BookNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{book_id}")
async def delete_book(book_id: str) -> None:
    await books.delete_book(book_id)

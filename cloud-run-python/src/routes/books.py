from typing import cast

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    Path,
    Query,
    Request,
    status,
)

from src.adapter.firestore import FirestoreClient
from src.modules import books

router = APIRouter(prefix="/books", tags=["books"])


def get_client(request: Request) -> FirestoreClient:
    return cast(FirestoreClient, request.app.state.firestore_client)


@router.get("")
async def get_books(
    client: FirestoreClient = Depends(get_client),
    limit: int = Query(default=50, ge=1, le=100),
    page_token: str | None = None,
) -> books.BookList:
    return await books.list_books(client, limit, page_token)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_book(
    client: FirestoreClient = Depends(get_client),
    payload: books.CreateBook = Body(...),
) -> books.Book:
    return await books.create_book(client, payload)


@router.get("/{book_id}")
async def get_book(
    client: FirestoreClient = Depends(get_client),
    book_id: str = Path(...),
) -> books.Book:
    try:
        return await books.get_book(client, book_id)
    except books.BookNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{book_id}")
async def update_book(
    client: FirestoreClient = Depends(get_client),
    book_id: str = Path(...),
    payload: books.UpdateBook = Body(...),
) -> books.Book:
    try:
        return await books.update_book(client, book_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except books.BookNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    client: FirestoreClient = Depends(get_client),
    book_id: str = Path(...),
) -> None:
    await books.delete_book(client, book_id)

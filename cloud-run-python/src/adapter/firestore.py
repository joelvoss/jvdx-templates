import inspect
from typing import Any, cast

from google.cloud import exceptions as firestore_exceptions
from google.cloud import firestore

# //////////////////////////////////////////////////////////////////////////////

# Re-export exceptions for use in modules
exceptions = firestore_exceptions
FirestoreClient = firestore.AsyncClient


def init_client() -> FirestoreClient:
    """
    Initialize the shared Firestore client for the app lifecycle.

    Returns:
        firestore.AsyncClient: The initialized Firestore client.
    """
    return firestore.AsyncClient()


async def close_client(client: FirestoreClient) -> None:
    """
    Close the shared Firestore client during app shutdown.
    """
    result = cast(Any, client).close()
    if inspect.isawaitable(result):
        await result


async def check_connection(client: FirestoreClient) -> None:
    """Perform a bounded Firestore read for readiness checks."""
    await client.collection("books").limit(1).get()

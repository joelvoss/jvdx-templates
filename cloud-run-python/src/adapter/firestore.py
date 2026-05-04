from typing import Any, cast

from google.cloud import exceptions as firestore_exceptions
from google.cloud import firestore

# //////////////////////////////////////////////////////////////////////////////

# Re-export exceptions for use in modules
exceptions = firestore_exceptions

# Shared Firestore client instance
client: firestore.AsyncClient | None = None


def init_client() -> firestore.AsyncClient:
    """
    Initialize the shared Firestore client for the app lifecycle.

    Returns:
        firestore.AsyncClient: The initialized Firestore client.
    """
    global client
    if client is None:
        client = firestore.AsyncClient()
    return client


def get_client() -> firestore.AsyncClient:
    """
    Return the initialized Firestore client.

    Returns:
        firestore.AsyncClient: The Firestore client instance.
    Raises:
        RuntimeError: If the client has not been initialized.
    """
    if client is None:
        raise RuntimeError("Firestore client is not initialized")
    return client


def close_client() -> None:
    """
    Close the shared Firestore client during app shutdown.
    """
    global client
    if client is not None:
        cast(Any, client).close()
        client = None

from fastapi import FastAPI, Response
from fastapi.middleware import Middleware
from fastapi.responses import PlainTextResponse
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from src.utils.secure_headers import SecureHeadersMiddleware


def test_secure_headers_middleware():
    # Setup
    def homepage(_: Response) -> PlainTextResponse:
        return PlainTextResponse(
            "OK",
            headers={
                "X-Powered-By": "Test",
            },
        )

    app = FastAPI(
        debug=False,
        routes=[APIRoute("/", homepage)],
        middleware=[
            Middleware(SecureHeadersMiddleware),
        ],
    )
    client = TestClient(app)

    response = client.get("/")

    # Assertions
    assert response.text == "OK"
    assert response.headers["Cross-Origin-Resource-Policy"] == "same-origin"
    assert response.headers["Cross-Origin-Opener-Policy"] == "same-origin"
    assert response.headers["Origin-Agent-Cluster"] == "?1"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert (
        response.headers["Strict-Transport-Security"]
        == "max-age=15552000; includeSubDomains"
    )
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-DNS-Prefetch-Control"] == "off"
    assert response.headers["X-Download-Options"] == "noopen"
    assert response.headers["X-Frame-Options"] == "SAMEORIGIN"
    assert response.headers["X-Permitted-Cross-Domain-Policies"] == "none"
    assert "X-Powered-By" not in response.headers

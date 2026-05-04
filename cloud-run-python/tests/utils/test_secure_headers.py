import pytest
from httpx import ASGITransport, AsyncClient
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import PlainTextResponse
from starlette.routing import Route

from src.utils.secure_headers import SecureHeadersMiddleware

# //////////////////////////////////////////////////////////////////////////////
# Test app


def make_test_app() -> SecureHeadersMiddleware:
    """
    Wrap a minimal Starlette app with SecureHeadersMiddleware for isolated
    tests. FastAPI uses Starlette under the hood.
    """

    async def homepage(_: Request) -> PlainTextResponse:
        return PlainTextResponse("ok")

    base = Starlette(routes=[Route("/", homepage)])
    return SecureHeadersMiddleware(base)


@pytest.fixture
async def client():
    app = make_test_app()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


# //////////////////////////////////////////////////////////////////////////////
# happy path: required headers are present


@pytest.mark.parametrize(
    "header,expected",
    [
        ("Cross-Origin-Resource-Policy", "same-origin"),
        ("Cross-Origin-Opener-Policy", "same-origin"),
        ("Origin-Agent-Cluster", "?1"),
        ("Referrer-Policy", "no-referrer"),
        ("Strict-Transport-Security", "max-age=15552000; includeSubDomains"),
        ("X-Content-Type-Options", "nosniff"),
        ("X-DNS-Prefetch-Control", "off"),
        ("X-Download-Options", "noopen"),
        ("X-Frame-Options", "SAMEORIGIN"),
        ("X-Permitted-Cross-Domain-Policies", "none"),
    ],
)
async def test_security_header_is_set(client, header, expected):
    response = await client.get("/")
    assert response.headers.get(header) == expected, (
        f"Expected {header!r}: {expected!r}, got {response.headers.get(header)!r}"
    )


# //////////////////////////////////////////////////////////////////////////////
# Security: dangerous headers are removed


async def test_x_powered_by_is_removed(client):
    response = await client.get("/")
    assert "x-powered-by" not in response.headers


# //////////////////////////////////////////////////////////////////////////////
# Security: headers protect against common attacks


async def test_x_frame_options_prevents_clickjacking(client):
    response = await client.get("/")
    assert response.headers["X-Frame-Options"] == "SAMEORIGIN"


async def test_x_content_type_options_prevents_mime_sniffing(client):
    response = await client.get("/")
    assert response.headers["X-Content-Type-Options"] == "nosniff"


async def test_referrer_policy_prevents_referrer_leakage(client):
    response = await client.get("/")
    assert response.headers["Referrer-Policy"] == "no-referrer"


async def test_hsts_header_enforces_https_for_six_months(client):
    hsts = (await client.get("/")).headers["Strict-Transport-Security"]
    # max-age of 15552000 seconds ≈ 180 days; includeSubDomains widens coverage
    assert "max-age=15552000" in hsts
    assert "includeSubDomains" in hsts


async def test_cross_origin_policies_isolate_the_origin(client):
    response = await client.get("/")
    assert response.headers["Cross-Origin-Resource-Policy"] == "same-origin"
    assert response.headers["Cross-Origin-Opener-Policy"] == "same-origin"


# //////////////////////////////////////////////////////////////////////////////
# Non-HTTP scopes pass through unmodified


async def test_non_http_scope_is_forwarded_without_header_injection():
    """
    WebSocket and lifespan scopes must not be intercepted by the middleware.
    """
    received_scopes: list[str] = []

    async def fake_app(scope, _receive, _send):
        received_scopes.append(scope["type"])

    mw = SecureHeadersMiddleware(fake_app)
    await mw({"type": "lifespan"}, object(), object())  # type: ignore[arg-type]
    assert received_scopes == ["lifespan"]

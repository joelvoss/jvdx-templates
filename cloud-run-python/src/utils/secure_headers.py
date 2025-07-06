from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send


class SecureHeadersMiddleware:
    """
    Middleware that adds security headers to HTTP responses.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def custom_send(message: Message) -> None:
            """
            Custom send function that adds security headers to HTTP responses.

            Args:
                message (Message): The message to send.
            """
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Cross-Origin_Resource_Policy
                headers.append("Cross-Origin-Resource-Policy", "same-origin")
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
                headers.append("Cross-Origin-Opener-Policy", "same-origin")
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin-Agent-Cluster
                headers.append("Origin-Agent-Cluster", "?1")
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
                headers.append("Referrer-Policy", "no-referrer")
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
                headers.append(
                    "Strict-Transport-Security", "max-age=15552000; includeSubDomains"
                )
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
                headers.append("X-Content-Type-Options", "nosniff")
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
                headers.append("X-DNS-Prefetch-Control", "off")
                # See https://www.invicti.com/white-papers/whitepaper-http-security-headers/#XDownloadOptionsHTTPHeader
                headers.append("X-Download-Options", "noopen")
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
                headers.append("X-Frame-Options", "SAMEORIGIN")
                # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Permitted-Cross-Domain-Policies
                headers.append("X-Permitted-Cross-Domain-Policies", "none")
                # NOTE: Remove the X-Powered-By header for good measure.
                del headers["X-Powered-By"]

            await send(message)

        await self.app(scope, receive, custom_send)

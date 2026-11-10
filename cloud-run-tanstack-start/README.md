# cloud-run-tanstack-start

This application is a TanStack Start server-rendered React app with:

- Express as the outer HTTP server
- Vite middleware in development
- TanStack Start request handling and server functions
- locale-aware routing
- anonymous signed sessions plus CSRF protection for mutations

# Launch Flow

This section describes what runs when you start the app and then open
`http://localhost:3000` in the browser.

## 1. Process Startup

When you run the app in development, the main process starts in
`express-server.mjs`.

Files involved:

- `express-server.mjs`
- `src/server.ts`

Execution flow:

1. `express-server.mjs` creates the Express server.
2. It installs a top-level middleware that adds security-related HTTP headers
   such as:
   - `Cross-Origin-Resource-Policy`
   - `Cross-Origin-Opener-Policy`
   - `Strict-Transport-Security` outside development
   - `X-Frame-Options`
   - `X-Content-Type-Options`
3. In development, it creates a Vite dev server in middleware mode.
4. For each request, it loads `./src/server.ts` through
   `viteDevServer.ssrLoadModule(...)`.
5. `src/server.ts` delegates request handling to TanStack Start via
   `@tanstack/react-start/server-entry`.

In production, `express-server.mjs` instead imports the built server bundle
from `./server/server.js`.

## 2. Incoming Request To `/`

When the browser opens `http://localhost:3000`, the first request reaches
`src/server.ts`.

Files involved:

- `src/server.ts`
- `src/lib/i18n/runtime.ts`
- `src/start.ts`
- `src/lib/auth.ts`

Execution flow:

1. `src/server.ts` delegates the request to TanStack Start's server-entry handler.
2. TanStack Start loads the global request middleware from `src/start.ts`.
3. `requestI18nMiddleware` runs `i18nMiddleware(request)` from `src/lib/i18n/runtime.ts`.
   It may:
   - redirect locale-prefixed URLs like `/en/...` to canonical URLs
   - persist a locale cookie when the URL locale changes
4. If there is no redirect, `requestSessionMiddleware` calls `ensureAnonymousSession()`
   from `src/lib/auth.ts` and passes the session's CSRF token in middleware context.
5. `ensureAnonymousSession()` loads or creates the signed anonymous session and
   ensures a CSRF token exists for that session.
6. `ensureAnonymousSession()` also sets the readable `__app_csrf` cookie so
   browser code can later echo it in mutation requests.
7. `requestMutationGuard` only validates requests classified by TanStack Start as
   `handlerType === 'serverFn'` with a method other than `GET`; page requests bypass it.

## 3. Router Creation And SSR Render

After middleware passes, TanStack Start creates the router and renders the
route tree.

Files involved:

- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/{-$locale}/route.tsx`
- `src/routes/{-$locale}/index.tsx`
- `src/shared/i18n/`

Execution flow:

1. `src/router.tsx` runs `getRouter()`.
2. `getRouter()` creates a shared `QueryClient`.
3. It reads the current locale and translation messages using helpers from
   `src/lib/i18n/runtime.ts`.
4. It creates the TanStack Router from `src/routeTree.gen.ts`.
5. It configures:
   - React Query SSR integration
   - React Aria router integration
   - i18n provider wrapping
   - locale-aware URL rewrite rules
6. The root route in `src/routes/__root.tsx` renders the HTML shell:
   - `<HeadContent />`
   - `<Outlet />`
   - `<I18nScript />`
   - `<Scripts />`
7. The locale layout route in `src/routes/{-$locale}/route.tsx` validates the
   locale and renders the shared navigation/footer layout.
8. The home route in `src/routes/{-$locale}/index.tsx` renders the landing page
   content.

## 4. What Happens After Hydration

Once the HTML is loaded and client scripts run:

Files involved:

- `src/router.tsx`
- `src/features/books/client.ts`
- `src/features/books/server.ts`

Behavior:

- TanStack Router hydrates the route tree.
- React Query hydrates query state.
- `GET` server functions remain publicly callable from the app.
- `POST` server functions used for mutations must satisfy the mutation guard
  in `src/start.ts`.

# Session And CSRF Design

## Session Cookie

The main session cookie is implemented in `src/lib/auth.ts` using custom HMAC-SHA256
signing and TanStack Start's `getCookie(...)` and `setCookie(...)` helpers, not `useSession(...)`.

Current properties:

- cookie name: `__app_session`
- base64url-encoded JSON payload signed with HMAC-SHA256 using `SESSION_SECRET`
- signed, not encrypted or sealed
- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- seven-day expiry in both the cookie and signed payload

Purpose:

- identifies an anonymous browser session minted by this server
- stores session state the client cannot forge or tamper with
- currently stores the authoritative CSRF token in signed session data

This is the trust anchor. The server verifies the signature, payload shape, and expiry
before accepting session state. A client cannot forge valid state without `SESSION_SECRET`,
but the signed payload is not confidential; it contains a CSRF token and expiry timestamp.

## CSRF Cookie

The readable CSRF cookie is configured in `src/lib/auth.ts` using
`setCookie(...)`.

Current properties:

- cookie name: `__app_csrf`
- readable by browser JavaScript
- `SameSite=Lax`
- `Secure` in production
- not `HttpOnly`

Purpose:

- mirrors the CSRF token already stored inside the signed session
- lets the browser application read that token and send it in the `x-app-csrf`
  header on mutation requests

The CSRF cookie is not the source of truth. The session is. The server
validates the header value against the token stored inside the signed session.

## Why Both Exist

They serve different purposes:

- `__app_session`
  - proves the browser has a session issued by this server
  - cannot be read or modified by page JavaScript
- `__app_csrf`
  - gives the browser app a token it can reflect into a custom header
  - helps distinguish deliberate same-origin app requests from requests that
    only carry cookies automatically

In short:

- session cookie = signed anonymous session state
- CSRF cookie/header = double-submit style mutation intent check bound to that
  session

# Mutation Protection Flow

Mutation protection currently lives in:

- `src/start.ts`
- `src/lib/auth.ts`

When the browser sends a `POST` server-function request:

1. The request reaches TanStack Start.
2. `requestSessionMiddleware` ensures the anonymous signed session exists.
3. `requestMutationGuard` checks TanStack Start's framework-provided `handlerType`.
   Only `handlerType === 'serverFn'` requests with `request.method !== 'GET'` are guarded.
4. The guard calls `validateMutationRequest(request, context.csrfToken)` from `src/lib/auth.ts`.
   The validator rejects the request unless all of the following are true:
   - the session contains a CSRF token
   - the `Origin` header matches the request origin
   - `Sec-Fetch-Site` is either absent or `same-origin`
   - the `x-app-csrf` header matches the token stored in the signed session
5. If validation fails, middleware returns `403`.
6. If validation succeeds, the mutation handler runs.

The `x-tsr-serverfn` header has no security role: omitting it or setting it to `false`
does not bypass the guard or invalidate a request with valid session, origin, and CSRF state.
`GET` server functions and requests handled as pages or server routes bypass this guard.

Client-side mutation code sends the CSRF header from:

- `src/features/books/client.ts`

It reads `__app_csrf` from `document.cookie` and sends it as `x-app-csrf`.

# Security Features Currently Implemented

## At The Express Layer

Implemented in `express-server.mjs`:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Strict-Transport-Security` outside development
- `Cross-Origin-Resource-Policy: same-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- removal of `X-Powered-By`

## At The Routing / Request Layer

Implemented in `src/start.ts` and `src/lib/i18n/runtime.ts`:

- locale canonicalization and locale cookie management
- anonymous signed session bootstrap on requests that pass locale middleware
- mutation-only request blocking via request middleware
- same-origin checks for mutation requests

## At The Session / CSRF Layer

Implemented in `src/lib/auth.ts`:

- custom HMAC-SHA256 signed session cookie with validated payload and expiry
- CSRF token stored in signed session state
- readable CSRF mirror cookie for browser mutation requests
- timing-safe token comparison
- `SameSite=Lax` cookies
- `Secure` cookies in production

## At The Data / API Layer

Implemented across `src/features/books/client.ts`, `src/features/books/server.ts`, and
`src/features/books/schema.ts`:

- schema validation using Valibot
- read operations exposed as public `GET` server functions
- write operations restricted to guarded `POST` server functions
- client-side input normalization before mutation calls

# Current Limitations

This is best-effort browser-session protection, not strong identity.

What it blocks well:

- naive direct `curl` mutation requests
- cross-site form posts
- requests that do not have a valid signed session plus matching CSRF header

What it does not fully prevent:

- a determined client that first loads the app, keeps the issued cookies,
  reads the CSRF cookie, and then replays the same mutation requests

That limitation is fundamental for a public web app with no login.

# Development Notes

For production, set:

- `SESSION_SECRET`

It must be a strong secret with at least 32 characters.

# License

[MIT](./LICENSE)

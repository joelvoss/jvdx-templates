# cloud-run-tanstack-start

A Google Cloud Run service template built with TanStack Start and React.

## Requirements

- Node.js 26+
- POSIX shell (`sh`) and `jq` for `Taskfile.sh`
- Playwright Chromium (`npx playwright install --with-deps chromium`) for
  browser unit tests
- Docker for local container runs and image builds
- Google Cloud CLI (`gcloud`)

## Development

Validate the template (typecheck, lint, and tests):

```shell
./Taskfile.sh validate
```

Run the development server on `http://localhost:3000`:

```shell
./Taskfile.sh start dev
```

Run individual checks or test suites:

```shell
./Taskfile.sh typecheck
./Taskfile.sh lint
./Taskfile.sh format
./Taskfile.sh test
./Taskfile.sh test unit
./Taskfile.sh test integration
```

Build the production bundle into `dist/` and run it locally in Docker:

```shell
./Taskfile.sh build
./Taskfile.sh start docker
```

## Environment Variables

- `SESSION_SECRET`: HMAC-SHA256 signing key for `__app_session`. Required in
  production (`NODE_ENV=production`) with at least 32 characters; falls back to
  a development-only secret outside production.
- `PORT`: HTTP port listened on by `src/express-server.ts` (defaults to
  `3000`).
- `PROJECT`, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`: Optional Firestore
  project ID overrides, checked in that order by `src/lib/firestore.ts`.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to a service account or ADC JSON file
  (mounted automatically by `./Taskfile.sh start docker`).
- `K_SERVICE`: Set automatically by Cloud Run. Enables `trustProxy` and
  Cloud Run forwarded-header normalization in `src/express-server.ts`.

## Deployment

Before deploying, replace the `<CHANGE_ME>` placeholders in `setup_env()` inside
`Taskfile.sh` (`GOOGLE_CLOUD_PROJECT`, `SERVICE_ACCOUNT`, and `DEPLOY_FLAGS` if
needed), then build, push, and deploy:

```shell
./Taskfile.sh deploy prod
```

Before deploying, ensure the following are in place:

- `gcloud` and `jq` are installed, and the deployer account is authenticated.
- The target GCP project exists with billing and the required APIs enabled
  (`run.googleapis.com`, `artifactregistry.googleapis.com`,
  `firestore.googleapis.com`).
- The Artifact Registry Docker repository
  (`${REGION}-docker.pkg.dev/<project>/docker`) exists.
- `SESSION_SECRET` (at least 32 characters) is configured on the Cloud Run
  service.

## Request and Launch Flow

This section describes what runs when the app starts and serves a request to
`http://localhost:3000`.

### 1. Process Startup

Both development and production start from `src/express-server.ts` (run
directly via `node ./src/express-server.ts` in dev, and built into
`dist/express-server.js` for `CMD ["express-server.js"]` in Docker/production).

Files involved:

- `src/express-server.ts`
- `src/server.ts`

Execution flow:

1. `src/express-server.ts` creates the Express server and installs a top-level
   middleware that sets HTTP security headers and removes `X-Powered-By`.
2. When `K_SERVICE` is set, it enables `trustProxy`, strips client-supplied
   `x-forwarded-host` and `x-forwarded-for`, and sets `x-forwarded-proto` to
   `https`.
3. In development (`NODE_ENV=development`), it attaches Vite's middleware and
   loads `./src/server.ts` per request via `viteDevServer.ssrLoadModule(...)`.
4. In production, it serves immutable static assets from `./client` and imports
   the built server bundle from `./server/server.js`.
5. `src/server.ts` delegates request handling to TanStack Start via
   `@tanstack/react-start/server-entry`.

### 2. Incoming Request to `/`

When the browser opens `http://localhost:3000`, the request reaches
`src/server.ts` and runs through TanStack Start's global request middleware in
`src/start.ts`.

Files involved:

- `src/server.ts`
- `src/start.ts`
- `src/lib/i18n/runtime.ts`
- `src/lib/auth.ts`

Execution flow:

1. `src/server.ts` delegates the request to TanStack Start's server-entry
   handler.
2. `requestI18nMiddleware` runs `i18nMiddleware(request)` from
   `src/lib/i18n/runtime.ts`. It may:
   - return a `301` redirect for default-locale prefixed URLs (`/en`, `/en/...`)
     or localized ignored paths (such as `/de/api/...`)
   - set the `__app_locale` cookie when a non-default URL locale differs from
     the cookie
3. If there is no redirect, `requestSessionMiddleware` calls
   `ensureAnonymousSession()` from `src/lib/auth.ts` and passes the session's
   CSRF token in middleware context.
4. `ensureAnonymousSession()` loads or creates the signed anonymous session and
   sets the readable `__app_csrf` cookie so browser code can echo it in
   mutation requests.
5. `requestMutationGuard` checks only requests where
   `handlerType === "serverFn"` and `request.method !== "GET"`; page/router
   requests and `GET` server functions bypass it.

### 3. Router Creation and SSR Render

After middleware passes, TanStack Start creates the router and renders the
route tree.

Files involved:

- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/{-$locale}/route.tsx`
- `src/routes/{-$locale}/index.tsx`
- `src/shared/i18n/`

Execution flow:

1. `src/router.tsx` runs `getRouter()`, creating a `QueryClient` for that router
   instance.
2. It reads the current locale and translation messages via helpers from
   `src/lib/i18n/runtime.ts`.
3. It creates the TanStack Router from `src/routeTree.gen.ts` with:
   - locale-aware URL rewrite rules (`deLocalizeUrl` / `localizeUrl`)
   - `I18nProvider` wrapping
   - React Aria router integration
   - React Query SSR integration
4. The root route in `src/routes/__root.tsx` renders the HTML shell.
5. The locale layout route in `src/routes/{-$locale}/route.tsx` validates the
   locale parameter and renders the shared navigation and footer layout.
6. The home route in `src/routes/{-$locale}/index.tsx` renders the landing page.

### 4. Client Hydration and Mutations

Once the HTML loads and client scripts run:

Files involved:

- `src/router.tsx`
- `src/features/books/client.ts`
- `src/features/books/server.ts`

Behavior:

- TanStack Router hydrates the route tree and React Query hydrates query state.
- `GET` server functions remain publicly callable from the app.
- `POST` server functions used for mutations must satisfy `requestMutationGuard`
  in `src/start.ts`.

## Session and CSRF Design

### Session Cookie (`__app_session`)

The main session cookie is implemented in `src/lib/auth.ts` using custom
HMAC-SHA256 signing and TanStack Start's `getCookie(...)` / `setCookie(...)`
helpers.

Properties:

- Cookie name: `__app_session`
- Base64url-encoded JSON payload signed with HMAC-SHA256 using `SESSION_SECRET`
- Signed, not encrypted or sealed
- `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production
- 7-day expiry in both the cookie and the signed payload

Purpose:

- Identifies an anonymous browser session minted by this server
- Stores session state the client cannot forge or tamper with
- Holds the authoritative CSRF token in signed session data

This is the trust anchor. The server verifies the signature, payload shape, and
expiry before accepting session state. A client cannot forge valid state
without `SESSION_SECRET`, though the signed payload itself is not confidential
(it contains `csrfToken` and `expiresAt`).

### CSRF Cookie (`__app_csrf`)

The readable CSRF cookie is set in `src/lib/auth.ts` alongside `__app_session`.

Properties:

- Cookie name: `__app_csrf`
- `HttpOnly: false` (readable by browser JavaScript)
- `SameSite=Lax`, `Path=/`, `Secure` in production
- `maxAge` matched to the remaining lifetime of the signed session

Purpose:

- Mirrors the CSRF token stored inside the signed session
- Lets the browser app read the token and echo it in the `x-app-csrf` header on
  mutation requests

The CSRF cookie is not the source of truth; the signed session is. The server
compares the `x-app-csrf` header against the token stored in `__app_session`.

### Why Both Exist

- `__app_session` proves the browser holds a session issued by this server and
  cannot be read or modified by page JavaScript.
- `__app_csrf` gives the browser app a token it can reflect into a custom
  header, helping distinguish deliberate same-origin app requests from requests
  that only attach cookies automatically.

## License

[MIT](./LICENSE)

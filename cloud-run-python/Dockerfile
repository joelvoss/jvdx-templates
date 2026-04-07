# Keep version in sync with `.python-version`.
# check-vulnerabilities=skip
FROM python:3.13-slim-trixie AS build

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install uv.
# @see https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Compile bytecode.
# @see https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# @see https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install dependencies.
# @see https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=.python-version,target=.python-version \
    uv sync --frozen --no-install-project --no-dev

COPY ./pyproject.toml ./uv.lock ./.python-version /app/
COPY ./src /app/src

# Sync the project.
# @see https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

################################################################################

FROM gcr.io/distroless/python3-debian13

WORKDIR /app

COPY --from=build /app/.venv /app/.venv
COPY --from=build /app/src /app/src

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/.venv/lib/python3.13/site-packages:/app
ENV PYTHON_ENV=production

EXPOSE 3000

# NOTE: The distroless image has ENTRYPOINT ["/usr/bin/python3.13"], so CMD
# provides only the arguments.
CMD ["-m", "src.main"]

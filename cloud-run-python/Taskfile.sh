#!/bin/bash

set -euo pipefail

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  echo "Starting server (Env: $0)..."
  setup_env "$@"
  uv sync
  uv run -m src.main
}

format() {
  echo "Running formatter..."
  uv sync
  uv run -- ruff check src/ tests/ scripts/ --fix
  uv run -- ruff format src/ tests/ scripts/
}

lint() {
  echo "Running linter..."
  uv sync
  uv run -- mypy src/ tests/ scripts/
  uv run -- ruff check src/ tests/ scripts/
  uv run -- ruff format src/ tests/ scripts/ --check
}

test() {
  echo "Running tests..."
  uv run -- pytest ./tests "$@"
}

validate() {
  lint
  test
}

clean() {
  echo "Removing cache files..."
  rm -rf .mypy_cache .pytest_cache .ruff_cache .venv
  find . -type d -name __pycache__ -prune -exec rm -rf {} +
}

update_dependencies() {
  echo "Updating dependencies..."
  ./scripts/update_dependencies.py
}

deploy() {
  setup_env "$@"

  echo "Building Docker container..."
  docker build --platform linux/amd64 --tag "${IMAGE_TAG}" .
  gcloud --quiet auth configure-docker "${ARTIFACT_REPO}"
  docker push "${IMAGE_TAG}"

  echo "Deploying to Cloud Run..."
  gcloud --quiet run deploy "${NAME}" \
    --platform "managed" \
    --project "${PROJECT}" \
    --region "${REGION}" \
    --image "${IMAGE_TAG}" \
    --service-account "${SERVICE_ACCOUNT}" \
    --max-instances "10" \
    --concurrency "80" \
    --cpu "1" \
    --memory "512Mi" \
    --set-env-vars "PROJECT=${PROJECT}"
}

setup_env() {
  export NAME=$(grep -e '^name =' pyproject.toml | cut -d'=' -f2 | tr -d ' "')
  export VERSION=$(grep -e '^version =' pyproject.toml | cut -d'=' -f2 | tr -d ' "')

  if [[ "$1" == "prod" ]]; then
    export PYTHON_ENV="production"
    export PROJECT="<CHANGE_ME>"
    export REGION="europe-west3"
    export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
  elif [[ "$1" == "dev" ]]; then
    export PYTHON_ENV="development"
    export PROJECT="<CHANGE_ME>"
    export REGION="europe-west3"
    export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
  else
    echo "Unknown environment specified. Possible values: <prod|dev>"
    exit 1
  fi

  export ARTIFACT_REPO="${REGION}-docker.pkg.dev"
  export IMAGE_TAG="${ARTIFACT_REPO}/${PROJECT}/docker/${NAME}:${VERSION}"
}

help() {
  echo "Usage: $0 <command>"
  echo
  echo "Commands:"
  echo "  start <env>          Start the app locally. Possible values for <env>: <prod|dev>"
  echo "  format               Format code"
  echo "  lint                 Lint code"
  echo "  test                 Run tests"
  echo "  validate             Validate code"
  echo "  deploy               Deploy to Cloud Run"
  echo "  update_dependencies  Update dependency declarations and lock file"
  echo "  setup_env            Setup environment variables for deployment"
  echo "  help                 Show help"
  echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

#!/bin/bash

set -e

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  echo "Starting production server..."
  setup_env prod
  uv sync
  uv run -m src.main
}

start_dev() {
  echo "Starting development server..."
  setup_env staging
  uv sync
  uv run -m src.main
}

format() {
  echo "Running formatter..."
  uv sync
  uv run -- ruff check src/ tests/ --fix
  uv run -- ruff format src/ tests/
}

lint() {
  echo "Running linter..."
  uv sync
  uv run -- mypy src/
  uv run -- ruff check src/
  uv run -- ruff format src/ --check
}

test() {
  echo "Running tests..."
  uv run -- pytest ./tests $*
}

validate() {
  lint
  test
}

clean() {
  echo "Removing cache files..."
  rm -rf .mypy_cache .pytest_cache .ruff_cache .venv
  find . -type d -name __pycache__ -prune -exec rm -rf {} \;
}

deploy() {
  setup_env $*

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
  elif [[ "$1" == "staging" ]]; then
    export PYTHON_ENV="development"
    export PROJECT="<CHANGE_ME>"
    export REGION="europe-west3"
    export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
  else
    echo "Unknown environment specified. Possible values: <prod|staging>"
    exit 1
  fi

  export ARTIFACT_REPO="${REGION}-docker.pkg.dev"
  export IMAGE_TAG="${ARTIFACT_REPO}/${PROJECT}/docker/${NAME}:${VERSION}"
}

help() {
  echo "Usage: $0 <command>"
  echo
  echo "Commands:"
  echo "  start       Start production server"
  echo "  start_dev   Build and start development server"
  echo "  format      Format code"
  echo "  lint        Lint code"
  echo "  test        Run tests"
  echo "  validate    Validate code"
  echo "  deploy      Deploy to Cloud Run"
  echo "  setup_env   Setup environment variables for deployment"
  echo "  help        Show help"
  echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

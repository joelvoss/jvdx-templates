#!/bin/sh

set -e
PATH=./node_modules/.bin:$PATH

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  setup_env "$1"

  if [ "$1" = "prod" ] || [ "$1" = "dev" ]; then
    export NODE_ENV=production
    build
    node dist/index.js

  elif [ "$1" = "docker" ]; then
    docker build --tag "${IMAGE_TAG}" .
    docker run -it --rm \
      -v "${HOME}/.config/gcloud/application_default_credentials.json:/gcp/creds.json:ro" \
      -e GOOGLE_APPLICATION_CREDENTIALS="/gcp/creds.json" \
      -p 3000:3000 \
      "${IMAGE_TAG}"

  else
    echo "Unknown environment specified. Possible values: <prod|dev|docker>"
    exit 1
  fi
}


build() {
  echo "Building..."

  DIST_DIR=dist

  rm -rf "${DIST_DIR}"
  vite build

  echo "Generating package.json and lockfile for production..."
  jq 'pick(.name, .version, .type, .dependencies)' package.json > "${DIST_DIR}/package.json"
  (cd "${DIST_DIR}" && npm i --package-lock-only --ignore-scripts=true --omit=dev)
}

format() {
  echo "Running oxfmt..."

  oxfmt --write ./src ./tests $*
}

lint() {
  echo "Running oxlint..."
  # NOTE: Use --fix to auto-fix linting errors
  oxlint ./src ./tests $*
}

typecheck() {
  echo "Running tsc..."
  tsc --noEmit
}

test() {
  if [ "$1" = "-w" ] || [ "$1" = "--watch" ]; then
    echo "Running vitest in watch mode..."
    vitest
    return
  else
    echo "Running vitest..."
    vitest run
  fi
}

validate() {
  typecheck
  lint
  test
}

deploy() {
  setup_env "$@"

  build

  echo "Building Docker container..."
  docker build --platform linux/amd64 --tag "${IMAGE_TAG}" .
  gcloud --quiet auth configure-docker "${ARTIFACT_REPO}"
  docker push "${IMAGE_TAG}"

  echo "Deploying to Cloud Run Job..."
  gcloud --quiet run jobs deploy "${NAME}" \
    --project "${PROJECT}" \
    --region "${REGION}" \
    --image "${IMAGE_TAG}" \
    --service-account "${SERVICE_ACCOUNT}" \
    --tasks "1" \
    --parallelism "1" \
    --max-retries "3" \
    --task-timeout "10m" \
    --cpu "1" \
    --memory "512Mi"
}

execute() {
  setup_env "$@"

  echo "Executing Cloud Run Job..."
  gcloud --quiet run jobs execute "${NAME}" \
    --project "${PROJECT}" \
    --region "${REGION}" \
    --wait
}

setup_env() {
  export NAME=$(jq -r ".name" package.json)
  export VERSION=$(jq -r ".version" package.json | tr "." "-")

  if [ "$1" = "prod" ]; then
    export PROJECT="<CHANGE_ME>"
    export REGION="europe-west3"
    export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
  elif [ "$1" = "dev" ] || [ "$1" = "docker" ]; then
    export PROJECT="<CHANGE_ME>"
    export REGION="europe-west3"
    export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
  else
    echo "Unknown environment specified. Possible values: <prod|dev|docker>"
    exit 1
  fi

  export ARTIFACT_REPO="${REGION}-docker.pkg.dev"
  export IMAGE_TAG="${ARTIFACT_REPO}/${PROJECT}/docker/${NAME}:${VERSION}"
}

help() {
  echo "Usage: $0 <command>"
  echo
  echo "Commands:"
  echo "  start <env>       Build and start the Cloud Run job locally. Possible values for <env>: <prod|dev|docker>"
  echo "  build             Build the project for production"
  echo "  format            Format the code using oxfmt"
  echo "  lint              Lint the code using oxlint"
  echo "  typecheck         Type check the code using tsc"
  echo "  test [-w|--watch] Run tests using vitest. Use -w or --watch to run in watch mode"
  echo "  validate          Run typecheck, lint, and tests"
  echo "  deploy <env>      Build and deploy the Cloud Run job to Google Cloud. Possible values for <env>: <prod|dev>"
  echo "  execute <env>     Execute the Cloud Run job on Google Cloud. Possible values for <env>: <prod|dev>"
  echo "  setup_env <env>   Set up environment variables for the specified environment. Possible values for <env>: <prod|dev>"
  echo "  help              Show this help message"
  echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

"${@:-help}"

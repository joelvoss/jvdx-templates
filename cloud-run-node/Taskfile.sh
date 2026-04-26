#!/bin/sh

set -e
PATH=./node_modules/.bin:$PATH

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  setup_env "$1"

  if [ "$1" = "prod" ]; then
    export NODE_ENV=production
    node dist/index.js

  elif [ "$1" = "dev" ]; then
    export NODE_ENV=development
    nodemon --watch src \
      --ext ts \
      --exec "./Taskfile.sh build && node dist/index.js"

  elif [ "$1" = "docker" ]; then
    build

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
  esbuild src/index.ts \
    --bundle \
    --platform=node \
    --packages=external \
    --format="esm" \
    --outdir="${DIST_DIR}"

  jq 'pick(.name, .version, .type, .dependencies)' package.json > "${DIST_DIR}/package.json"
  cp package-lock.json "${DIST_DIR}/package-lock.json"
}

format() {
  echo "Running oxfmt..."

  oxfmt --write ./src ./tests "$@"
}

lint() {
  echo "Running oxlint..."
  # NOTE: Use --fix to auto-fix linting errors
  oxlint ./src ./tests "$@"
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

docker_smoketest() {
  echo "Running Docker smoke test..."

  IMAGE="cloud-run-node-smoketest"
  CONTAINER="cloud-run-node-smoketest"

  build
  docker build --tag "${IMAGE}" .
  docker run -d --rm --name "${CONTAINER}" -p 3000:3000 "${IMAGE}"

  # NOTE: Wait for the container to be ready
  echo "Waiting for the container to be ready..."
  for i in $(seq 1 10); do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  # NOTE: Run the healthcheck
  echo "Running healthcheck..."
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000)
  BODY=$(curl -sf http://localhost:3000)

  docker stop "${CONTAINER}" > /dev/null 2>&1
  docker rmi "${IMAGE}" > /dev/null 2>&1

  if [ "${STATUS}" = "200" ] && [ "${BODY}" = '{"message":"ok"}' ]; then
    echo "Smoke test passed (status=${STATUS}, body=${BODY})"
  else
    echo "Smoke test failed (status=${STATUS}, body=${BODY})"
    exit 1
  fi
}

clean() {
  rm -rf node_modules dist
}

deploy() {
  setup_env "$@"

  build

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
    --memory "512Mi"
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
  echo "  start prod        Start production server"
  echo "  start dev         Build and start development server"
  echo "  start docker      Build and run Docker image locally"
  echo "  build             Build for production"
  echo "  format            Format code"
  echo "  typecheck         Typecheck code"
  echo "  lint              Lint code"
  echo "  test              Run tests"
  echo "  validate          Validate code"
  echo "  docker_smoketest  Build and run Docker smoke test"
  echo "  clean             Clean temporary files/directories"
  echo "  deploy            Deploy to Cloud Run"
  echo "  setup_env         Setup environment variables for deployment"
  echo "  help              Show help"
  echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

"${@:-help}"

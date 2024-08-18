#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  node dist/index.js
}

start_dev() {
  export NODE_ENV=development

  nodemon --watch src \
    --ext ts \
    --exec "./Taskfile.sh build && ./Taskfile.sh start"
}

build() {
  echo "Building..."

  DIST_DIR=dist

  rm -rf ${DIST_DIR}
  esbuild src/index.ts \
    --bundle \
    --platform=node \
    --packages=external \
    --format="esm" \
    --outdir="${DIST_DIR}"

  jq 'pick(.name, .version, .type, .dependencies)' package.json > ${DIST_DIR}/package.json
  cp package-lock.json ${DIST_DIR}/package-lock.json
}

format() {
  echo "Running prettier..."

  prettier \
    --write \
    "src/**/*.{js,jsx,ts,tsx,json,css,scss,md,mdx,yml,yaml,html}" \
    "tests/**/*.{js,jsx,ts,tsx,json,css,scss,md,mdx,yml,yaml,html}"
}

typecheck() {
  echo "Running tsc..."
  tsc --noEmit
}

lint() {
  echo "Running biome..."
  biome lint ./src ./tests
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

clean() {
  rm -rf node_modules dist
}

deploy() {
  setup_env $*

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

  if [[ "$1" == "prod" ]]; then
    export PROJECT="<CHANGE_ME>"
    export REGION="europe-west3"
    export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
  elif [[ "$1" == "staging" ]]; then
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
  echo "  build       Build for production"
  echo "  format      Format code"
  echo "  typecheck   Typecheck code"
  echo "  lint        Lint code"
  echo "  test        Run tests"
  echo "  validate    Validate code"
  echo "  clean       Clean temporary files/directories"
  echo "  deploy      Deploy to Cloud Run"
  echo "  setup_env   Setup environment variables for deployment"
  echo "  help        Show help"
  echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

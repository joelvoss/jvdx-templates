#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

# Export environment variables from `.env.local`
if [ -f .env.local ]
then
  export $(cat .env.local | sed 's/#.*//g' | xargs)
fi

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start_dev() {
  next dev
}

start() {
  exec node standalone/server.js
}

build() {
  rm -rf dist standalone

  next build

  cp -r dist/standalone standalone
  cp -r public standalone
  cp -r dist/static standalone/dist

  rm -rf dist
}

format() {
  jvdx format $*
}

lint() {
  jvdx lint $*
}

typecheck() {
  jvdx typecheck $*
}

test() {
  jvdx test --config jest.config.js $*
}

validate() {
  lint $*
  typecheck $*
  test $*
}

clean() {
  jvdx clean dist standalone .swc .next node_modules tmp $* 
}

setup_env() {
  export NAME=$(jq -r ".name" package.json)
  export VERSION=$(jq -r ".version" package.json | tr "." "-")

  case $1 in
    "dev")
      export PROJECT_ID="project-id"
      export REGION="europe-west3"
      export AR_REPO="docker"
      export IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${NAME}:${VERSION}"
      export CR_SERVICE_ACCOUNT="service-account@${PROJECT_ID}.iam.gserviceaccount.com"
      export CR_MAX_INSTANCES="10"
      export CR_CONCURRENCY="80"
      export CR_CPU="1"
      export CR_MEMORY="512Mi"e
      export CR_BUILD_FLAGS="--allow-unauthenticated"
      ;;
    *)
      echo "Unknown environment: $1"
      exit 1
      ;;
  esac
}

deploy() {
  setup_env $*

  build

  # NOTE(joel): Build and push docker container into Artifact Registry
  gcloud -q --verbosity="error" auth configure-docker "${REGION}-docker.pkg.dev"
  docker build --platform linux/amd64 --tag ${IMAGE_TAG} .
  docker push ${IMAGE_TAG}

  # NOTE(joel): Deploy to Cloud Run
  gcloud -q run deploy "${NAME}" \
    --platform="managed" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --service-account="${CR_SERVICE_ACCOUNT}" \
    --image="${IMAGE_TAG}" \
    --max-instances="${CR_MAX_INSTANCES}" \
    --concurrency="${CR_CONCURRENCY}" \
    --cpu="${CR_CPU}" \
    --memory="${CR_MEMORY}" \
    ${CR_BUILD_FLAGS}
}

help() {
  echo "Available tasks:"
  echo " ↪ start_dev     Start development server"
  echo " ↪ start         Start production server (requires build)"
  echo " ↪ build         Build production assets (output to 'dist/standalone')"
  echo " ↪ format        Format code (Prettier)"
  echo " ↪ lint          Lint code (ESLint))"
  echo " ↪ typecheck     Typecheck code (TypeScript)"
  echo " ↪ test          Run tests (Jest)"
  echo " ↪ validate      Run all validation checks"
  echo " ↪ clean         Clean up temporary files and directories"
  echo " ↪ help          Show this help message"
  echo " ↪ deploy        Deploy to Cloud Run (includes build)"
  echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

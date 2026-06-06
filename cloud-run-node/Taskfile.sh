#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  setup_env "$@"

  if [ "$1" = "prod" ]; then
    export NODE_ENV=production
    node dist/index.js

  elif [ "$1" = "dev" ]; then
    export NODE_ENV=development
    nodemon --watch src \
      --ext ts \
      --exec "vite build && node dist/index.js"

  elif [ "$1" = "docker" ]; then
    docker build --tag "${IMAGE_TAG}" .
    docker run -it --rm \
      -v "${HOME}/.config/gcloud/application_default_credentials.json:/gcp/creds.json:ro" \
      -e "GOOGLE_APPLICATION_CREDENTIALS=/gcp/creds.json" \
      -e "OTEL_TRACES_EXPORTER=${OTEL_TRACES_EXPORTER:-none}" \
      -p 3000:3000 \
      "${IMAGE_TAG}"

  else
    echo "Unknown environment specified. Possible values: <prod|dev|docker>"
    exit 1
  fi
}

build() {
  echo "Building..."
  local dist_dir
  dist_dir="dist"

  rm -rf "${dist_dir}"
  vite build

  echo "Generating package.json and lockfile for production..."
  jq 'pick(.name, .version, .type, .dependencies)' package.json > "${dist_dir}/package.json"
  (cd "${dist_dir}" && npm i --package-lock-only --ignore-scripts=true --omit=dev)
}

format() {
  echo "Running oxfmt..."
  oxfmt --write ./src ./tests "$@"
}

lint() {
  echo "Running oxlint..."
  oxlint ./src ./tests "$@"
}

typecheck() {
  echo "Running tsc..."
  tsc --noEmit
}

test() {
  if [ "$1" = "-w" ] || [ "$1" = "--watch" ]; then
    echo "Running vitest (watch mode)..."
    vitest
    return
  else
    echo "Running vitest..."
    vitest run
  fi
}

validate() {
  typecheck
  lint "$@"
  test "$@"
}

validate_otel() {
  echo "Validating OpenTelemetry Collector configuration..."
  setup_env docker

  local image config
  image="us-docker.pkg.dev/cloud-ops-agents-artifacts/google-cloud-opentelemetry-collector/otelcol-google:${OTEL_COLLECTOR_VERSION}"
  config="${SCRIPT_DIR}/config/otel-collector-config.yaml"

  if [ ! -f "${config}" ]; then
    echo "Collector configuration not found: ${config}"
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon is required to validate the OpenTelemetry Collector configuration."
    exit 1
  fi

  docker run --rm \
    --volume "${config}:/etc/otelcol-google/config.yaml:ro" \
    "${image}" \
    validate --config=/etc/otelcol-google/config.yaml

  echo "Validating OpenTelemetry Collector configuration... valid"
}

publish_images() {
  setup_env "$@"

  echo "Building application image: ${IMAGE_TAG}"
  docker build \
    --platform linux/amd64 \
    --provenance=false \
    --tag "${IMAGE_TAG}" \
    --tag "${IMAGE_TAG%:*}:latest" \
    .

  echo "Building OTEL Collector image: ${OTEL_IMAGE_TAG}"
  docker build \
    --platform linux/amd64 \
    --provenance=false \
    --file Dockerfile.otel-collector \
    --build-arg "OTEL_COLLECTOR_VERSION=${OTEL_COLLECTOR_VERSION}" \
    --tag "${OTEL_IMAGE_TAG}" \
    --tag "${OTEL_IMAGE_TAG%:*}:latest" \
    .

  gcloud --quiet auth configure-docker "${ARTIFACT_REPO_HOST}"
  docker push "${IMAGE_TAG}"
  docker push "${IMAGE_TAG%:*}:latest"
  docker push "${OTEL_IMAGE_TAG}"
  docker push "${OTEL_IMAGE_TAG%:*}:latest"
}

deploy() {
  setup_env "$@"

  echo "Deploying ${IMAGE_TAG}..."

  base_args=(
    run deploy "${NAME}"
    --project "${GOOGLE_CLOUD_PROJECT}"
    --region "${REGION}"
    --platform "managed"
    --service-account "${SERVICE_ACCOUNT}"
    --min-instances "0"
    --max-instances "10"
    --concurrency "80"
    --timeout "300s"
    --cpu-throttling # Request-based billing
    --quiet
  )

  app_container_args=(
    --container "app"
    --image "${IMAGE_TAG}"
    --port "3000"
    --cpu "1"
    --memory "512Mi"
    --update-env-vars "NODE_ENV=production"
    --update-env-vars "OTEL_SERVICE_NAME=${NAME}"
    --update-env-vars "GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}"
    --depends-on collector
    --liveness-probe 'httpGet.path=/,httpGet.port=3000,periodSeconds=30,timeoutSeconds=30'
    --startup-probe 'httpGet.path=/,httpGet.port=3000,periodSeconds=30,timeoutSeconds=30'
  )

  otel_container_args=(
    --container collector
    --image "${OTEL_IMAGE_TAG}"
    '--args=--config=/etc/otelcol-google/config.yaml'
    --liveness-probe 'httpGet.path=/,httpGet.port=13133,periodSeconds=30,timeoutSeconds=30'
    --startup-probe 'httpGet.path=/,httpGet.port=13133,periodSeconds=30,timeoutSeconds=30'
  )

  gcloud \
    "${base_args[@]}" \
    "${app_container_args[@]}" \
    "${otel_container_args[@]}"
}

setup_env() {
  # shellcheck disable=SC2155
  export NAME=$(jq -r ".name" package.json)
  # shellcheck disable=SC2155
  export VERSION=$(jq -r ".version" package.json)
  export REGION="europe-west3"
  export OTEL_COLLECTOR_VERSION="0.160.0"
  export OTEL_COLLECTOR_CONFIG_VERSION="1"

  case "$1" in
    prod)
      export GOOGLE_CLOUD_PROJECT="<CHANGE-ME>"
      export SERVICE_ACCOUNT="<CHANGE-ME>@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com"
      ;;
    dev | docker)
      export GOOGLE_CLOUD_PROJECT="<CHANGE-ME>"
      export SERVICE_ACCOUNT="<CHANGE-ME>@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com"
      ;;
    *)
      echo "Unknown environment specified. Possible values: <prod|dev|docker>"
      exit 1
      ;;
  esac

  export ARTIFACT_REPO_HOST="${REGION}-docker.pkg.dev"
  export ARTIFACT_REGISTRY_REPOSITORY="docker"
  export IMAGE_TAG="${ARTIFACT_REPO_HOST}/${GOOGLE_CLOUD_PROJECT}/${ARTIFACT_REGISTRY_REPOSITORY}/${NAME}:${VERSION}"
  export OTEL_IMAGE_TAG="${ARTIFACT_REPO_HOST}/${GOOGLE_CLOUD_PROJECT}/${ARTIFACT_REGISTRY_REPOSITORY}/${NAME}-otel-collector:${OTEL_COLLECTOR_VERSION}-${OTEL_COLLECTOR_CONFIG_VERSION}"
}

usage() {
  local service_name
  service_name=$(jq -r ".name" package.json)

  cat <<EOF
Usage: $0 <command> [options]

Build and operate the ${service_name} service.

Commands:
  start <env>            Run locally: dev, prod, or docker
  build                  Build the production bundle
  format                 Format source and test files with oxfmt
  typecheck              Run the TypeScript compiler without emitting files
  lint                   Run oxlint against source and test files
  test [options]         Run tests with Vitest
  validate               Run typecheck, lint, and tests
  validate_otel          Validate the baked-in OTEL Collector configuration
  publish_images <env>   Build and push application and OTEL images
  deploy <env>           Deploy published images to Cloud Run
  usage                  Show this help message

Test options:
  -w, --watch            Run Vitest in watch mode

Examples:
  $0 start dev
  $0 build
  $0 validate
  $0 test --watch
  $0 deploy prod
EOF
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

"${@:-usage}"

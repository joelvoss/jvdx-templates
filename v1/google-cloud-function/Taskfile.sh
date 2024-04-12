#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

# Export environment variables from `.env`
if [ -f .env.local ]
then
  export $(cat .env.local | sed 's/#.*//g' | xargs)
fi

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  node dist/template-google-cloud-function.esm.js
}

dev() {
  build

  # Example: `./Taskfile.sh dev http helloHttp`
  if [[ "$1" == "http" ]]; then
    functions-framework --target=$2

  # Example: `./Taskfile.sh dev event helloPubSub`
  elif [[ "$1" == "event" ]]; then
    functions-framework --signature-type=event --target=$2

  else
    echo "Unknown type. Possible values: [\"http\", \"event\"]"
    exit 1;
  fi
}

publish() {
  # Example: `./Taskfile.sh publish http`
  if [[ "$1" == "http" ]]; then
    echo "Calling \"http://localhost:8080\""

    curl -X GET \
      -H "Content-Type: application/json" \
      http://localhost:8080

  # Example: `./Taskfile.sh publish gcs`
  elif [[ "$1" == "gcs" ]]; then
    echo "Publishing \"@tests/__fixtures__/gcs_event.json\""

    curl -d "@tests/__fixtures__/gcs_event.json" \
      -X POST \
      -H "Ce-Type: true" \
      -H "Ce-Specversion: true" \
      -H "Ce-Source: true" \
      -H "Ce-Id: true" \
      -H "Content-Type: application/json" \
      http://localhost:8080

  # Example: `./Taskfile.sh publish pubsub`
  elif [[ "$1" == "pubsub" ]]; then
    echo "Publishing \"@tests/__fixtures__/pubsub_event.json\""

    curl -d "@tests/__fixtures__/pubsub_event.json" \
      -X POST \
      -H "Ce-Type: true" \
      -H "Ce-Specversion: true" \
      -H "Ce-Source: true" \
      -H "Ce-Id: true" \
      -H "Content-Type: application/json" \
      http://localhost:8080

  else
    echo "Unknown type. Possible values: [\"gcs\", \"pubsub\"]"
    exit 1;
  fi
}

build() {
  jvdx build --clean --f esm --o dist \
    --no-sourcemap --no-generateTypes $*
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
  jvdx test --testPathPattern=/tests $*
}

validate() {
  lint $*
  typecheck $*
  test $*
}

clean() {
  jvdx clean $*
}

default() {
  start
}

deploy() {
  build

  BUILD_NAME=$(jq -r ".name" package.json)

  if [[ "$1" == "staging" ]]; then
    echo "Deploying ${BUILD_NAME} to the staging environment."

    # See https://cloud.google.com/sdk/gcloud/reference/functions/deploy
    gcloud functions deploy ${BUILD_NAME} \
      --project ${BUILD_PROJECT_STAGING} \
      --region europe-west3 \
      --entry-point helloHttp \
      --runtime nodejs16 \
      --service-account ${BUILD_SA_STAGING} \
      --ingress-settings all \
      --memory 256MB \
      --timeout 30s \
      --trigger-http

  elif [[ "$1" == "prod" ]]; then
    echo "Environment \"prod\" not implemented."
    exit 1;

  else
    echo "Unknown environment. Possible values: [\"staging\", \"prod\"]"
    exit 1;
  fi
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

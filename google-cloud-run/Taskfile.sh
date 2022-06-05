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
  exec node dist/template-google-cloud-run.esm.js
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
  build
  start
}

docker_build() {
  echo "Building docker container locally (Environment: $1)."

  BUILD_PROJECT=
  if [[ "$1" == "staging" ]]; then
    BUILD_PROJECT=${BUILD_PROJECT_STAGING}
  elif [[ "$1" == "prod" ]]; then
    echo "Abort. No prod environment configured"
    exit 1;
  else
    echo "Abort. Unknown target specified"
    exit 1;
  fi

  BUILD_NAME=$(jq -r ".name" package.json)
  BUILD_VERSION=$(jq -r ".version" package.json | tr "." "-")
  ARTIFACT_REPO=docker

  BUILD_TAG=europe-west3-docker.pkg.dev/${BUILD_PROJECT}/${ARTIFACT_REPO}/${BUILD_NAME}:${BUILD_VERSION}

  docker build --tag ${BUILD_TAG} .

  local _ret=$2
  if [[ $_ret != "" ]]; then
    _ret=${BUILD_TAG}
  fi
}

docker_run() {
  echo "Running docker container locally (Environment: $1)."

  BUILD_TAG=
  docker_build $1 ${BUILD_TAG}

  docker run -it -p 3000:3000 --rm ${BUILD_TAG}
}

docker_push() {
  echo "Pushing docker container (Environment: $1)."

  BUILD_TAG=
  docker_build $1 ${BUILD_TAG}

  gcloud --quiet auth configure-docker europe-west3-docker.pkg.dev

  docker push ${BUILD_TAG}

  local _ret=$2
  if [[ $_ret != "" ]]; then
    _ret=${BUILD_TAG}
  fi
}

deploy() {
  echo "Deployent container (Environment: $1)."

  BUILD_NAME=$(jq -r ".name" package.json)
  BUILD_VERSION=$(jq -r ".version" package.json | tr "." "-")

  if [[ "$1" == "staging" ]]; then
    BUILD_TAG=
    docker_push $1 ${BUILD_TAG}

    gcloud --quiet run deploy ${BUILD_NAME} \
      --platform managed \
      --project ${BUILD_PROJECT_STAGING} \
      --region europe-west3 \
      --image ${BUILD_TAG} \
      --revision-suffix ${BUILD_VERSION} \
      --service-account ${BUILD_SA_STAGING} \
      --max-instances 10 \
      --concurrency 80 \
      --cpu 1 \
      --memory 512Mi \
      --set-env-vars GOOGLE_PROJECT=${GOOGLE_PROJECT_STAGING}

  elif [[ "$1" == "prod" ]]; then
    echo "Abort. No prod release configured"
    exit 1;
  else
    echo "Abort. Unknown target specified"
    exit 1;
  fi
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

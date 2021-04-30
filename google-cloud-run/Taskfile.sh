#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

# Export environment variables from `.env`
if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  node dist/index.esm.js
}

build() {
  jvdx build --clean --format=esm,cjs --target=node --no-sourcemap $*
}

format() {
  jvdx format $*
}

lint() {
  jvdx lint $*
}

test() {
  jvdx test --testPathPattern=/tests $*
}

validate() {
  format $*
  lint $*
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
  if [[ -z "${BUILD_PROJECT}" ]]; then
    echo "Missing environment varible BUILD_PROJECT"
    exit 1;
  fi

  build

  BUILD_NAME=$(jq -r ".name" package.json)
  BUILD_VERSION=$(jq -r ".version" package.json | tr "." "-")

  BUILD_TAG=eu.gcr.io/${BUILD_PROJECT}/${BUILD_NAME}:${BUILD_VERSION}

  docker build --tag ${BUILD_TAG}

  local _ret=$1
  if [[ $_ret != "" ]]; then
    _ret=${BUILD_TAG}
  fi
}

docker_push() {
  if [[ -z "${BUILD_PROJECT}" ]]; then
    echo "Missing environment varible BUILD_PROJECT"
    exit 1;
  fi

  BUILD_TAG=
  docker_build ${BUILD_TAG}

  gcloud config set project ${BUILD_PROJECT} --quiet
  gcloud auth configure-docker eu.gcr.io --quiet

  docker push ${BUILD_TAG}

  local _ret=$1
  if [[ $_ret != "" ]]; then
    _ret=${BUILD_TAG}
  fi
}

docker_run() {
  BUILD_TAG=
  docker_build ${BUILD_TAG}

  docker run -it --rm ${BUILD_TAG}
}

deploy() {
  build

  BUILD_TAG=
  docker_push ${BUILD_TAG}

  # gcloud run deploy ${NAME} \
  #   --image ${IMAGE_TAG} \
  #   --platform managed \
  #   --region europe-west1 \
  #   --max-instances 1 \
  #   --allow-unauthenticated
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

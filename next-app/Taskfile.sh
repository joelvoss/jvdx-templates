#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

# Export environment variables from `.env.ocal`
if [ -f .env.local ]
then
  export $(cat .env.local | sed 's/#.*//g' | xargs)
fi

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
  next start
}

build() {
  rm -rf dist
  next build
}

format() {
  jvdx format $*
}

lint() {
  jvdx lint $*
}

test() {
  jvdx test --config jest.config.js \
  --testPathPattern=/tests \
  --passWithNoTests $*
}

validate() {
  lint $*
  test $*
}

clean() {
  jvdx clean dist .next node_modules $* 
}


default() {
  next dev
}

docker_build() {
  echo "Building docker container locally"

  BUILD_NAME=$(jq -r ".name" package.json)
  BUILD_VERSION=$(jq -r ".version" package.json | tr "." "-")
  ARTIFACT_REPO=docker

  BUILD_TAG=europe-west3-docker.pkg.dev/${BUILD_PROJECT}/${ARTIFACT_REPO}/${BUILD_NAME}:${BUILD_VERSION}

  docker build --tag ${BUILD_TAG} .

  local _ret=$1
  if [[ $_ret != "" ]]; then
    _ret=${BUILD_TAG}
  fi
}

docker_run() {
  echo "Running docker container locally"

  BUILD_TAG=
  docker_build ${BUILD_TAG}

  docker run -it -p 3000:3000 --rm ${BUILD_TAG}
}

docker_push() {
  echo "Pushing docker container"

  BUILD_TAG=
  docker_build ${BUILD_TAG}

  gcloud --quiet auth configure-docker europe-west3-docker.pkg.dev

  docker push ${BUILD_TAG}

  local _ret=$1
  if [[ $_ret != "" ]]; then
    _ret=${BUILD_TAG}
  fi
}

deploy() {
  BUILD_NAME=$(jq -r ".name" package.json)
  BUILD_VERSION=$(jq -r ".version" package.json | tr "." "-")

  BUILD_TAG=
  docker_push ${BUILD_TAG}

  gcloud --quiet run deploy ${BUILD_NAME} \
    --platform managed \
    --project ${BUILD_PROJECT} \
    --region europe-west3 \
    --image ${BUILD_TAG} \
    --revision-suffix ${BUILD_VERSION} \
    --service-account ${BUILD_SA} \
    --allow-unauthenticated \
    --max-instances 10 \
    --concurrency 80 \
    --cpu 1 \
    --memory 512Mi
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

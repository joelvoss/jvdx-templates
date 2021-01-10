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
  node dist/index.js
}

start-ff-http() {
  functions-framework \
    --source=dist \
    --target=handleHTTPTrigger
}

start-ff-event() {
  functions-framework \
    --source=dist \
    --target=handleStorageTrigger \
    --signature-type=event
}

build() {
  jvdx build --clean --format=cjs --target=node --no-sourcemap $*
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
  start
}

deploy() {
  build

  PROJECT=
  NAME=
  VERSION=
  IMAGE_TAG=eu.gcr.io/${PROJECT}/${NAME}:${VERSION}
  
  gcloud auth configure-docker --quiet
  docker build --tag ${IMAGE_TAG} .

  # docker push ${IMAGE_TAG}

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

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

  gcloud functions deploy handleHTTPTrigger \
    --region=europe-west1 \
    --project=jvoss-base-prod \
    --trigger-http \
    --runtime=nodejs12 \
    --entry-point=handleHTTPTrigger \
    --memory=128MB \
    --max-instances=40
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

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
  next start -p ${PORT}
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
  jvdx test --testPathPattern=/tests --passWithNoTests $*
}

validate() {
  lint $*
  test $*
}

clean() {
  jvdx clean dist .next node_modules $* 
}

default() {
  next dev -p ${PORT}
}

docker_build() {
  BUILD_NAME=$(jq -r ".name" package.json)
  BUILD_VERSION=$(jq -r ".version" package.json | tr "." "-")

  BUILD_TAG=${BUILD_NAME}:${BUILD_VERSION}

  docker build --tag ${BUILD_TAG} .

  local _ret=$1
  if [[ $_ret != "" ]]; then
    _ret=${BUILD_TAG}
  fi
}

docker_run() {
  BUILD_TAG=
  docker_build ${BUILD_TAG}

  docker run -it -p ${PORT}:${PORT} --rm ${BUILD_TAG}
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

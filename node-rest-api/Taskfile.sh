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
  node dist/node-rest-api.js
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
  build
  start
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

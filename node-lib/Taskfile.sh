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
  node dist/template-node-lib.module.js
}

build() {
  jvdx build --clean -f cjs,esm --no-sourcemap $*
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

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

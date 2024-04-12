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

build() {
  jvdx build --clean -f modern,cjs,esm --no-sourcemap
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
  jvdx test \
    --testPathPattern=/tests \
    --passWithNoTests \
    --env=jsdom \
    --setupFilesAfterEnv=./tests/setup-tests.ts $*
}

validate() {
  lint $*
  typecheck $*
  test $*
}

clean() {
  jvdx clean $*
}

run_examples() {
  EXAMPLES_CACHE=.examples

  parcel "examples/**/*.html" \
    --no-source-maps \
    --dist-dir ${EXAMPLES_CACHE}/.dist \
    --cache-dir ${EXAMPLES_CACHE}/.cache

  rm -rf ${EXAMPLES_CACHE}
}

default() {
  build
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

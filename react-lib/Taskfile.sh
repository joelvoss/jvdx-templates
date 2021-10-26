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

build() {
  jvdx build --clean -f cjs,es $*
}

watch() {
  jvdx build -f cjs,es --watch $*
}

dev() {
  build
  rm -rf examples/dist
  parcel examples/**/*.html --dist-dir examples/dist
  rm -rf .parcel-cache
}

format() {
  jvdx format $*
}

lint() {
  jvdx lint $*
}

test() {
  jvdx test --testPathPattern=/tests --passWithNoTests --env=jsdom $*
}

validate() {
  format $*
  lint $*
  test $*
}

clean() {
  jvdx clean node_modules dist example/dist $*
}

default() {
  build
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

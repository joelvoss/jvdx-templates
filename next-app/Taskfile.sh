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
  jvdx test --testPathPattern=/tests --passWithNoTests $*
}

validate() {
  format $*
  lint $*
  test $*
}

clean() {
  jvdx clean dist .next node_modules $* 
}

default() {
  next dev
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-default}

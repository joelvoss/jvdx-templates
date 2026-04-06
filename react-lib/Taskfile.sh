#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

# //////////////////////////////////////////////////////////////////////////////
# START tasks

dev() {
  vite --port 3000
}

build() {
  echo "Building..."
  rm -rf dist
  vite build
}

format() {
  echo "Running oxfmt..."

  oxfmt --write ./src ./tests ./examples $*
}

lint() {
  echo "Running oxlint..."
  # NOTE: Use --fix to auto-fix linting errors
	oxlint ./src ./tests ./examples $*
}

typecheck() {
  echo "Running tsc..."
  tsc --noEmit
}

test() {
  echo "Running vitest..."
  vitest run
}

validate() {
  typecheck
  lint
  test
}

clean() {
  rm -rf node_modules dist
}

help() {
  echo "Usage: $0 <command>"
  echo
  echo "Commands:"
  echo "  dev         Start development server"
  echo "  build       Build for production"
  echo "  format      Format code"
  echo "  typecheck   Typecheck code"
  echo "  lint        Lint code"
  echo "  test        Run tests"
  echo "  validate    Validate code"
  echo "  clean       Clean temporary files/directories"
  echo "  help        Show help"
  echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start() {
	if [ ! -d "node_modules" ]; then
		echo "Installing dependencies..."
		npm install
	fi

	if [ "$1" = "dev" ]; then
		echo "Starting development server..."
		export NODE_ENV=development
		node ./express-server.mjs
	
	elif [ "$1" = "docker" ]; then
		echo "Starting production server (inside docker)..."
		setup_env staging
		build
		LOCAL_TAG=$(jq -r ".name" package.json)
		docker build --tag "${LOCAL_TAG}" .
    docker run -it --rm \
      -v "${HOME}/.config/gcloud/application_default_credentials.json:/gcp/creds.json:ro" \
      -e GOOGLE_APPLICATION_CREDENTIALS="/gcp/creds.json" \
      -e PROJECT="${PROJECT}" \
      -p 3000:3000 \
      "${LOCAL_TAG}"

	else
		echo "Unknown environement specified."
		echo "Possible values: <dev|docker>"
		exit 1
	fi
}

build() {
	echo "Building for production..."
	DIST_DIR=dist
	
	rm -rf "${DIST_DIR}"
	
	vite build
	
	cp express-server.mjs "${DIST_DIR}/"
	jq '{name, version, type, dependencies}' package.json > "${DIST_DIR}/package.json"
  cp package-lock.json "${DIST_DIR}/package-lock.json"
}

format() {
	oxfmt
}

lint() {
	oxlint --type-aware src
}

test() {
	if [ "$1" = "-w" ] || [ "$1" = "--watch" ]; then
		echo "Running vitest in watch mode..."
		vitest
		return
	else
		echo "Running vitest..."
		vitest run
	fi
}

validate() {
	lint
	test
}

clean() {
	rm -rf build node_modules
}

deploy() {
	setup_env $*

	build

	echo "Building Docker container..."
	docker build --platform linux/amd64 --tag "${IMAGE_TAG}" .
	gcloud --quiet auth configure-docker "${ARTIFACT_REPO}"
	docker push "${IMAGE_TAG}"

	echo "Deploying to Cloud Run..."
	gcloud --quiet run deploy "${NAME}" \
		--platform "managed" \
		--project "${PROJECT}" \
		--region "${REGION}" \
		--image "${IMAGE_TAG}" \
		--service-account "${SERVICE_ACCOUNT}" \
		--max-instances "10" \
		--concurrency "80" \
		--cpu "1" \
		--memory "512Mi" \
		--set-env-vars "PROJECT=${PROJECT}" \
		${DEPLOY_FLAGS}
}

setup_env() {
	export NAME=$(jq -r ".name" package.json)
	export VERSION=$(jq -r ".version" package.json | tr "." "-")

	if [[ "$1" == "prod" ]]; then
		export PROJECT="<CHANGE_ME>"
		export REGION="europe-west3"
		export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
		export DEPLOY_FLAGS="--allow-unauthenticated"
	elif [[ "$1" == "staging" ]]; then
		export PROJECT="<CHANGE_ME>"
		export REGION="europe-west3"
		export SERVICE_ACCOUNT="<CHANGE_ME>@${PROJECT}.iam.gserviceaccount.com"
		export DEPLOY_FLAGS="--allow-unauthenticated"
	else
		echo "Unknown environment specified. Possible values: <prod|staging>"
		exit 1
	fi

	export ARTIFACT_REPO="${REGION}-docker.pkg.dev"
	export IMAGE_TAG="${ARTIFACT_REPO}/${PROJECT}/docker/${NAME}:${VERSION}"
}

help() {
	echo "Usage: $0 <command>"
	echo
	echo "Commands:"
	echo "  start       Start production server"
	echo "  build       Build for production"
	echo "  format      Format code"
	echo "  lint        Lint code"
	echo "  test        Run tests"
	echo "  validate    Validate code"
	echo "  clean       Clean temporary files/directories"
	echo "  deploy      Deploy to Cloud Run"
	echo "  setup_env   Setup environment variables for deployment"
	echo "  help        Show help"
	echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

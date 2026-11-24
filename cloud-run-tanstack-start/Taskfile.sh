#!/bin/sh

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
		setup_env dev
		export NODE_ENV="development"
		node ./src/express-server.ts

	elif [ "$1" = "docker" ]; then
		echo "Starting production server (inside docker)..."
		setup_env dev
		build
		LOCAL_TAG=$(jq -r ".name" package.json)
		LOCAL_SESSION_SECRET="${SESSION_SECRET:-dev-only-session-secret-change-me-1234567890}"
		docker build --tag "${LOCAL_TAG}" .
		docker run -it --rm \
			-v "${HOME}/.config/gcloud/application_default_credentials.json:/gcp/creds.json:ro" \
			-e GOOGLE_APPLICATION_CREDENTIALS="/gcp/creds.json" \
			-e GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT}" \
			-e SESSION_SECRET="${LOCAL_SESSION_SECRET}" \
			-p 3000:3000 \
			"${LOCAL_TAG}"

	else
		echo "Unknown environment specified."
		echo "Possible values: <dev|docker>"
		exit 1
	fi
}

build() {
	echo "Building for production..."

	rm -rf dist

	vite build
}

format() {
	echo "Running oxfmt..."
	oxfmt --write ./src ./tests "$@"
}

lint() {
	echo "Running oxlint..."
	oxlint ./src ./tests "$@"
}

typecheck() {
	echo "Running tsc..."
	tsc --noEmit
}

test() {
	MODE="run"
	case "$1" in
	unit)
		shift
		if [ "$1" = "-w" ] || [ "$1" = "--watch" ]; then
			MODE="watch"
			shift
		fi
		set -- --project unit-node --project unit-browser "$@"
		;;
	integration)
		shift
		if [ "$1" = "-w" ] || [ "$1" = "--watch" ]; then
			MODE="watch"
			shift
		fi
		set -- --project integration "$@"
		;;
	-w | --watch)
		MODE="watch"
		shift
		;;
	esac

	if [ "${MODE}" = "watch" ]; then
		echo "Running vitest in watch mode..."
		vitest "$@"
	else
		echo "Running vitest..."
		vitest run "$@"
	fi
}

validate() {
	typecheck
	lint
	test
}

clean() {
	rm -rf node_modules dist
}

deploy() {
	setup_env "$@"

	build

	echo "Building Docker container..."
	docker build --platform linux/amd64 --tag "${IMAGE_TAG}" .
	gcloud --quiet auth configure-docker "${ARTIFACT_REPO}"
	docker push "${IMAGE_TAG}"

	echo "Deploying to Cloud Run..."
	gcloud --quiet run deploy "${NAME}" \
		--platform "managed" \
		--project "${GOOGLE_CLOUD_PROJECT}" \
		--region "${REGION}" \
		--image "${IMAGE_TAG}" \
		--service-account "${SERVICE_ACCOUNT}" \
		--max-instances "10" \
		--concurrency "80" \
		--cpu "1" \
		--memory "512Mi" \
		--set-env-vars "GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}" \
		${DEPLOY_FLAGS}
}

setup_env() {
	export NAME=$(jq -r ".name" package.json)
	export VERSION=$(jq -r ".version" package.json | tr "." "-")

	if [ "$1" = "prod" ]; then
		export GOOGLE_CLOUD_PROJECT="<CHANGE_ME>"
		export REGION="europe-west3"
		export SERVICE_ACCOUNT="<CHANGE_ME>@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com"
		export DEPLOY_FLAGS="--allow-unauthenticated"
	elif [ "$1" = "staging" ]; then
		export GOOGLE_CLOUD_PROJECT="<CHANGE_ME>"
		export REGION="europe-west3"
		export SERVICE_ACCOUNT="<CHANGE_ME>@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com"
		export DEPLOY_FLAGS="--allow-unauthenticated"
	elif [ "$1" = "dev" ]; then
		export GOOGLE_CLOUD_PROJECT="<CHANGE_ME>"
		export REGION="europe-west3"
		export SERVICE_ACCOUNT="<CHANGE_ME>@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com"
		export DEPLOY_FLAGS="--allow-unauthenticated"
	else
		echo "Unknown environment specified. Possible values: <prod|staging|dev>"
		exit 1
	fi

	export ARTIFACT_REPO="${REGION}-docker.pkg.dev"
	export IMAGE_TAG="${ARTIFACT_REPO}/${GOOGLE_CLOUD_PROJECT}/docker/${NAME}:${VERSION}"
}

help() {
	echo "Usage: $0 <command>"
	echo
	echo "Commands:"
	echo "  start dev          Start development server"
	echo "  start docker       Build and run production container locally"
	echo "  build              Build for production"
	echo "  format             Format code"
	echo "  lint               Lint code"
	echo "  typecheck          Run TypeScript type checking"
	echo "  test [unit|integration] [-w|--watch]"
	echo "                     Run tests"
	echo "  validate           Validate code (typecheck + lint + test)"
	echo "  clean              Clean temporary files/directories"
	echo "  deploy             Deploy to Cloud Run"
	echo "  setup_env          Setup environment variables for deployment"
	echo "  help               Show help"
	echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

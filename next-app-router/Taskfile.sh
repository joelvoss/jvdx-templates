#!/bin/bash

set -e
PATH=./node_modules/.bin:$PATH

export NEXT_TELEMETRY_DISABLED=1

# //////////////////////////////////////////////////////////////////////////////
# START tasks

start_dev() {
	next dev
}

start() {
	exec node standalone/server.js
}

format() {
	biome check \
    --formatter-enabled=true \
		--assist-enabled=true \
    --linter-enabled=false \
    --write \
    ./src ./tests $*
}

lint() {
	# NOTE: Use --fix to auto-fix linting errors
	biome lint \
		./src ./tests $*
}

typecheck() {
	tsc
}

test() {
	case $1 in
		"unit")
			if [ "$2" == "-w" ] || [ "$2" == "--watch" ]; then
				echo "Running unit tests in watch mode..."
				vitest ${@:3}
			else
				echo "Running unit tests..."
				vitest run ${@:3}
			fi
			;;
		"e2e")
			echo "Running end-to-end tests..."
			playwright test ${@:2}
			# NOTE: Clean up after e2e tests
			rm -rf test-results dist
			;;
		*)
			echo "Unkown test type: $1"
			echo "Use 'unit' or 'e2e' as argument to run specific tests."
			exit 1
			;;
	esac
}

validate() {
	lint
	typecheck
	test unit
	test e2e
}

clean() {
	rm -rf dist standalone .swc .next node_modules tmp $*
}

build() {
	rm -rf dist standalone

	next build

	cp -r dist/standalone standalone
	cp -r public standalone
	cp -r dist/static standalone/dist

	rm -rf dist
}

deploy() {
	setup_env $*

	build

	# NOTE(joel): Build and push docker container into Artifact Registry
	gcloud -q --verbosity="error" auth configure-docker "${REGION}-docker.pkg.dev"
	docker build --platform linux/amd64 --tag ${IMAGE_TAG} .
	docker push ${IMAGE_TAG}

	# NOTE(joel): Deploy to Cloud Run
	gcloud -q run deploy "${NAME}" \
		--platform="managed" \
		--project="${PROJECT_ID}" \
		--region="${REGION}" \
		--service-account="${CR_SERVICE_ACCOUNT}" \
		--image="${IMAGE_TAG}" \
		--max-instances="${CR_MAX_INSTANCES}" \
		--concurrency="${CR_CONCURRENCY}" \
		--cpu="${CR_CPU}" \
		--memory="${CR_MEMORY}" \
		${CR_BUILD_FLAGS}
}

setup_env() {
	export NAME=$(jq -r ".name" package.json)
	export VERSION=$(jq -r ".version" package.json | tr "." "-")

	case $1 in
		"dev")
			export PROJECT_ID="project-id"
			export REGION="europe-west3"
			export AR_REPO="docker"
			export IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${NAME}:${VERSION}"
			export CR_SERVICE_ACCOUNT="service-account@${PROJECT_ID}.iam.gserviceaccount.com"
			export CR_MAX_INSTANCES="10"
			export CR_CONCURRENCY="80"
			export CR_CPU="1"
			export CR_MEMORY="512Mi"
			export CR_BUILD_FLAGS="--allow-unauthenticated"
			;;
		*)
			echo "Unknown environment: $1"
			exit 1
			;;
	esac
}

help() {
	echo "Available tasks:"
	echo " ↪ start_dev     Start development server"
	echo " ↪ start         Start production server (requires build)"
	echo " ↪ format        Format code (Biome)"
	echo " ↪ lint          Lint code (Biome))"
	echo " ↪ typecheck     Typecheck code (TypeScript)"
	echo " ↪ test          Run tests (Vitest)"
	echo " ↪ validate      Run all validation checks"
	echo " ↪ clean         Clean up temporary files and directories"
	echo " ↪ build         Build production assets (output to 'dist/standalone')"
	echo " ↪ deploy        Deploy to Cloud Run (includes build)"
	echo " ↪ setup_env     Set up environment variables for deployment"
	echo " ↪ help          Show this help message"
	echo
}

# END tasks
# //////////////////////////////////////////////////////////////////////////////

${@:-help}

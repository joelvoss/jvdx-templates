# template-node-lib

Short description of this library.

## Requirements

  - [Node v20+][install-node]
  - [gcloud SDK][install-gcloud]
  - [Docker][install-docker]
  - [jq][install-jq]

## Prerequisites

(1) Create a `.env.local` file at the root of this repository with at least
    the following environment variables:

```text
# Target project name
# ------------------------------------------------------------------------------
BUILD_PROJECT=

# Service account mail the Cloud Run container is being executed with
# ------------------------------------------------------------------------------
BUILD_SA=

# Optionally, an absolute path to the staging service account key to run
# the application locally and authenticate via the provede service account.
# ------------------------------------------------------------------------------
GOOGLE_APPLICATION_CREDENTIALS=
```

(2) If you want to deploy this container via Github Actions, the Github
    repository **must** at least have the following secrets configured:

- `BUILD_PROJECT`
    - Target project name
- `BUILD_SA`
    - Service account mail the Cloud Run container is being executed with
- `GCP_DEPLOY_KEY`
    - Service account with permissions to deploy the Cloud Run container in
      your environment

> Consult the [official Github documentation][github-secrets] to configure
> repository secrets.

## Development

(1) Install dependencies

```bash
$ npm i
```

(2) Run initial validation

```bash
$ ./Taskfile.sh validate
```

(3) Run your function locally

```bash
$ ./Taskfile.sh
```

(4) Test your function

```bash
$ ./Taskfile.sh test
```

> See [`./Taskfile.sh`](./Taskfile.sh) for more tasks to help you develop.

## Deployment

In order for a deployment to succeed we have to build **and push** a Docker
container to GCPs [Artifact Registry][artifact-registry].
Make sure you have enabled and configured Artifact Registry in your
destination project.

Consult the [offical Artifact Registry documentation][artifact-registry]
for details.

### Manually

> ⚠️ **NOTICE** \
> This is an escape hatch. \
> Please use the automated deployment process, e.g. Github Actions.

(1) Authenticate with GCP

```bash
$ gcloud auth login
```

(2) Build and push docker container into Google Container Registry followed
by deploying the container to Cloud Run:

```bash
$ ./Taskfile.sh deploy <environment>

# <environment> - Target environment, e.g. "staging" or "prod".
```

---

_This project was set up by @jvdx/core_

[install-docker]: https://docs.docker.com/get-docker/
[install-node]: https://github.com/nvm-sh/nvm
[install-gcloud]: https://cloud.google.com/sdk/docs/install
[install-jq]: https://stedolan.github.io/jq/
[gcloud-deploy]: https://cloud.google.com/sdk/gcloud/reference/functions/deploy
[artifact-registry]: https://cloud.google.com/artifact-registry/docs/docker/quickstart
[github-secrets]: https://docs.github.com/en/actions/security-guides/encrypted-secrets
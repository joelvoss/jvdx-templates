# template-google-cloud-run

Short description of this library.

## Requirements

  - Node v14+
  - gcloud SDK

## Development

(1) Install dependencies

```bash
$ npm i
# or
$ yarn
```

(2) Run initial validation

```bash
$ ./Taskfile.sh validate
```

(3) Test your function locally

```bash
$ ./Taskfile.sh
```

> See [`./Taskfile.sh`](./Taskfile.sh) for more tasks to help you develop.

## Deployment

(1) Authenticate with GCP

```bash
$ gcloud auth login
```

(2) Build and push docker container into Google Container Registry

```bash
$ ./Taskfile.sh docker_push
```

(3) Deploy Cloud Run container

```bash
$ ./Taskfile.sh deploy
```

> See [`./Taskfile.sh`](./Taskfile.sh) for more tasks to help you develop and
> [the official documentation][gcloud-deploy] for all available cloud run
> deployment options.

---

_This project was set up by @jvdx/core_

[functions-framework]: https://github.com/GoogleCloudPlatform/functions-framework-nodejs
[gcloud-deploy]: https://cloud.google.com/sdk/gcloud/reference/functions/deploy
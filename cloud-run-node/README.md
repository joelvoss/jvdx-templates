# cloud-run-node

A Cloud Run service template written in Node.js.

## Requirements

- Node.js 24+
- Docker for local container runs
- Bash and `jq` for `Taskfile.sh`
- The Google Cloud CLI (`gcloud`) for deployment

## Development

Validate the template:

```shell
./Taskfile.sh validate
```

Build the production bundle:

```shell
./Taskfile.sh build
```

Run the service locally in development mode:

```shell
./Taskfile.sh start dev
```

Run the built service locally:

```shell
./Taskfile.sh start prod
```

Run the service in a local Docker container with tracing disabled:

```shell
./Taskfile.sh start docker
```

## Deployment

`./Taskfile.sh publish_images prod` builds and publishes the Node.js app and
OpenTelemetry Collector sidecar images. `./Taskfile.sh deploy prod` then
deploys both images to Cloud Run.

Before deploying, ensure the following are in place:

- `gcloud`, Bash, and `jq` are installed; the intended deployer account is
  authenticated.
- The project exists, has billing enabled, and has these APIs enabled:
  - `run.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `telemetry.googleapis.com`
  - `firestore.googleapis.com`
- The `europe-west3/docker` Artifact Registry repository exists.
- Image tags referenced in `./Taskfile.sh` have been published with
  `./Taskfile.sh publish_images prod`
- The runtime service account exists and has
  - `roles/datastore.user`
  - `roles/serviceusage.serviceUsageConsumer`
  - `roles/telemetry.tracesWriter`
- The deployer has `roles/run.developer`, `roles/iam.serviceAccountUser` on the
  runtime service account, and `roles/artifactregistry.reader` on the image
  repository.
- A Firestore database exists, and Cloud Run can reach Firestore and
  `telemetry.googleapis.com:443`.

The deployment task does not configure public access or ingress. Decide that
policy separately before deploying. If `config/otel-collector-config.yaml`
changes, rebuild and republish the Collector image under a new revision.

## License

[MIT](./LICENSE)

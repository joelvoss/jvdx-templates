# template-node-lib

Short description of this library.

## Requirements

  - Node v12+
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

(3) Test your function locally using the
[`@google-cloud/functions-framework`][functions-framework].

```bash
$ ./Taskfile.sh start-ff-http
# or
$ ./Taskfile.sh start-ff-event
```

> See [`./Taskfile.sh`](./Taskfile.sh) for more tasks to help you develop.

## Deployment

(1) Authenticate with GCP

```bash
$ gcloud auth login
```

(2) Build and deploy

```bash
$ ./Taskfile.sh build

$ gcloud functions deploy <NAME> \
    --region=<REGION> \
    --project=<PROJECT_ID> \
    # Trigger type: --trigger-http, --trigger-bucket=TRIGGER_BUCKET, --trigger-topic=TRIGGER_TOPIC
    --trigger-http \
    --runtime=nodejs12 \
    --entry-point=<REQ_HANDLER_NAME> \
    --memory=<MEMORY> \
    --max-instances=<INSTANCE_COUNT>
```

> See [the official documentation][gcloud-deploy] for all available options. 

---

_This project was set up by @jvdx/core_

[functions-framework]: https://github.com/GoogleCloudPlatform/functions-framework-nodejs
[gcloud-deploy]: https://cloud.google.com/sdk/gcloud/reference/functions/deploy
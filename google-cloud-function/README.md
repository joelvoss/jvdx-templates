# template-node-lib

Short description of this library.

## Requirements

- [Node v16+][install-node]
- [gcloud SDK][install-gcloud]
- [jq][install-jq]

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
# Serve your function on localhost:8080
$ ./Taskfile.sh dev <event-type> <exported-function-name>

# Call your function from another shell
$ ./Taskfile.sh publish <event-type>
```

> See [`./Taskfile.sh`](./Taskfile.sh) for more tasks to help you develop.

## Deployment

(1) Authenticate with GCP

```bash
$ gcloud auth login
```

(2) Build and deploy

```bash
$ ./Taskfile.sh deploy <environment>
```

> See [`./Taskfile.sh`](./Taskfile.sh) for the possible environments. You can
> modify the `gcloud functions deploy` call inside the `./Taskfile.sh` to serve
> your needs. Consult [the official documentation][gcloud-deploy] for all
> available options. 

---

_This project was set up by @jvdx/core_

[functions-framework]: https://github.com/GoogleCloudPlatform/functions-framework-nodejs
[install-node]: https://github.com/nvm-sh/nvm
[install-gcloud]: https://cloud.google.com/sdk/docs/install
[install-jq]: https://stedolan.github.io/jq/
[gcloud-deploy]: https://cloud.google.com/sdk/gcloud/reference/functions/deploy

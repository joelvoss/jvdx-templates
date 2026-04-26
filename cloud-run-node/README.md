# cloud-run-node

A Cloud Run service template written in Node.js.

## Requirements

- Node.js 24+
- Docker for local container smoke tests

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

Run the Docker smoke test:

```shell
./Taskfile.sh docker_smoketest
```

## Deployment

Set the placeholder values in `Taskfile.sh`, then deploy with:

```shell
./Taskfile.sh deploy dev
```

## License

[MIT](./LICENSE)

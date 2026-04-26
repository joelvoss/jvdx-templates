# cloud-run-python

A FastAPI Cloud Run service template managed with `uv`.

## Requirements

- Python 3.13+
- [`uv`](https://docs.astral.sh/uv/)
- Docker for local container smoke tests

## Development

Validate the template:

```shell
./Taskfile.sh validate
```

Run the service locally in development mode:

```shell
./Taskfile.sh start_dev
```

Run the service in production mode locally:

```shell
./Taskfile.sh start
```

Run the Docker smoke test:

```shell
./Taskfile.sh docker_smoketest
```

Update Python dependencies:

```shell
./Taskfile.sh update_dependencies
```

## Deployment

Set the placeholder values in `Taskfile.sh`, then deploy with:

```shell
./Taskfile.sh deploy prod
```

## License

[MIT](./LICENSE)

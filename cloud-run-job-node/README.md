# cloud-run-job-node

A Cloud Run Job template written in Node.js.

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

Run the job locally.

```shell
./Taskfile.sh start dev
```

## Deployment

Set the placeholder values in `Taskfile.sh`, then deploy with:

```shell
./Taskfile.sh deploy dev
```

Run the deployed job:

```shell
./Taskfile.sh execute dev
```

## License

MIT

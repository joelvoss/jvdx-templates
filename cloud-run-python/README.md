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

Run the Docker image build:

```shell
docker build .
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

## Releases

Releases are cut manually via the **Release** GitHub Actions workflow
(`.github/workflows/release.yml`), which runs `semantic-release` against `main`
(configured in `.releaserc.json`).

1. Make sure commits merged into `main` follow
   [Conventional Commits](https://www.conventionalcommits.org/) (`fix:` for a
   patch release, `feat:` for a minor release, `BREAKING CHANGE:` or `!` for a
   major release).
2. Run the workflow on `main` from the GitHub **Actions** tab (**Release → Run
   workflow**) or with the GitHub CLI:

   ```shell
   gh workflow run release.yml --ref main
   ```

The workflow determines the next version from the commit history, updates
`CHANGELOG.md`, `pyproject.toml`, and `uv.lock` via `uv version --no-sync`,
commits the changes with `[skip ci]`, pushes a version tag, and creates a
GitHub Release.

## License

[MIT](./LICENSE)

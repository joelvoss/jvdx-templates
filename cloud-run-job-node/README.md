# cloud-run-job-node

A Cloud Run Job template written in Node.js.

## Requirements

- Node.js 26+
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
`CHANGELOG.md`, `package.json`, and `package-lock.json`, commits the changes
with `[skip ci]`, pushes a version tag, and creates a GitHub Release
(`npmPublish` is `false`, so it does not publish to npm).

## License

MIT

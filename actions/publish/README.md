<!-- header:start -->

# GitHub Action: Publish

<!-- header:end -->
<!-- overview:start -->

## Overview

Publish the exact Node.js package tarball produced by the [Package action](../package/README.md) to an npm-compatible registry.
The action downloads one artifact, locates exactly one `.tgz`, sets up the current Node.js LTS runtime, and runs `npm publish`.
It does not rebuild the package, change its version, or create a GitHub release.

For version planning, source validation, release files, and GitHub releases, follow the [Node.js release guide](../../.github/workflows/release.md).

<!-- overview:end -->
<!-- usage:start -->

## Usage

Replace `<sha>` with a commit containing this action, then pin that revision in your workflow.

```yaml
jobs:
  publish:
    needs: package
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      id-token: write
    steps:
      - uses: hoverkraft-tech/ci-github-nodejs/actions/publish@<sha>
        with:
          package-tarball-artifact-id: ${{ needs.package.outputs.package-tarball-artifact-id }}
```

The `package` job must expose the Package action's `package-tarball-artifact-id` output.
No checkout or dependency installation is required in the publishing job.

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| Input                         | Description                                                        | Required | Default                      |
| ----------------------------- | ------------------------------------------------------------------ | -------- | ---------------------------- |
| `package-tarball-artifact-id` | One artifact ID from the Package action.                           | Yes      | —                            |
| `registry-url`                | Target npm-compatible registry URL.                                | No       | `https://registry.npmjs.org` |
| `access`                      | `public`, `restricted`, or empty for npm defaults.                 | No       | `public`                     |
| `tag`                         | npm distribution tag, such as `latest`, `next`, or `canary`.       | No       | Empty (npm defaults)         |
| `provenance`                  | Request provenance for the public npm registry: `true` or `false`. | No       | `true`                       |
| `dry-run`                     | Validate publishing without uploading: `true` or `false`.          | No       | `false`                      |
| `github-token`                | Token for downloading the artifact, separate from registry access. | No       | `${{ github.token }}`        |

Boolean inputs are strings in a composite action; quote `"true"` and `"false"` in YAML.
Artifacts uploaded by the Package action use `archive: false`; this action downloads them with `skip-decompress: true`.
When supplying a GitHub token, grant it `actions: read` on the artifact's repository.

<!-- inputs:end -->
<!-- examples:start -->

## Authentication

### npm trusted publishing

Configure an [npm trusted publisher](https://docs.npmjs.com/trusted-publishers/) for your repository and the caller workflow filename.
Use a GitHub-hosted runner and grant the publishing job `id-token: write`.
The action uses the current Node.js LTS runtime; trusted publishing requires Node.js 22.14.0 or newer and npm 11.5.1 or newer.
No npm token is needed. The npm package must already exist before configuring its trusted publisher.
For public packages, ensure `package.json` has a `repository.url` matching the GitHub repository for provenance.

### Registry tokens and GitHub Packages

Provide registry credentials as `NODE_AUTH_TOKEN` on the action step.
For npm token authentication, use an npm publishing token stored in a repository or environment secret.
For GitHub Packages, use a scoped package name, set the registry URL, and grant the job `packages: write`:

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/publish@<sha>
  with:
    package-tarball-artifact-id: ${{ needs.package.outputs.package-tarball-artifact-id }}
    registry-url: https://npm.pkg.github.com
    provenance: "false"
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The `github-token` input only authenticates artifact downloads; it is not an npm publishing credential.

## Dry runs and prereleases

A dry run downloads the same tarball and executes `npm publish --dry-run` without publishing:

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/publish@<sha>
  with:
    package-tarball-artifact-id: ${{ needs.package.outputs.package-tarball-artifact-id }}
    dry-run: "true"
    provenance: "false"
    tag: next
```

Dry runs do not verify registry authorization or reserve the package version.
Use `tag: next` for a prerelease tarball such as `1.2.0-rc.1`; the distribution tag does not change the version inside it.
Publish only after the checks for that exact artifact succeed. Re-running a successful publish for the same package version fails because npm versions are immutable.

<!-- examples:end -->

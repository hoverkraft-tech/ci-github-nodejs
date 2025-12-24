<!-- header:start -->

# GitHub Reusable Workflow: Node.js Release

<div align="center">
  <img src="https://opengraph.githubassets.com/0e54b99e7f052e2a353659bcb048b76224cb355f919e9772252049df8eec3976/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Node.js Release" />
</div>

---

<!-- header:end -->

<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-nodejs)](https://github.com/hoverkraft-tech/ci-github-nodejs/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-nodejs)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!-- overview:start -->

## Overview

Workflow to release Node.js packages with support for:

- Publishing to various registries (npm, GitHub Packages)
- Publishing from build artifacts or source code
- Publishing pre-built package tarballs
- Generating documentation (optional)
- Provenance attestation for npm packages
- Distribution tags for versioning
- Scoped package access control

### Permissions

- **`contents`**: `read`
- **`id-token`**: `write` (required for provenance)
- **`packages`**: `write`

<!-- overview:end -->

<!-- usage:start -->

## Usage

### Basic Release from Source

```yaml
name: Release

on:
  release:
    types: [published]

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
```

### Release with Build Artifacts from CI

```yaml
name: Release

on:
  push:
    tags: ["*"]

permissions: {}

jobs:
  ci:
    uses: ./.github/workflows/__shared-ci.yml
    permissions:
      contents: read
      id-token: write
      packages: read
    secrets: inherit

  release:
    needs: ci
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
    with:
      # Download build artifacts from CI job
      build-artifact-id: ${{ needs.ci.outputs.build-artifact-id }}
      access: public
```

### Release Pre-built Tarball

```yaml
name: Release

on:
  push:
    tags: ["*"]

permissions: {}

jobs:
  ci:
    uses: ./.github/workflows/__shared-ci.yml
    permissions:
      contents: read
      id-token: write
    secrets: inherit

  release:
    needs: ci
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
    with:
      build-artifact-id: ${{ needs.ci.outputs.package-tarball-artifact-id }}
      package-tarball: "*.tgz"
      access: public
      provenance: true
```

<!-- usage:end -->

<!-- markdownlint-disable MD013 -->

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**               | **Description**                                                                    | **Required** | **Type**    | **Default**         |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------ | ----------- | ------------------- |
| **`runs-on`**           | JSON array of runner(s) to use.                                                    | **false**    | **string**  | `["ubuntu-latest"]` |
|                         | See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>. |              |             |                     |
| **`build-artifact-id`** | Build artifact ID from CI to download before publishing.                           | **false**    | **string**  | -                   |
|                         | Contains built package or tarball from a previous job.                             |              |             |                     |
| **`package-tarball`**   | Path/pattern to pre-built tarball to publish (e.g., `*.tgz`).                      | **false**    | **string**  | -                   |
|                         | Use when publishing a specific tarball instead of from source.                     |              |             |                     |
| **`access`**            | Package access level: `public` or `restricted`.                                    | **false**    | **string**  | -                   |
|                         | Leave empty to use package.json default.                                           |              |             |                     |
| **`docs`**              | Documentation generation parameters.                                               | **false**    | **string**  | -                   |
|                         | Set to empty string or `false` to disable.                                         |              |             |                     |
|                         | Set to `true` for default command (`docs`).                                        |              |             |                     |
|                         | Accepts JSON object with `command`, `output`, and `artifact` properties.           |              |             |                     |
| **`registry`**          | Registry configuration for package publishing.                                     | **false**    | **string**  | `npm`               |
|                         | Supported values: `npm`, `github`, URL, or JSON object with `url` and `scope`.     |              |             |                     |
| **`publish-command`**   | Command to run for publishing the package.                                         | **false**    | **string**  | `publish`           |
|                         | Defaults to `publish` which runs `npm publish` or equivalent.                      |              |             |                     |
| **`tag`**               | npm distribution tag for the published package.                                    | **false**    | **string**  | `latest`            |
|                         | Common values: `latest`, `next`, `canary`.                                         |              |             |                     |
| **`dry-run`**           | Whether to perform a dry run (no actual publish).                                  | **false**    | **boolean** | `false`             |
| **`provenance`**        | Whether to generate provenance attestation for the published package.              | **false**    | **boolean** | `true`              |
|                         | Requires npm 9.5.0+ and appropriate permissions.                                   |              |             |                     |
| **`working-directory`** | Working directory where the package is located.                                    | **false**    | **string**  | `.`                 |

<!-- inputs:end -->

<!-- markdownlint-enable MD013 -->

<!-- secrets:start -->

## Secrets

| **Secret**           | **Description**                                                                    | **Required** |
| -------------------- | ---------------------------------------------------------------------------------- | ------------ |
| **`registry-token`** | Authentication token for the registry.                                             | **true**     |
|                      | For npm: Use an npm access token with publish permissions.                         |              |
|                      | For GitHub Packages: Use `GITHUB_TOKEN` or a PAT with `packages:write` permission. |              |

<!-- secrets:end -->

<!-- outputs:start -->

## Outputs

| **Output**             | **Description**                                 |
| ---------------------- | ----------------------------------------------- |
| **`version`**          | The version of the published package.           |
| **`package-name`**     | The name of the published package.              |
| **`docs-artifact-id`** | ID of the documentation artifact (if uploaded). |

<!-- outputs:end -->

<!-- examples:start -->

## Examples

### Basic Release to npm

```yaml
name: Release to npm

on:
  release:
    types: [published]

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
```

### Release to GitHub Packages

```yaml
name: Release to GitHub Packages

on:
  release:
    types: [published]

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.GITHUB_TOKEN }}
    with:
      registry: github
      provenance: false
```

### Release with Documentation

```yaml
name: Release with Documentation

on:
  release:
    types: [published]

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
    with:
      docs: |
        {
          "command": "build:docs",
          "output": "docs-dist",
          "artifact": true
        }
```

### Prerelease with Next Tag

```yaml
name: Pre-release

on:
  release:
    types: [prereleased]

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
    with:
      tag: next
```

### Custom Registry

```yaml
name: Release to Custom Registry

on:
  release:
    types: [published]

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.CUSTOM_REGISTRY_TOKEN }}
    with:
      registry: |
        {
          "url": "https://my-registry.example.com",
          "scope": "@myorg"
        }
      provenance: false
```

### Dry Run for Testing

```yaml
name: Test Release

on:
  workflow_dispatch:

permissions: {}

jobs:
  test-release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
    with:
      dry-run: true
```

### Monorepo Package Release

```yaml
name: Release Package

on:
  release:
    types: [published]

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    secrets:
      registry-token: ${{ secrets.NPM_TOKEN }}
    with:
      working-directory: packages/my-package
```

<!-- examples:end -->

<!-- contributing:start -->

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md) for more details.

<!-- contributing:end -->

<!-- security:start -->
<!-- security:end -->

<!-- license:start -->

## License

This project is licensed under the MIT License.

SPDX-License-Identifier: MIT

Copyright © 2025 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->

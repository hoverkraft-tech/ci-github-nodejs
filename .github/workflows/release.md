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

- Generating documentation (optional)
- Publishing to various registries (npm, GitHub Packages)
- Provenance attestation for npm packages
- Distribution tags for versioning

### Permissions

- **`contents`**: `read`
- **`id-token`**: `write` (required for provenance)
- **`packages`**: `write`

<!-- overview:end -->

<!-- usage:start -->

## Usage

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
      # Authentication token for the registry.
      # For npm: Use an npm access token with publish permissions.
      # For GitHub Packages: Use `GITHUB_TOKEN` or a PAT with `packages:write` permission.
      registry-token: ${{ secrets.NPM_TOKEN }}
    with:
      # JSON array of runner(s) to use.
      # Default: `["ubuntu-latest"]`
      runs-on: '["ubuntu-latest"]'

      # Documentation generation parameters.
      # Set to empty string or `false` to disable.
      docs: ""

      # Registry configuration.
      # Use `npm`, `github`, or a URL/JSON object.
      # Default: `npm`
      registry: npm

      # Command to run for publishing.
      # Default: `publish`
      publish-command: publish

      # npm distribution tag.
      # Default: `latest`
      tag: latest

      # Whether to perform a dry run.
      # Default: `false`
      dry-run: false

      # Whether to generate provenance attestation.
      # Default: `true`
      provenance: true

      # Working directory where the package is located.
      # Default: `.`
      working-directory: .
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

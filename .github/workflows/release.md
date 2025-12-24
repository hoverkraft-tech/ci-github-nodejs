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

Workflow to publish the exact Node.js package tarball produced and verified by
CI.

The workflow downloads a raw `.tgz` artifact by immutable artifact ID, verifies
that exactly one tarball is present, configures Node.js for the target registry,
and runs `npm publish` against that tarball.

### Permissions

- **`contents`**: `read`
- **`id-token`**: `write` (required for provenance)
- **`packages`**: `write`

<!-- overview:end -->

<!-- usage:start -->

## Usage

### Publish a CI Package Tarball

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
      package-tarball-artifact-id: ${{ needs.ci.outputs.package-tarball-artifact-id }}
```

<!-- usage:end -->

<!-- markdownlint-disable MD013 -->

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                         | **Description**                                                                    | **Required** | **Type**    | **Default**                  |
| --------------------------------- | ---------------------------------------------------------------------------------- | ------------ | ----------- | ---------------------------- |
| **`runs-on`**                     | JSON array of runner(s) to use.                                                    | **false**    | **string**  | `["ubuntu-latest"]`          |
|                                   | See <https://docs.github.com/en/actions/using-jobs/choosing-the-runner-for-a-job>. |              |             |                              |
| **`package-tarball-artifact-id`** | Artifact ID of the package tarball produced by CI.                                 | **true**     | **string**  | -                            |
| **`registry-url`**                | Registry URL used by npm publish.                                                  | **false**    | **string**  | `https://registry.npmjs.org` |
| **`access`**                      | Package access level passed to npm publish.                                        | **false**    | **string**  | `public`                     |
|                                   | Leave empty to use npm defaults.                                                   |              |             |                              |
| **`tag`**                         | npm distribution tag for the published package.                                    | **false**    | **string**  | `latest`                     |
|                                   | Common values: `latest`, `next`, `canary`.                                         |              |             |                              |
| **`provenance`**                  | Whether to generate npm provenance for npmjs.org publishes.                        | **false**    | **boolean** | `true`                       |
| **`dry-run`**                     | Whether to run npm publish without publishing the package.                         | **false**    | **boolean** | `false`                      |

<!-- inputs:end -->

<!-- markdownlint-enable MD013 -->

<!-- secrets:start -->

## Secrets

| **Secret**           | **Description**                                           | **Required** |
| -------------------- | --------------------------------------------------------- | ------------ |
| **`registry-token`** | Authentication token for token-based registry publishing. | **false**    |

<!-- secrets:end -->

<!-- examples:start -->

## Examples

### Publish Tested Tarball to npm

```yaml
name: Release

on:
  push:
    tags: ["*"]

permissions: {}

jobs:
  ci:
    uses: ./.github/workflows/__shared-ci.yml
    secrets: inherit
    permissions:
      contents: read
      id-token: write
      packages: read

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
      package-tarball-artifact-id: ${{ needs.ci.outputs.package-tarball-artifact-id }}
```

### Dry Run

```yaml
name: Release dry run

on:
  workflow_dispatch:
    inputs:
      package-tarball-artifact-id:
        description: Package tarball artifact ID from a previous CI run
        required: true
        type: string

permissions: {}

jobs:
  dry-run:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@main
    permissions:
      contents: read
      packages: write
      id-token: write
    with:
      package-tarball-artifact-id: ${{ inputs.package-tarball-artifact-id }}
      dry-run: true
      provenance: false
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

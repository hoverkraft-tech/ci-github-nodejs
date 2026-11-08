<!-- header:start -->

# GitHub Reusable Workflow: Prepare Node.js Package Release

<div align="center">
  <img src="https://opengraph.githubassets.com/798861777139bae96adc7ee652339a4713d1b50ce3b11cfb3ce6c363f2339b53/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Prepare Node.js Package Release" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-nodejs)](https://github.com/hoverkraft-tech/ci-github-nodejs/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-nodejs)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Prepare Node.js package versions and lockfiles before building the release.
Dispatches the calling workflow at the prepared tag; that run can build and publish.
See [the release guide](release.md).

### Permissions

- **`actions`**: `write`
- **`contents`**: `write`
- **`pull-requests`**: `read`

<!-- overview:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                  | **Description**                                                                                                                                                                        | **Required** | **Type**    | **Default** |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | ----------- |
| **`release-config`**       | Optional partial release configuration as a YAML or JSON mapping, forwarded to ci-github-publish/actions/release/plan.                                                                 | **false**    | **string**  | -           |
|                            | See <https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/plan> for supported settings and override behavior.                                                |              |             |             |
|                            | Pass the same configuration to preparation and release. Independent Lerna retains native version planning.                                                                             |              |             |             |
| **`versioning`**           | Versioning tool, npm for one public package or lerna for fixed or independent workspaces.                                                                                              | **false**    | **string**  | `npm`       |
| **`working-directory`**    | Project or workspace root containing the lockfile and package manager configuration.                                                                                                   | **false**    | **string**  | `.`         |
| **`package-directory`**    | Public npm package directory relative to working-directory. Leave as . for a root package or Lerna workspaces.                                                                         | **false**    | **string**  | `.`         |
| **`force`**                | Force a new version on manual default-branch runs, including unchanged public packages. Uses a patch bump when no version increase is planned. Ignored for schedules and tag recovery. | **false**    | **boolean** | `false`     |
| **`github-app-client-id`** | Optional GitHub App client ID, paired with the github-app-key secret to generate a repository-scoped preparation token.                                                                | **false**    | **string**  | -           |

<!-- inputs:end -->
<!-- secrets:start -->

## Secrets

| **Secret**           | **Description**                                                                                                                      | **Required** |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| **`github-app-key`** | Optional GitHub App private key, paired with the github-app-client-id input. The identity must be permitted by branch and tag rules. | **false**    |

<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**     | **Description**                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **`status`**   | no-changes, dispatched, released or ready. Only ready should start building and publication in this run. |
| **`packages`** | JSON package list for the release workflow's packages input. Available when status is ready.             |

<!-- outputs:end -->
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

Copyright © 2026 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->
<!-- usage:start -->

## Usage

```yaml
name: Prepare Node.js Package Release
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  prepare-package-release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/prepare-package-release.yml@02a04ad25ceaacdf3b7200e45fb7fec07fadf4fa # 2.1.0
    permissions:
      actions: write
      contents: write
      pull-requests: read
    secrets:
      # Optional GitHub App private key, paired with the github-app-client-id input. The identity must be permitted by branch and tag rules.
      github-app-key: ""
    with:
      # Optional partial release configuration as a YAML or JSON mapping, forwarded to ci-github-publish/actions/release/plan.
      # See https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/plan for supported settings and override behavior.
      # Pass the same configuration to preparation and release. Independent Lerna retains native version planning.
      release-config: ""

      # Versioning tool, npm for one public package or lerna for fixed or independent workspaces.
      # Default: `npm`
      versioning: npm

      # Project or workspace root containing the lockfile and package manager configuration.
      # Default: `.`
      working-directory: .

      # Public npm package directory relative to working-directory. Leave as . for a root package or Lerna workspaces.
      # Default: `.`
      package-directory: .

      # Force a new version on manual default-branch runs, including unchanged public packages. Uses a patch bump when no version increase is planned. Ignored for schedules and tag recovery.
      force: false

      # Optional GitHub App client ID, paired with the github-app-key secret to generate a repository-scoped preparation token.
      github-app-client-id: ""
```

<!-- usage:end -->
<!-- examples:start -->
<!-- examples:end -->

<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stY2lyY2xlIiBjb2xvcj0iYmx1ZSI+PHBhdGggZD0iTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjIyIDQgMTIgMTQuMDEgOSAxMS4wMSI+PC9wb2x5bGluZT48L3N2Zz4=) GitHub Action: Lint

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-lint-blue?logo=github-actions)](https://github.com/marketplace/actions/lint)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-nodejs)](https://github.com/hoverkraft-tech/ci-github-nodejs/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-nodejs)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->

<!--
// jscpd:ignore-start
-->
<!-- overview:start -->

## Overview

Run project lint commands and validate their native reports before publication.

Commands receive CI_REPORTS_DIR, a fresh directory for this execution. Write
required reports there; stale files in the project cannot satisfy the contract.
Missing or malformed reports fail even after a successful command. Available
diagnostics are retained after failures. Call common ci-reports once after all checks.
Producer jobs require actions: read and contents: read, with source checked out and Git available (including in CI containers).

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@d580938064613e6d666f79320109f94dc98875b7 # feat/native-github-coverage
  with:
    # Disable project and dependency lifecycle scripts during installation.
    # Set false to allow installation hooks, subject to the package manager's script approval settings.
    # Explicit commands are unaffected. Does not apply in container mode, which skips installation.
    #
    # Default: `true`
    ignore-scripts: "true"

    # Working directory where lint commands are executed.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # Whether running in container mode (skips checkout and node setup)
    # Default: `false`
    container: "false"

    # npm/pnpm/Yarn script to run. Generate the declared native diagnostics under CI_REPORTS_DIR, for example Biome with --reporter=sarif --reporter-file="$CI_REPORTS_DIR/lint.sarif".
    # Default: `lint:ci`
    command: lint:ci

    # Optional JSON object mapping native report source path prefixes to repository-relative directories.
    path-mapping: ""

    # Source commit tested by a prebuilt container; must equal the checked-out revision.
    source-sha: ""

    # Repository-relative directory represented by a prebuilt working-directory. Required with source-sha outside GITHUB_WORKSPACE; use a dot for the repository root.
    source-prefix: ""

    # Required native report paths relative to CI_REPORTS_DIR, one per line.
    # Default: `lint.sarif`
    lint-results: lint.sarif
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                                                                   | **Required** | **Default**  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------ |
| **`ignore-scripts`**    | Disable project and dependency lifecycle scripts during installation.                                                                                                             | **false**    | `true`       |
|                         | Set false to allow installation hooks, subject to the package manager's script approval settings.                                                                                 |              |              |
|                         | Explicit commands are unaffected. Does not apply in container mode, which skips installation.                                                                                     |              |              |
| **`working-directory`** | Working directory where lint commands are executed.                                                                                                                               | **false**    | `.`          |
|                         | Can be absolute or relative to the repository root.                                                                                                                               |              |              |
| **`container`**         | Whether running in container mode (skips checkout and node setup)                                                                                                                 | **false**    | `false`      |
| **`command`**           | npm/pnpm/Yarn script to run. Generate the declared native diagnostics under CI_REPORTS_DIR, for example Biome with --reporter=sarif --reporter-file="$CI_REPORTS_DIR/lint.sarif". | **false**    | `lint:ci`    |
| **`path-mapping`**      | Optional JSON object mapping native report source path prefixes to repository-relative directories.                                                                               | **false**    | -            |
| **`source-sha`**        | Source commit tested by a prebuilt container; must equal the checked-out revision.                                                                                                | **false**    | -            |
| **`source-prefix`**     | Repository-relative directory represented by a prebuilt working-directory. Required with source-sha outside GITHUB_WORKSPACE; use a dot for the repository root.                  | **false**    | -            |
| **`lint-results`**      | Required native report paths relative to CI_REPORTS_DIR, one per line.                                                                                                            | **false**    | `lint.sarif` |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**               | **Description**                                                       |
| ------------------------ | --------------------------------------------------------------------- |
| **`report-artifact-id`** | Native report bundle, including available diagnostics after failures. |

<!-- outputs:end -->
<!-- examples:start -->
<!-- examples:end -->

<!--
// jscpd:ignore-end
-->

<!--
// jscpd:ignore-start
-->

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

Copyright © 2026 hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

<!--
// jscpd:ignore-end
-->

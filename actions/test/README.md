<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stc3F1YXJlIiBjb2xvcj0iYmx1ZSI+PHBvbHlsaW5lIHBvaW50cz0iOSAxMSAxMiAxNCAyMiA0Ij48L3BvbHlsaW5lPjxwYXRoIGQ9Ik0yMSAxMnY3YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmgxMSI+PC9wYXRoPjwvc3ZnPg==) GitHub Action: Test

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-test-blue?logo=github-actions)](https://github.com/marketplace/actions/test)
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

Run project test commands and validate their native reports before publication.

Commands receive CI_REPORTS_DIR, a fresh directory for this execution. Write
required reports there; stale files in the project cannot satisfy the contract.
Missing or malformed reports fail even after a successful command. Available
diagnostics are retained after failures. Call common ci-reports once after all checks.
Producer jobs require actions: read and contents: read, with source checked out.
CI_TEST_COVERAGE indicates whether to instrument tests. Default reports are JUnit
and LCOV; configure different native paths with test-results and test-coverage.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@35b4839d14f5abf7ce8426d8a5d718170a971ee6 # feat/native-github-coverage
  with:
    # Disable project and dependency lifecycle scripts during installation.
    # Set false to allow installation hooks, subject to the package manager's script approval settings.
    # Explicit commands are unaffected. Does not apply in container mode, which skips installation.
    #
    # Default: `true`
    ignore-scripts: "true"

    # Working directory where test commands are executed.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # Whether running in container mode (skips checkout and node setup)
    # Default: `false`
    container: "false"

    # npm/pnpm/Yarn script to run. Write JUnit or TAP into CI_REPORTS_DIR and enable coverage when CI_TEST_COVERAGE is true. For Vitest, use --outputFile.junit="$CI_REPORTS_DIR/junit.xml" and --coverage.reportsDirectory="$CI_REPORTS_DIR/coverage".
    # Default: `test:ci`
    command: test:ci

    # Collect and require coverage. The project command must honor CI_TEST_COVERAGE when selecting instrumentation.
    # Default: `true`
    coverage: "true"

    # JSON array of arguments passed to the package script without shell expansion.
    # npm receives its required `--` separator; pnpm and Yarn receive arguments directly.
    #
    # Default: `[]`
    arguments: "[]"

    # Optional Vitest shard as index/total, for example `1/2`. Requires shard-group.
    # Adds native shard/blob arguments, sets CI_TEST_SHARD, and uploads a checked blob payload
    # after tests, including failures. Individual reporting is disabled for shards.
    # Use reporter-specific --outputFile.junit rather than scalar --outputFile in the package script.
    # Keep coverage collection enabled; defer configured coverage thresholds to the merge
    # when CI_TEST_SHARD is nonempty. The workflow normally supplies these orchestration inputs.
    shard: ""

    # Unique artifact group for this project, workflow invocation, run and attempt.
    # Use only letters, numbers, underscores and hyphens. Never reuse across attempts.
    # All shards and their merge must use the same group and absolute project directory.
    shard-group: ""

    # Optional expected Vitest shard count (2-256). Requires shard-group and excludes shard.
    # Downloads this run's matching payloads, validates the complete set and adds --merge-reports.
    # The package script must enable final reporters and original coverage thresholds.
    # A failed shard remains fatal even if merging succeeds. Partial reruns require a full workflow rerun.
    merge-shards: ""

    # Optional JSON object mapping native report source path prefixes to repository-relative directories.
    path-mapping: ""

    # Source commit tested by a prebuilt container; must equal the checked-out revision.
    source-sha: ""

    # Repository-relative directory represented by a prebuilt working-directory. Required with source-sha outside GITHUB_WORKSPACE; use a dot for the repository root.
    source-prefix: ""

    # Required native report paths relative to CI_REPORTS_DIR, one per line.
    # Default: `junit.xml`
    test-results: junit.xml

    # Required native coverage paths relative to CI_REPORTS_DIR when coverage is enabled, one per line. Merge coverage shards in the framework first.
    # Default: `coverage/lcov.info`
    test-coverage: coverage/lcov.info
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                                                                                                                                   | **Required** | **Default**          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------- |
| **`ignore-scripts`**    | Disable project and dependency lifecycle scripts during installation.                                                                                                                                                                             | **false**    | `true`               |
|                         | Set false to allow installation hooks, subject to the package manager's script approval settings.                                                                                                                                                 |              |                      |
|                         | Explicit commands are unaffected. Does not apply in container mode, which skips installation.                                                                                                                                                     |              |                      |
| **`working-directory`** | Working directory where test commands are executed.                                                                                                                                                                                               | **false**    | `.`                  |
|                         | Can be absolute or relative to the repository root.                                                                                                                                                                                               |              |                      |
| **`container`**         | Whether running in container mode (skips checkout and node setup)                                                                                                                                                                                 | **false**    | `false`              |
| **`command`**           | npm/pnpm/Yarn script to run. Write JUnit or TAP into CI_REPORTS_DIR and enable coverage when CI_TEST_COVERAGE is true. For Vitest, use --outputFile.junit="$CI_REPORTS_DIR/junit.xml" and --coverage.reportsDirectory="$CI_REPORTS_DIR/coverage". | **false**    | `test:ci`            |
| **`coverage`**          | Collect and require coverage. The project command must honor CI_TEST_COVERAGE when selecting instrumentation.                                                                                                                                     | **false**    | `true`               |
| **`arguments`**         | JSON array of arguments passed to the package script without shell expansion.                                                                                                                                                                     | **false**    | `[]`                 |
|                         | npm receives its required `--` separator; pnpm and Yarn receive arguments directly.                                                                                                                                                               |              |                      |
| **`shard`**             | Optional Vitest shard as index/total, for example `1/2`. Requires shard-group.                                                                                                                                                                    | **false**    | -                    |
|                         | Adds native shard/blob arguments, sets CI_TEST_SHARD, and uploads a checked blob payload                                                                                                                                                          |              |                      |
|                         | after tests, including failures. Individual reporting is disabled for shards.                                                                                                                                                                     |              |                      |
|                         | Use reporter-specific --outputFile.junit rather than scalar --outputFile in the package script.                                                                                                                                                   |              |                      |
|                         | Keep coverage collection enabled; defer configured coverage thresholds to the merge                                                                                                                                                               |              |                      |
|                         | when CI_TEST_SHARD is nonempty. The workflow normally supplies these orchestration inputs.                                                                                                                                                        |              |                      |
| **`shard-group`**       | Unique artifact group for this project, workflow invocation, run and attempt.                                                                                                                                                                     | **false**    | -                    |
|                         | Use only letters, numbers, underscores and hyphens. Never reuse across attempts.                                                                                                                                                                  |              |                      |
|                         | All shards and their merge must use the same group and absolute project directory.                                                                                                                                                                |              |                      |
| **`merge-shards`**      | Optional expected Vitest shard count (2-256). Requires shard-group and excludes shard.                                                                                                                                                            | **false**    | -                    |
|                         | Downloads this run's matching payloads, validates the complete set and adds --merge-reports.                                                                                                                                                      |              |                      |
|                         | The package script must enable final reporters and original coverage thresholds.                                                                                                                                                                  |              |                      |
|                         | A failed shard remains fatal even if merging succeeds. Partial reruns require a full workflow rerun.                                                                                                                                              |              |                      |
| **`path-mapping`**      | Optional JSON object mapping native report source path prefixes to repository-relative directories.                                                                                                                                               | **false**    | -                    |
| **`source-sha`**        | Source commit tested by a prebuilt container; must equal the checked-out revision.                                                                                                                                                                | **false**    | -                    |
| **`source-prefix`**     | Repository-relative directory represented by a prebuilt working-directory. Required with source-sha outside GITHUB_WORKSPACE; use a dot for the repository root.                                                                                  | **false**    | -                    |
| **`test-results`**      | Required native report paths relative to CI_REPORTS_DIR, one per line.                                                                                                                                                                            | **false**    | `junit.xml`          |
| **`test-coverage`**     | Required native coverage paths relative to CI_REPORTS_DIR when coverage is enabled, one per line. Merge coverage shards in the framework first.                                                                                                   | **false**    | `coverage/lcov.info` |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**               | **Description**                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **`report-artifact-id`** | Native report bundle, including available diagnostics after failures.                     |
| **`shard-artifact-id`**  | Blob and manifest artifact ID for an executing shard, including failed tests with a blob. |

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

<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stc3F1YXJlIiBjb2xvcj0iYmx1ZSI+PHBvbHlsaW5lIHBvaW50cz0iOSAxMSAxMiAxNCAyMiA0Ij48L3BvbHlsaW5lPjxwYXRoIGQ9Ik0yMSAxMnY3YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmgxMSI+PC9wYXRoPjwvc3ZnPg==) GitHub Action: Test

<div align="center">
  <img src="https://opengraph.githubassets.com/7e9813f9e19bd5adf686a5ff854c41da9068e2fb45a0d01f3d74b94a77ffe027/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Test" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-test-blue?logo=github-actions)](https://github.com/marketplace/actions/test)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-nodejs)](https://github.com/hoverkraft-tech/ci-github-nodejs/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-nodejs)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md)

<!-- badges:end -->

<!--
// jscpd:ignore-start
-->
<!-- overview:start -->

## Overview

Action to test Node.js projects with support for coverage reporting and pull request annotations

GitHub reporting retains native report artifacts for seven days, including after
test failures. Set `comment: false` and call the common `ci-reports` workflow
after test jobs to publish one test comment and one coverage comment.

Note that this action must have write permission for id-token for this to work when using Codecov coverage reporting:

```yml
permissions:
  id-token: write
```

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@02a04ad25ceaacdf3b7200e45fb7fec07fadf4fa # 2.1.0
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

    # npm/pnpm/Yarn script command to run for testing.
    # This should be a script defined in your `package.json`.
    # The command should generate coverage report files in a standard format (Cobertura XML, lcov, etc.).
    #
    # Vitest: `vitest run --reporter=default --reporter=junit --outputFile=junit.xml --coverage.enabled --coverage.reporter=lcov --coverage.reporter=text`
    # Jest: `jest --ci --reporters=default --reporters=jest-junit --coverage`
    #
    # Default: `test:ci`
    command: test:ci

    # Code coverage reporter to use. Supported values:
    # - `github`: Parse coverage reports via [parse-ci-reports](https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/quality/parse-ci-reports) action, with GitHub summaries/PR comments
    # - `codecov`: Upload coverage to Codecov
    # - `""` or `null`: No coverage reporting
    #
    # Default: `github`
    coverage: github

    # Optional test and coverage report paths forwarded to the [parse-ci-reports](https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/quality/parse-ci-reports) action.
    # Supports multiple formats (Cobertura, OpenCover, lcov, etc.).
    # Provide absolute paths or paths relative to the working directory.
    # Multiple entries can be separated by newlines, commas, or semicolons.
    # Each explicit path or glob must match a file after exclusions; missing reports fail the action.
    # When omitted, `auto:test,auto:coverage` detection may find no reports.
    # Applies only when coverage is `github`.
    report-file: ""

    # Optional path mapping to adjust file paths in test and coverage reports.
    # See the [parse-ci-reports documentation](https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/quality/parse-ci-reports) for details.
    path-mapping: ""

    # Publish an individual coverage PR comment. Set false when using the common ci-reports workflow; GitHub summaries and report artifacts remain enabled.
    # Default: `true`
    comment: "true"

    # Job ID used to associate native reports with the common ci-reports workflow's job-results.
    # Defaults to the current job ID. Set the outer calling job ID for nested reusable workflows.
    # Matrix runs keep separate artifacts labeled with their working directory.
    report-group: ""

    # GitHub token for coverage PR comments.
    # Required when coverage is `github` and individual comments are enabled.
    # Requires permissions to create and update PR comments:
    #
    # - `issues: write`
    # - `pull-requests: write`
    github-token: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                                                                                     | **Required** | **Default** |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| **`ignore-scripts`**    | Disable project and dependency lifecycle scripts during installation.                                                                                                                               | **false**    | `true`      |
|                         | Set false to allow installation hooks, subject to the package manager's script approval settings.                                                                                                   |              |             |
|                         | Explicit commands are unaffected. Does not apply in container mode, which skips installation.                                                                                                       |              |             |
| **`working-directory`** | Working directory where test commands are executed.                                                                                                                                                 | **false**    | `.`         |
|                         | Can be absolute or relative to the repository root.                                                                                                                                                 |              |             |
| **`container`**         | Whether running in container mode (skips checkout and node setup)                                                                                                                                   | **false**    | `false`     |
| **`command`**           | npm/pnpm/Yarn script command to run for testing.                                                                                                                                                    | **false**    | `test:ci`   |
|                         | This should be a script defined in your `package.json`.                                                                                                                                             |              |             |
|                         | The command should generate coverage report files in a standard format (Cobertura XML, lcov, etc.).                                                                                                 |              |             |
|                         |                                                                                                                                                                                                     |              |             |
|                         | Vitest: `vitest run --reporter=default --reporter=junit --outputFile=junit.xml --coverage.enabled --coverage.reporter=lcov --coverage.reporter=text`                                                |              |             |
|                         | Jest: `jest --ci --reporters=default --reporters=jest-junit --coverage`                                                                                                                             |              |             |
| **`coverage`**          | Code coverage reporter to use. Supported values:                                                                                                                                                    | **false**    | `github`    |
|                         | - `github`: Parse coverage reports via [parse-ci-reports](https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/quality/parse-ci-reports) action, with GitHub summaries/PR comments |              |             |
|                         | - `codecov`: Upload coverage to Codecov                                                                                                                                                             |              |             |
|                         | - `""` or `null`: No coverage reporting                                                                                                                                                             |              |             |
| **`report-file`**       | Optional test and coverage report paths forwarded to the [parse-ci-reports](https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/quality/parse-ci-reports) action.                 | **false**    | -           |
|                         | Supports multiple formats (Cobertura, OpenCover, lcov, etc.).                                                                                                                                       |              |             |
|                         | Provide absolute paths or paths relative to the working directory.                                                                                                                                  |              |             |
|                         | Multiple entries can be separated by newlines, commas, or semicolons.                                                                                                                               |              |             |
|                         | Each explicit path or glob must match a file after exclusions; missing reports fail the action.                                                                                                     |              |             |
|                         | When omitted, `auto:test,auto:coverage` detection may find no reports.                                                                                                                              |              |             |
|                         | Applies only when coverage is `github`.                                                                                                                                                             |              |             |
| **`path-mapping`**      | Optional path mapping to adjust file paths in test and coverage reports.                                                                                                                            | **false**    | -           |
|                         | See the [parse-ci-reports documentation](https://github.com/hoverkraft-tech/ci-github-common/tree/main/actions/quality/parse-ci-reports) for details.                                               |              |             |
| **`comment`**           | Publish an individual coverage PR comment. Set false when using the common ci-reports workflow; GitHub summaries and report artifacts remain enabled.                                               | **false**    | `true`      |
| **`report-group`**      | Job ID used to associate native reports with the common ci-reports workflow's job-results.                                                                                                          | **false**    | -           |
|                         | Defaults to the current job ID. Set the outer calling job ID for nested reusable workflows.                                                                                                         |              |             |
|                         | Matrix runs keep separate artifacts labeled with their working directory.                                                                                                                           |              |             |
| **`github-token`**      | GitHub token for coverage PR comments.                                                                                                                                                              | **false**    | -           |
|                         | Required when coverage is `github` and individual comments are enabled.                                                                                                                             |              |             |
|                         | Requires permissions to create and update PR comments:                                                                                                                                              |              |             |
|                         |                                                                                                                                                                                                     |              |             |
|                         | - `issues: write`                                                                                                                                                                                   |              |             |
|                         | - `pull-requests: write`                                                                                                                                                                            |              |             |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**               | **Description**                                                                  |
| ------------------------ | -------------------------------------------------------------------------------- |
| **`report-artifact-id`** | Native test and coverage artifact ID, empty when GitHub reports are unavailable. |

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

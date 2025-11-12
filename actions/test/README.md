<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stc3F1YXJlIiBjb2xvcj0iZ3JheS1kYXJrIj48cG9seWxpbmUgcG9pbnRzPSI5IDExIDEyIDE0IDIyIDQiPjwvcG9seWxpbmU+PHBhdGggZD0iTTIxIDEydjdhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDExIj48L3BhdGg+PC9zdmc+) GitHub Action: Test

<div align="center">
  <img src="https://opengraph.githubassets.com/b83a39d0a270998cbae0974683a11eba4481aa44bbb4abbc39522474251c5b0a/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Test" />
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
<!-- overview:start -->

## Overview

Action to test Node.js projects with support for coverage reporting and pull request annotations

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@db1c1d36ff3e87c4513eded15d85acb78dcbd9b9 # copilot/refactor-ci-actions-lint-test
  with:
    # Working directory where test commands are executed.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # Whether running in container mode (skips checkout and node setup)
    # Default: `false`
    container: "false"

    # Code coverage reporter to use. Supported values:
    # - "codecov": Upload coverage to Codecov
    # - "lcov": Use lcov-reporter-action for PR comments
    # - "": No coverage reporting
    coverage: ""

    # Path to LCOV file for coverage reporting.
    # Only used when coverage is set to "lcov".
    #
    # Default: `coverage/lcov.info`
    lcov-file: coverage/lcov.info

    # Codecov token for private repositories.
    # Not required for public repositories when using OIDC.
    codecov-token: ""

    # GitHub token for LCOV reporter PR comments.
    # Required when coverage is set to "lcov".
    github-token: ""

    # Whether to fail the action if tests fail
    # Default: `true`
    fail-on-error: "true"
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                   | **Required** | **Default**          |
| ----------------------- | ----------------------------------------------------------------- | ------------ | -------------------- |
| **`working-directory`** | Working directory where test commands are executed.               | **false**    | `.`                  |
|                         | Can be absolute or relative to the repository root.               |              |                      |
| **`container`**         | Whether running in container mode (skips checkout and node setup) | **false**    | `false`              |
| **`coverage`**          | Code coverage reporter to use. Supported values:                  | **false**    | -                    |
|                         | - "Codecov": Upload coverage to Codecov                           |              |                      |
|                         | - "lcov": Use lcov-reporter-action for PR comments                |              |                      |
|                         | - "": No coverage reporting                                       |              |                      |
| **`lcov-file`**         | Path to LCOV file for coverage reporting.                         | **false**    | `coverage/lcov.info` |
|                         | Only used when coverage is set to "lcov".                         |              |                      |
| **`codecov-token`**     | Codecov token for private repositories.                           | **false**    | -                    |
|                         | Not required for public repositories when using OIDC.             |              |                      |
| **`github-token`**      | GitHub token for LCOV reporter PR comments.                       | **false**    | -                    |
|                         | Required when coverage is set to "lcov".                          |              |                      |
| **`fail-on-error`**     | Whether to fail the action if tests fail                          | **false**    | `true`               |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**           | **Description**             |
| -------------------- | --------------------------- |
| **`test-exit-code`** | Exit code from the test run |

<!-- outputs:end -->
<!-- examples:start -->
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

Copyright © 2025 Hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

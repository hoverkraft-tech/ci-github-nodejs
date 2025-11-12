<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItcGFja2FnZSIgY29sb3I9ImdyYXktZGFyayI+PGxpbmUgeDE9IjE2LjUiIHkxPSI5LjQiIHgyPSI3LjUiIHkyPSI0LjIxIj48L2xpbmU+PHBhdGggZD0iTTIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M2w3IDRhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2eiI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjMuMjcgNi45NiAxMiAxMi4wMSAyMC43MyA2Ljk2Ij48L3BvbHlsaW5lPjxsaW5lIHgxPSIxMiIgeTE9IjIyLjA4IiB4Mj0iMTIiIHkyPSIxMiI+PC9saW5lPjwvc3ZnPg==) GitHub Action: Build

<div align="center">
  <img src="https://opengraph.githubassets.com/b83a39d0a270998cbae0974683a11eba4481aa44bbb4abbc39522474251c5b0a/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Build" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-build-blue?logo=github-actions)](https://github.com/marketplace/actions/build)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-nodejs)](https://github.com/hoverkraft-tech/ci-github-nodejs/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-nodejs)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Action to build Node.js projects with support for custom commands, environment variables, and artifact handling

<!-- overview:end -->
<!-- usage:start -->

## Usage

````yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/build@db1c1d36ff3e87c4513eded15d85acb78dcbd9b9 # copilot/refactor-ci-actions-lint-test
  with:
    # Working directory where the build commands are executed.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # List of build commands to execute, one per line.
    # These are npm/pnpm/yarn script names (e.g., "build", "compile").
    #
    # This input is required.
    build-commands: ""

    # JSON object of environment variables to set during the build.
    # Example: {"NODE_ENV": "production", "API_URL": "https://api.example.com"}
    #
    # Default: `{}`
    build-env: "{}"

    # Multi-line string of secrets in env format (KEY=VALUE).
    # Example:
    # ```
    # SECRET_KEY=${{ secrets.SECRET_KEY }}
    # API_TOKEN=${{ secrets.API_TOKEN }}
    # ```
    build-secrets: ""

    # JSON object specifying artifact upload configuration.
    # Format: {"name": "artifact-name", "paths": "path1\npath2"}
    build-artifact: ""

    # Whether running in container mode (skips checkout and node setup)
    # Default: `false`
    container: "false"
````

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                         | **Required** | **Default** |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| **`working-directory`** | Working directory where the build commands are executed.                                                                                | **false**    | `.`         |
|                         | Can be absolute or relative to the repository root.                                                                                     |              |             |
| **`build-commands`**    | List of build commands to execute, one per line.                                                                                        | **true**     | -           |
|                         | These are npm/pnpm/Yarn script names (e.g., "build", "compile").                                                                        |              |             |
| **`build-env`**         | JSON object of environment variables to set during the build.                                                                           | **false**    | `\{}`       |
|                         | Example: {"NODE_ENV": "production", "API_URL": "<https://api.example.com"}>                                                             |              |             |
| **`build-secrets`**     | Multi-line string of secrets in env format (KEY=VALUE).                                                                                 | **false**    | -           |
|                         | Example:                                                                                                                                |              |             |
|                         | <!-- textlint-disable --><pre>SECRET_KEY=${{ secrets.SECRET_KEY }}&#13;API_TOKEN=${{ secrets.API_TOKEN }}</pre><!-- textlint-enable --> |              |             |
| **`build-artifact`**    | JSON object specifying artifact upload configuration.                                                                                   | **false**    | -           |
|                         | Format: {"name": "artifact-name", "paths": "path1\npath2"}                                                                              |              |             |
| **`container`**         | Whether running in container mode (skips checkout and node setup)                                                                       | **false**    | `false`     |

<!-- jscpd:ignore-start -->
<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**        | **Description**                                         |
| ----------------- | ------------------------------------------------------- |
| **`artifact-id`** | ID of the uploaded artifact (if artifact was specified) |

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
<!-- jscpd:ignore-end -->

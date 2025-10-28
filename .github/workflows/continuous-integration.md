<!-- header:start -->

# GitHub Reusable Workflow: Node.js Continuous Integration

<div align="center">
  <img src="https://opengraph.githubassets.com/0117dcf638f02d4da90af545ea1cae44cc8215860dbd273d47e78d65b56a6cfa/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Node.js Continuous Integration" />
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

Workflow to performs continuous integration steps agains a Node.js project:

- CodeQL analysis
- Linting
- Build
- Test

### Permissions

- **`contents`**: `read`
- **`security-events`**: `write`
- **`id-token`**: `write`

<!-- overview:end -->

<!-- usage:start -->

## Usage

````yaml
name: Node.js Continuous Integration
on:
  push:
    branches:
      - main
permissions:
  contents: read
  security-events: write
  id-token: write
jobs:
  continuous-integration:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@4d7c1ed87c18493fc4c2dbae4dbde46cf251c9a7 # 0.16.1
    secrets:
      # Secrets to be used during the build step.
      # Must be a multi-line env formatted string.
      # Example:
      # ```txt
      # SECRET_EXAMPLE=$\{{ secrets.SECRET_EXAMPLE }}
      # ```
      build-secrets: ""
    with:
      # Build parameters. Must be a string or a JSON object.
      # For string, provide a list of commands to run during the build step, one per line.
      # For JSON object, provide the following properties:
      #
      # - `commands`: Array of commands to run during the build step.
      # - `env`: Object of environment variables to set during the build step.
      # - `artifact`: String or array of strings specifying paths to artifacts to upload after the build
      #
      # Example:
      # ```json
      # {
      # "commands": [
      # "build",
      # "generate-artifacts"
      # ],
      # "env": {
      # "CUSTOM_ENV_VAR": "value"
      # },
      # "artifact": [
      # "dist/",
      # "packages/package-a/build/"
      # ]
      # }
      # ```
      #
      # Default: `build`
      build: build

      # Optional flag to enable check steps.
      # Default: `true`
      checks: true

      # Optional flag to enable linting.
      # Default: `true`
      lint: true

      # Code QL analysis language. See <https://github.com/github/codeql-action>.
      # Default: `typescript`
      code-ql: typescript

      # Enable dependency review scan. See <https://github.com/actions/dependency-review-action>.
      # Default: `true`
      dependency-review: true

      # Optional flag to enable test.
      # Default: `true`
      test: true

      # Specifify code coverage reporter. Supported values: `codecov`.
      # Default: `codecov`
      coverage: codecov

      # Working directory where the dependencies are installed.
      # Default: `.`
      working-directory: .
````

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**               | **Description**                                                                                                                                                                                                                                                                  | **Required** | **Type**    | **Default**  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | ------------ |
| **`build`**             | Build parameters. Must be a string or a JSON object.                                                                                                                                                                                                                             | **false**    | **string**  | `build`      |
|                         | For string, provide a list of commands to run during the build step, one per line.                                                                                                                                                                                               |              |             |              |
|                         | For JSON object, provide the following properties:                                                                                                                                                                                                                               |              |             |              |
|                         |                                                                                                                                                                                                                                                                                  |              |             |              |
|                         | - `commands`: Array of commands to run during the build step.                                                                                                                                                                                                                    |              |             |              |
|                         | - `env`: Object of environment variables to set during the build step.                                                                                                                                                                                                           |              |             |              |
|                         | - `artifact`: String or array of strings specifying paths to artifacts to upload after the build                                                                                                                                                                                 |              |             |              |
|                         |                                                                                                                                                                                                                                                                                  |              |             |              |
|                         | Example:                                                                                                                                                                                                                                                                         |              |             |              |
|                         | <!-- textlint-disable --><pre lang="json">{&#13; "commands": [&#13; "build",&#13; "generate-artifacts"&#13; ],&#13; "env": {&#13; "CUSTOM_ENV_VAR": "value"&#13; },&#13; "artifact": [&#13; "dist/",&#13; "packages/package-a/build/"&#13; ]&#13;}</pre><!-- textlint-enable --> |              |             |              |
| **`checks`**            | Optional flag to enable check steps.                                                                                                                                                                                                                                             | **false**    | **boolean** | `true`       |
| **`lint`**              | Optional flag to enable linting.                                                                                                                                                                                                                                                 | **false**    | **boolean** | `true`       |
| **`code-ql`**           | Code QL analysis language. See <https://github.com/github/codeql-action>.                                                                                                                                                                                                        | **false**    | **string**  | `typescript` |
| **`dependency-review`** | Enable dependency review scan. See <https://github.com/actions/dependency-review-action>.                                                                                                                                                                                        | **false**    | **boolean** | `true`       |
| **`test`**              | Optional flag to enable test.                                                                                                                                                                                                                                                    | **false**    | **boolean** | `true`       |
| **`coverage`**          | Specifify code coverage reporter. Supported values: `codecov`.                                                                                                                                                                                                                   | **false**    | **string**  | `codecov`    |
| **`working-directory`** | Working directory where the dependencies are installed.                                                                                                                                                                                                                          | **false**    | **string**  | `.`          |

<!-- inputs:end -->

<!-- secrets:start -->

## Secrets

| **Secret**          | **Description**                                                                                                      | **Required** |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------ |
| **`build-secrets`** | Secrets to be used during the build step.                                                                            | **false**    |
|                     | Must be a multi-line env formatted string.                                                                           |              |
|                     | Example:                                                                                                             |              |
|                     | <!-- textlint-disable --><pre lang="txt">SECRET_EXAMPLE=$\{{ secrets.SECRET_EXAMPLE }}</pre><!-- textlint-enable --> |              |

<!-- secrets:end -->

<!-- outputs:start -->
<!-- outputs:end -->

<!-- examples:start -->

## Examples

### Continuous Integration, build and publish

```yaml
name: Continuous Integration - Build and Publish

name: Nodejs Continuous Integration

on:
  push:
    branches: [main]

jobs:
  continuous-integration:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@4d7c1ed87c18493fc4c2dbae4dbde46cf251c9a7 # 0.16.1
    permissions:
      id-token: write
      security-events: write
      contents: read
    with:
      build: |
        {
          "commands": ["build"],
          "artifact": "dist"
        }

  publish:
    needs: continuous-integration
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4.2.2

      - name: Setup NodeJS
        uses: hoverkraft-tech/ci-github-nodejs/actions/setup-node@0.2.2

      - name: Download build artifact
        uses: actions/download-artifact@v2
        with:
          name: build
          path: /

      - name: Publish
        run: |
          npm publish dist
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
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

<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

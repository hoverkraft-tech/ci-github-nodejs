<!-- header:start -->

# GitHub Reusable Workflow: Node.js Continuous Integration

<div align="center">
  <img src="https://opengraph.githubassets.com/289a3c6fdb0dea3dec9358a0e4b263a847ddd65f34d8b7d3a3cdb0910294881f/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Node.js Continuous Integration" />
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

```yaml
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
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@4b87508052fc8b08a44a5d2d7d5f0636deb6ea3e # 0.15.0
    with:
      # Build parameters. Must be a string or a json object.
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
```

<!-- usage:end -->

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**               | **Description**                                                                           | **Required** | **Type**    | **Default**  |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------ | ----------- | ------------ |
| **`build`**             | Build parameters. Must be a string or a json object.                                      | **false**    | **string**  | `build`      |
| **`checks`**            | Optional flag to enable check steps.                                                      | **false**    | **boolean** | `true`       |
| **`lint`**              | Optional flag to enable linting.                                                          | **false**    | **boolean** | `true`       |
| **`code-ql`**           | Code QL analysis language. See <https://github.com/github/codeql-action>.                 | **false**    | **string**  | `typescript` |
| **`dependency-review`** | Enable dependency review scan. See <https://github.com/actions/dependency-review-action>. | **false**    | **boolean** | `true`       |
| **`test`**              | Optional flag to enable test.                                                             | **false**    | **boolean** | `true`       |
| **`coverage`**          | Specifify code coverage reporter. Supported values: `codecov`.                            | **false**    | **string**  | `codecov`    |
| **`working-directory`** | Working directory where the dependencies are installed.                                   | **false**    | **string**  | `.`          |

<!-- inputs:end -->

<!-- secrets:start -->
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
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@4b87508052fc8b08a44a5d2d7d5f0636deb6ea3e # 0.15.0
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

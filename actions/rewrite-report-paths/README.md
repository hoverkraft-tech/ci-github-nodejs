<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItZWRpdCIgY29sb3I9ImJsdWUiPjxwYXRoIGQ9Ik0xMSA0SDRhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDE0YTIgMiAwIDAgMCAyLTJ2LTciPjwvcGF0aD48cGF0aCBkPSJNMTguNSAyLjVhMi4xMjEgMi4xMjEgMCAwIDEgMyAzbC0xMiAxMi0zIDEgMS0zIDEyLTEyeiI+PC9wYXRoPjwvc3ZnPg==) GitHub Action: Rewrite Report Paths

<div align="center">
  <img src="https://opengraph.githubassets.com/50237226ce5d3230f19bbf31d04efd98f21cb2150e9ae4acd09a498440ecde82/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Rewrite Report Paths" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-rewrite--report--paths-blue?logo=github-actions)](https://github.com/marketplace/actions/rewrite-report-paths)
[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-nodejs)](https://github.com/hoverkraft-tech/ci-github-nodejs/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-nodejs)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Rewrites file paths in report files to match repository paths when running in containers.

When running tests or linting in Docker containers, the file paths in generated reports (coverage, lint results, etc.) often reference the container's internal paths (e.g., `/app/src/file.js`). This action rewrites those paths to match the actual repository structure, ensuring that GitHub annotations and coverage reports correctly reference the source files.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/rewrite-report-paths@main
  with:
    # Path or glob pattern for report files to process.
    # Supports multiple files separated by newlines.
    # Common patterns: coverage/**, reports/**, **/*.xml, **/*.json
    #
    # Required: true
    report-files: |
      coverage/cobertura-coverage.xml
      reports/eslint.json

    # Source root path in the container that should be replaced.
    # If not specified, will attempt to auto-detect from file paths.
    # Common values: /app, /workspace, /usr/src/app
    #
    # Default: "" (auto-detect)
    source-root: "/app"

    # Target root path in the repository.
    # Typically this is the GITHUB_WORKSPACE or a subdirectory.
    #
    # Default: GITHUB_WORKSPACE
    target-root: ""

    # Working directory where report files are located.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                         | **Required** | **Default** |
| ----------------------- | ----------------------------------------------------------------------- | ------------ | ----------- |
| **`report-files`**      | Path or glob pattern for report files to process.                       | **true**     | -           |
|                         | Supports multiple files separated by newlines.                          |              |             |
|                         | Common patterns: coverage/\*\*, reports/\*\*, \*\*/\*.xml, \*\*/\*.json |              |             |
| **`source-root`**       | Source root path in the container that should be replaced.              | **false**    | -           |
|                         | If not specified, will attempt to auto-detect from file paths.          |              |             |
| **`target-root`**       | Target root path in the repository.                                     | **false**    | -           |
|                         | Typically this is the GITHUB_WORKSPACE or a subdirectory.               |              |             |
| **`working-directory`** | Working directory where report files are located.                       | **false**    | `.`         |
|                         | Can be absolute or relative to the repository root.                     |              |             |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**            | **Description**                            |
| --------------------- | ------------------------------------------ |
| **`files-processed`** | Number of report files that were processed |
| **`paths-replaced`**  | Total number of paths that were rewritten  |

<!-- outputs:end -->
<!-- examples:start -->

## Examples

### Basic Usage with Auto-Detection

```yaml
- name: Rewrite coverage paths
  uses: hoverkraft-tech/ci-github-nodejs/actions/rewrite-report-paths@main
  with:
    report-files: |
      coverage/cobertura-coverage.xml
      coverage/lcov.info
```

### Explicit Source Root

```yaml
- name: Rewrite report paths
  uses: hoverkraft-tech/ci-github-nodejs/actions/rewrite-report-paths@main
  with:
    report-files: |
      coverage/**/*.xml
      reports/**/*.json
    source-root: "/app"
    target-root: ${{ github.workspace }}
```

### Multiple Report Types

```yaml
- name: Rewrite all report paths
  uses: hoverkraft-tech/ci-github-nodejs/actions/rewrite-report-paths@main
  with:
    report-files: |
      coverage/cobertura-coverage.xml
      reports/eslint.json
      test-results/junit.xml
    source-root: "/workspace"
```

<!-- examples:end -->

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

Copyright © 2025 hoverkraft

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

<!--
// jscpd:ignore-end
-->

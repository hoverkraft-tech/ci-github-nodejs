<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItcGFja2FnZSIgY29sb3I9ImJsdWUiPjxsaW5lIHgxPSIxNi41IiB5MT0iOS40IiB4Mj0iNy41IiB5Mj0iNC4yMSI+PC9saW5lPjxwYXRoIGQ9Ik0yMSAxNlY4YTIgMiAwIDAgMC0xLTEuNzNsLTctNGEyIDIgMCAwIDAtMiAwbC03IDRBMiAyIDAgMCAwIDMgOHY4YTIgMiAwIDAgMCAxIDEuNzNsNyA0YTIgMiAwIDAgMCAyIDBsNy00QTIgMiAwIDAgMCAyMSAxNnoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSIzLjI3IDYuOTYgMTIgMTIuMDEgMjAuNzMgNi45NiI+PC9wb2x5bGluZT48bGluZSB4MT0iMTIiIHkxPSIyMi4wOCIgeDI9IjEyIiB5Mj0iMTIiPjwvbGluZT48L3N2Zz4=) GitHub Action: Package

<div align="center">
  <img src="https://opengraph.githubassets.com/5e6e6522b2be37aede8ce1464ef3152618d5ae56afc61474ac0df95cbf35ec3d/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Package" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Marketplace](https://img.shields.io/badge/Marketplace-package-blue?logo=github-actions)](https://github.com/marketplace/actions/package)
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

Create and upload a package tarball from prepared files, optionally restored from a build artifact.
Check out the project, configure Node.js and its package manager, and prepare dependencies, versions and build output before calling this action.
Uses the project's npm, pnpm or Yarn Classic configuration to select its native pack command.
Packaging never installs dependencies, changes versions or runs lifecycle scripts.

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/package/create@<sha>
  with:
    # Prepared project directory containing the package manager configuration.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # Optional prepared package directory to pack.
    # Can be absolute or relative to `working-directory`.
    # Useful for monorepos with package manager configuration at the root.
    package-directory: ""

    # Optional build artifact ID to download before packaging.
    # When provided, the artifact will be downloaded to the workspace.
    build-artifact-id: ""

    # Optional path to the build artifact contents relative to the workspace root.
    # Used to locate the files to be included in the package when a build artifact is downloaded.
    #
    # Default: `${{ github.workspace }}`
    build-artifact-path: ${{ github.workspace }}

    # Name of the uploaded package tarball artifact
    artifact-name: ""
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**                 | **Description**                                                                             | **Required** | **Default**               |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------ | ------------------------- |
| **`working-directory`**   | Prepared project directory containing the package manager configuration.                    | **false**    | `.`                       |
|                           | Can be absolute or relative to the repository root.                                         |              |                           |
| **`package-directory`**   | Optional prepared package directory to pack.                                                | **false**    | -                         |
|                           | Can be absolute or relative to `working-directory`.                                         |              |                           |
|                           | Useful for monorepos with package manager configuration at the root.                        |              |                           |
| **`build-artifact-id`**   | Optional build artifact ID to download before packaging.                                    | **false**    | -                         |
|                           | When provided, the artifact will be downloaded to the workspace.                            |              |                           |
| **`build-artifact-path`** | Optional path to the build artifact contents relative to the workspace root.                | **false**    | `${{ github.workspace }}` |
|                           | Used to locate the files to be included in the package when a build artifact is downloaded. |              |                           |
| **`artifact-name`**       | Name of the uploaded package tarball artifact                                               | **false**    | -                         |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**                        | **Description**                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------- |
| **`package-tarball-path`**        | Absolute path to the generated package tarball                                    |
| **`package-tarball-artifact-id`** | Artifact ID of the uploaded package tarball (download with skip-decompress: true) |

<!-- outputs:end -->
<!-- examples:start -->

## Examples

Replace `<sha>` with a supported commit containing these action paths.

Use the [Publish action](../publish/README.md) to publish the resulting tarball.

See the [release guide](../../../.github/workflows/release.md) for version planning and GitHub release orchestration.

```yaml
jobs:
  package:
    runs-on: ubuntu-latest
    outputs:
      package-tarball-artifact-id: ${{ steps.package.outputs.package-tarball-artifact-id }}
    steps:
      - id: package
        uses: hoverkraft-tech/ci-github-nodejs/actions/package/create@<sha>

  consume:
    needs: package
    runs-on: ubuntu-latest
    steps:
      - name: Download package tarball by artifact ID
        uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
        with:
          artifact-ids: ${{ needs.package.outputs.package-tarball-artifact-id }}
          skip-decompress: true
```

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

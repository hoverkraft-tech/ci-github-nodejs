<!-- header:start -->

# GitHub Action: Package

---

<!-- header:end -->

## Overview

Action to create and upload an npm package tarball from a Node.js project.

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/package@c9d9d041ba4ef35695ee469c4782fa6a8bbebbcc # 0.21.2
  with:
    # Working directory where the package is packed.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # Optional build artifact ID to download before packaging.
    build-artifact-id: ""

    # Optional version to apply with `npm version` before packaging.
    # The version is applied without creating a git tag.
    version: ""

    # Name of the uploaded package tarball artifact
    # Default: `package-tarball`
    artifact-name: package-tarball
```

## Inputs

| **Input**               | **Description**                                                  | **Required** | **Default**       |
| ----------------------- | ---------------------------------------------------------------- | ------------ | ----------------- |
| **`working-directory`** | Working directory where the package is packed.                   | **false**    | `.`               |
|                         | Can be absolute or relative to the repository root.              |              |                   |
| **`build-artifact-id`** | Optional build artifact ID to download before packaging.         | **false**    | -                 |
|                         | When provided, the artifact will be downloaded to the workspace. |              |                   |
| **`version`**           | Optional version to apply with `npm version` before packaging.   | **false**    | -                 |
|                         | The version is applied without creating a Git tag.               |              |                   |
| **`artifact-name`**     | Name of the uploaded package tarball artifact                    | **false**    | `package-tarball` |

## Outputs

| **Output**                        | **Description**                                |
| --------------------------------- | ---------------------------------------------- |
| **`package-tarball-path`**        | Absolute path to the generated package tarball |
| **`package-tarball-artifact-id`** | Artifact ID of the uploaded package tarball    |

## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md) for more details.

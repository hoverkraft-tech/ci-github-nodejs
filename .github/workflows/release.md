<!-- header:start -->

# GitHub Reusable Workflow: Node.js Release

<div align="center">
  <img src="https://opengraph.githubassets.com/5e6e6522b2be37aede8ce1464ef3152618d5ae56afc61474ac0df95cbf35ec3d/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Node.js Release" />
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

Release a single npm package or fixed-version Lerna workspaces without consumer scripts.

Keep workflow_dispatch and schedule triggers in the calling workflow.
Release Please prepares a release PR; merge it and run again to publish.
Lerna prepares and atomically pushes versions and changelogs directly.
Preparation dispatches the caller workflow at the release tag so building, packaging
and npm provenance all refer to the same committed source.
Keep linting, tests and security analysis in the caller's separate CI workflow.
See [the release guide](../../docs/usage/releases.md) for setup, examples and recovery.

### Permissions

- **`actions`**: `write`
- **`contents`**: `write`
- **`id-token`**: `write`
- **`issues`**: `write`
- **`packages`**: `read`
- **`pull-requests`**: `write`

<!-- overview:end -->
<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**               | **Description**                                                                                                                                                                                                | **Required** | **Type**    | **Default**                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- | -------------------------------------------- |
| **`versioning`**        | Version preparation tool. Use release-please for a single public package or lerna for fixed-version workspaces. Versions are inferred from Conventional Commits.                                               | **false**    | **string**  | `release-please`                             |
| **`working-directory`** | Project directory relative to the caller repository root.                                                                                                                                                      | **false**    | **string**  | `.`                                          |
| **`build`**             | JSON object with commands (script names), artifact (paths or an object with paths), and optional env. Artifacts must include the package's compiled files. Builds the tagged source without running CI checks. | **false**    | **string**  | `{"commands":["build"],"artifact":["dist"]}` |
| **`ai-summary`**        | Generate an OpenAI summary before npm publication. Requires the OPENAI_API_KEY secret; failures stop publication.                                                                                              | **false**    | **boolean** | `false`                                      |
| **`environment`**       | GitHub environment for source preparation, AI and npm publishing. It must permit the default branch and release tags. Configure npm trusted publishing for this environment and the calling workflow.          | **false**    | **string**  | `release`                                    |

<!-- inputs:end -->
<!-- secrets:start -->

## Secrets

| **Secret**           | **Description**                                                                                                     | **Required** |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------ |
| **`OPENAI_API_KEY`** | OpenAI API key, required when ai-summary is enabled.                                                                | **false**    |
| **`github-token`**   | Optional GitHub App token for release PR CI. Defaults to GITHUB_TOKEN; see the guide for its PR event restrictions. | **false**    |

<!-- secrets:end -->
<!-- outputs:start -->

## Outputs

| **Output**              | **Description**                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`status`**            | no-changes, awaiting-review, dispatched, released or published. A dispatched run only prepares the release; follow its tag run for publication. |
| **`tag`**               | Prepared release tag.                                                                                                                           |
| **`release-url`**       | Published GitHub release URL from the tag run.                                                                                                  |
| **`build-artifact-id`** | Release build artifact ID from the tag run, reusable for documentation deployment.                                                              |

<!-- outputs:end -->
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

Copyright © 2026 hoverkraft-tech

For more details, see the [license](http://choosealicense.com/licenses/mit/).

<!-- license:end -->
<!-- generated:start -->

---

This documentation was automatically generated by [CI Dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor).

<!-- generated:end -->

<!-- header:start -->

# GitHub Reusable Workflow: Node.js Release

<div align="center">
  <img src="https://opengraph.githubassets.com/c89abd1b58c683e2ae77a41fcb8cef8b2054b9120306f6d0d6aa1a347afd832b/hoverkraft-tech/ci-github-nodejs" width="60px" align="center" alt="Node.js Release" />
</div>

---

<!-- header:end -->
<!-- badges:start -->

[![Release](https://img.shields.io/github/v/release/hoverkraft-tech/ci-github-nodejs)](https://github.com/hoverkraft-tech/ci-github-nodejs/releases)
[![License](https://img.shields.io/github/license/hoverkraft-tech/ci-github-nodejs)](http://choosealicense.com/licenses/mit/)
[![Stars](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)](https://img.shields.io/github/stars/hoverkraft-tech/ci-github-nodejs?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hoverkraft-tech/ci-github-nodejs/blob/main/CONTRIBUTING.md)
![GitHub Verified Creator](https://img.shields.io/badge/GitHub-Verified%20Creator-4493F8?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJyZ2IoNjgsIDE0NywgMjQ4KSI+CiAgPHBhdGggZD0ibTkuNTg1LjUyLjkyOS42OGMuMTUzLjExMi4zMzEuMTg2LjUxOC4yMTVsMS4xMzguMTc1YTIuNjc4IDIuNjc4IDAgMCAxIDIuMjQgMi4yNGwuMTc0IDEuMTM5Yy4wMjkuMTg3LjEwMy4zNjUuMjE1LjUxOGwuNjguOTI4YTIuNjc3IDIuNjc3IDAgMCAxIDAgMy4xN2wtLjY4LjkyOGExLjE3NCAxLjE3NCAwIDAgMC0uMjE1LjUxOGwtLjE3NSAxLjEzOGEyLjY3OCAyLjY3OCAwIDAgMS0yLjI0MSAyLjI0MWwtMS4xMzguMTc1YTEuMTcgMS4xNyAwIDAgMC0uNTE4LjIxNWwtLjkyOC42OGEyLjY3NyAyLjY3NyAwIDAgMS0zLjE3IDBsLS45MjgtLjY4YTEuMTc0IDEuMTc0IDAgMCAwLS41MTgtLjIxNUwzLjgzIDE0LjQxYTIuNjc4IDIuNjc4IDAgMCAxLTIuMjQtMi4yNGwtLjE3NS0xLjEzOGExLjE3IDEuMTcgMCAwIDAtLjIxNS0uNTE4bC0uNjgtLjkyOGEyLjY3NyAyLjY3NyAwIDAgMSAwLTMuMTdsLjY4LS45MjhjLjExMi0uMTUzLjE4Ni0uMzMxLjIxNS0uNTE4bC4xNzUtMS4xNGEyLjY3OCAyLjY3OCAwIDAgMSAyLjI0LTIuMjRsMS4xMzktLjE3NWMuMTg3LS4wMjkuMzY1LS4xMDMuNTE4LS4yMTVsLjkyOC0uNjhhMi42NzcgMi42NzcgMCAwIDEgMy4xNyAwWk03LjMwMyAxLjcyOGwtLjkyNy42OGEyLjY3IDIuNjcgMCAwIDEtMS4xOC40ODlsLTEuMTM3LjE3NGExLjE3OSAxLjE3OSAwIDAgMC0uOTg3Ljk4N2wtLjE3NCAxLjEzNmEyLjY3NyAyLjY3NyAwIDAgMS0uNDg5IDEuMThsLS42OC45MjhhMS4xOCAxLjE4IDAgMCAwIDAgMS4zOTRsLjY4LjkyN2MuMjU2LjM0OC40MjQuNzUzLjQ4OSAxLjE4bC4xNzQgMS4xMzdjLjA3OC41MDkuNDc4LjkwOS45ODcuOTg3bDEuMTM2LjE3NGEyLjY3IDIuNjcgMCAwIDEgMS4xOC40ODlsLjkyOC42OGMuNDE0LjMwNS45NzkuMzA1IDEuMzk0IDBsLjkyNy0uNjhhMi42NyAyLjY3IDAgMCAxIDEuMTgtLjQ4OWwxLjEzNy0uMTc0YTEuMTggMS4xOCAwIDAgMCAuOTg3LS45ODdsLjE3NC0xLjEzNmEyLjY3IDIuNjcgMCAwIDEgLjQ4OS0xLjE4bC42OC0uOTI4YTEuMTc2IDEuMTc2IDAgMCAwIDAtMS4zOTRsLS42OC0uOTI3YTIuNjg2IDIuNjg2IDAgMCAxLS40ODktMS4xOGwtLjE3NC0xLjEzN2ExLjE3OSAxLjE3OSAwIDAgMC0uOTg3LS45ODdsLTEuMTM2LS4xNzRhMi42NzcgMi42NzcgMCAwIDEtMS4xOC0uNDg5bC0uOTI4LS42OGExLjE3NiAxLjE3NiAwIDAgMC0xLjM5NCAwWk0xMS4yOCA2Ljc4bC0zLjc1IDMuNzVhLjc1Ljc1IDAgMCAxLTEuMDYgMEw0LjcyIDguNzhhLjc1MS43NTEgMCAwIDEgLjAxOC0xLjA0Mi43NTEuNzUxIDAgMCAxIDEuMDQyLS4wMThMNyA4Ljk0bDMuMjItMy4yMmEuNzUxLjc1MSAwIDAgMSAxLjA0Mi4wMTguNzUxLjc1MSAwIDAgMSAuMDE4IDEuMDQyWiI+PC9wYXRoPgo8L3N2Zz4K)

<!-- badges:end -->
<!-- overview:start -->

## Overview

Publish an already validated package tarball without rebuilding, repacking or running tests.
Call after successful package validation at the prepared tag, using an artifact from the same run and commit.

### Permissions

- **`actions`**: `read`
- **`contents`**: `write`
- **`id-token`**: `write`
- **`pull-requests`**: `read`

<!-- overview:end -->

## Release guide

Connect **prepare -> validate -> release**. The caller owns manual and scheduled
triggers and chooses the job that produces and validates the package tarball. The
examples use the shared CI workflow for building, testing and packaging; any job
meeting the artifact requirements can replace it. HoverKraft selects the version
from Conventional Commits. Release publishes the validated tarball and finalizes
the GitHub release, with an optional AI summary. It never builds, repacks or runs
consumer test commands.

[`prepare-package-release.yml`](prepare-package-release.md) updates package versions and lockfiles before building.
The separate [`ci-github-publish` preparation workflow](https://github.com/hoverkraft-tech/ci-github-publish/blob/main/.github/workflows/prepare-release.yml)
manages release labels on pull requests.

## Supported project

Use one public npm package with a stable version and an npm lockfile. Set
`working-directory` to its directory, using the same value for preparation, building and
release. The default is the repository root. The package must have its own lockfile;
workspace roots, selected workspace packages and Lerna projects require a different
pipeline. Use [custom composition](#custom-release-pipelines) for other package layouts,
registries, prereleases, applications or containers.

## Set up

1. Align the committed version, existing tags, GitHub releases and npm versions.
   HoverKraft plans from GitHub release history; the next version must not be older
   than the committed version. Follow the [readiness guide](#establish-the-release-baseline).
2. Configure [npm trusted publishing](../../actions/package/publish/README.md#npm-trusted-publishing)
   for the package, repository and caller workflow filename. Leave npm's environment
   field empty unless opting into a [release environment](#optional-release-environment).
   A new package needs its first version published before configuring its trusted
   publisher. Publication uses GitHub-hosted runners and `id-token: write`.
3. Permit the preparation identity to push release commits and tags under your
   branch and tag rules. For a GitHub App, pass its client ID through the
   `github-app-client-id` input and its private key through the `github-app-key`
   workflow secret. The preparation workflow generates and revokes
   a token scoped to the calling repository, with Actions/Contents write and Pull
   requests read permissions. The App still needs authorization under your rules.
4. Pass `changelog-summary` when enabling [AI summaries](#changelog-summaries).
   A Pages environment needs to permit tags if documentation deployment follows release.
5. Copy the caller below into your repository at `.github/workflows/release.yml`.
   Replace `<sha>` with the same supported `ci-github-nodejs` commit throughout.
   Adapt the schedule, build command and artifact paths to your project.

This example uses the shared CI workflow as the artifact producer:

```yaml
name: Release

on:
  workflow_dispatch:
  schedule:
    - cron: "25 8 * * 1"

permissions: {}

concurrency:
  group: release-${{ github.repository }}
  cancel-in-progress: false

jobs:
  prepare:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/prepare-package-release.yml@<sha>
    permissions:
      actions: write
      contents: write
      pull-requests: read
    with:
      github-app-client-id: ${{ vars.CI_BOT_APP_CLIENT_ID }}
    secrets:
      github-app-key: ${{ secrets.CI_BOT_APP_PRIVATE_KEY }}

  ci:
    needs: prepare
    if: needs.prepare.outputs.status == 'ready'
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@<sha>
    permissions:
      contents: read
      packages: read
      pull-requests: write
      security-events: write
      id-token: write
    with:
      build: '{"commands":["build"],"artifact":["dist"]}'
      package: true

  release:
    needs: [prepare, ci]
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@<sha>
    permissions:
      actions: read
      contents: write
      pull-requests: read
      id-token: write
    with:
      packages: ${{ needs.prepare.outputs.packages }}
      package-tarball-artifact-id: ${{ needs.ci.outputs.package-tarball-artifact-id }}
```

The caller concurrency group serializes the whole pipeline. Keep it distinct from
those used by the reusable workflows. Any package validation job can replace the example's
shared CI job if it meets the [artifact requirements](#build-once-and-test-the-package).
Shared CI wrappers expose `package-tarball-artifact-id` for release and can retain
`build-artifact-id` for documentation or other build outputs. CI has no release
version-planning inputs and does not publish packages.
The `packages` output contains exactly one package for the release workflow.

The caller chooses where to store App credentials and maps them explicitly as shown.
The example uses repository or organization variables and secrets; their names are
not part of the shared workflow's contract. Preparation does not use a GitHub
environment, so environment-scoped credentials are unavailable. A partially
configured App fails before preparation. Without App credentials, omit both mappings to use
`GITHUB_TOKEN` where repository rules allow it.

## Establish the release baseline

Compare the public package's manifest and lockfile version with its published npm
version and the corresponding Git tag and GitHub release. Use the commit that
actually produced the published package as evidence. Do not create a historical tag
on an unrelated current commit, lower an already published version, or overwrite a tag.

The next HoverKraft plan must not be older than the committed version. An equal
plan can release an already-versioned package when its tag does not exist.
Resolve manifest versions ahead of the plan before enabling the schedule: establish
missing releases from verified historical source, or reconcile an unpublished
manifest version in a reviewed change.
Fetch full history; preparation does this automatically. A GitHub release does not
prove npm publication succeeded. Resume its original tag only when that source
contains the caller workflow and supported configuration. Otherwise use a reviewed
recovery pipeline against the immutable source; never guess the published bytes.

For a package that has never been published, establish its first version and matching
release history before enabling trusted publication. The shared workflow deliberately
does not create an npm package or invent a version baseline.

## Authorize preparation

The preparation identity must be allowed to push version commits and release tags.
`contents: write` alone does not bypass repository rules. Preparation requires a
GitHub-verified commit signature; do not remove protections merely to make automation pass.

If rules require a PR, authorize a release identity under those rules. A GitHub App
making a direct version push needs an **Always allow** bypass of the PR rule; a
PR-only bypass is insufficient. Isolate that rule if signatures and other protections
must remain enforced for the App.

## Optional release environment

Release runs without a GitHub environment by default. Omit `environment` or pass
an empty string. No release environment setup is required for npm trusted publishing.

To use environment approvals or deployment restrictions, pass its name through
the release job's `with.environment`, for example `environment: release`. Configure
that environment to permit the release tags. If npm's trusted publisher specifies
an environment, its name must match this input; leave that field empty when using
the default. Callers relying on an environment's protections or secrets must
explicitly pass its name.

## Versions and release notes

HoverKraft selects the next version. npm applies that exact version to the manifest
and lockfile with lifecycle scripts disabled. Release notes and optional AI summaries
are published on GitHub. Preparation does not create or modify `CHANGELOG.md` files.
Repository release configuration is preserved.
Preparation creates version commits through GitHub's API, which signs them for
the authenticated App or bot. It requires GitHub to verify the signature before
atomically pushing the commit and tag, then dispatches the caller at the tag.
An already-committed planned version is accepted when its tag does not exist;
if npm leaves the manifest and lockfile unchanged, preparation tags the existing
commit without creating an empty commit. A no-change plan creates neither. Concurrent branch updates or existing
tag conflicts stop the push; tags are never overwritten.

Stable bare tags, `v`-prefixed tags and directory-slug prefixes are supported.
Version planning, release notes, optional AI summaries and GitHub publication
use `ci-github-publish`; npm only applies the planned version.

## Changelog summaries

The optional `changelog-summary` input and secret accept the complete JSON
configuration supported by
[`ci-github-publish/actions/release/create`](https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/create).
The workflow forwards it unchanged, including `llmAuth`, `llmProvider`, `llmModel`,
`llmConfig`, `workingDirectory` and `summaryTemplate`. Provider support, defaults
and validation belong to that action.

Use the secret for configuration containing credentials. For example, store the
complete JSON as a repository or organization secret named `CHANGELOG_SUMMARY`,
then pass it to the release job:

```yaml
secrets:
  changelog-summary: ${{ secrets.CHANGELOG_SUMMARY }}
```

Alternatively, construct the JSON in that secret mapping using your provider's
credential secret; use `toJSON` when embedding string values. The same-named
workflow input is available for non-sensitive configuration. If both are supplied,
the non-empty secret replaces the entire input; their properties are not merged.
Omit both to keep the full release notes without an AI summary. Invalid configuration
or summary generation failures stop publication. Already published notes are preserved.

## Build once and test the package

Build and pack from the prepared tag because earlier artifacts can embed an old
version. Enable `package: true` on the shared CI workflow to create a tarball,
run optional `package-tests`, and validate it with `npm publish --dry-run`.
The packaging job has read-only repository permissions, no release environment
and no publication credentials. The option is disabled by default for applications
and other projects that do not distribute npm packages. Supplying `package-tests`
without enabling packaging is an error.

Include every generated package file in the build artifact, preserving absolute
paths for the default Ubuntu runner without a build container. Shared CI already
produces this layout. Its packaging job restores those files without rebuilding,
installing project dependencies or running lifecycle hooks. Include files normally
generated by `prepare` or `prepack` in the build. CI packaging does not support
container mode; custom validation jobs can use the standalone package actions.

Dependency installation skips project and dependency lifecycle scripts by default.
If your build needs installation hooks, set `ignore-scripts: false` and configure
any script approvals required by your package manager. Explicit build, lint and
test commands still run. Packaging always disables lifecycle scripts.

Configure consumer checks on **CI**, not on the release workflow:

```yaml
with:
  package: true
  package-tests: |
    test_project=$(mktemp -d)
    npm install --prefix "$test_project" --ignore-scripts "$PACKAGE_TARBALL_PATH"
    "$test_project/node_modules/.bin/my-cli" --help
```

Commands run from `working-directory`; `PACKAGE_TARBALL_PATH`, `PACKAGE_NAME` and
`PACKAGE_VERSION` describe the actual tarball. Install consumer test dependencies
explicitly. Tests must not change the tarball bytes. A failed check or dry run
fails CI, preventing dependent release jobs from starting. A dry run does not
validate npm authentication. Use this same CI configuration on pull requests.

Pass the validated artifact ID through `package-tarball-artifact-id` and require
successful validation through `needs`. Release accepts one raw `.tgz` uploaded
with `archive: false`, verifies its run, source SHA and expiration, and checks its
public package name and version against preparation before publication. It does
not inspect the producing job's identity or infer that tests passed from artifact
existence. Cross-run artifact reuse is unsupported. Custom producers can use any
build layout because release downloads only the finished tarball.

## Run and resume releases

Run the caller from the default branch or wait for its schedule. Preparation reports:

| Status       | Meaning                                              |
| ------------ | ---------------------------------------------------- |
| `no-changes` | No release needed; building and release are skipped. |
| `dispatched` | Follow the new caller run at the prepared tag.       |
| `released`   | This version already has a published GitHub release. |
| `ready`      | The tag run can build, then release.                 |

The release job succeeds only after npm publication and GitHub release assets
succeed. Use `needs.release.result == 'success'` for dependent jobs. Preparation
success alone is not publication.

Rerun a failed release job to reuse the validated tarball without rebuilding,
repacking or repeating consumer tests. Artifact and package identity checks still run.
Every attempt checks npm again. Already published versions are skipped, and their
original tarballs are restored with SHA-512 verification for GitHub assets. Existing
assets must have matching SHA-256 digests. Conflicts, missing digests and expired
package artifacts fail rather than overwriting data or selecting another run.
Published release notes are preserved.

To build again and resume the same version, dispatch the caller at its original tag:

```sh
gh workflow run release.yml --ref v1.2.3
```

A tag run never plans another version. If source needs changing, make a new commit
and release; never move a released tag. Review AI summaries for accuracy.

Documentation deployment remains a separate caller job. Require
`needs.release.result == 'success'` and consume the producer's `build-artifact-id`.
The [`ci-github-publish` Pages action](https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/deploy/github-pages)
deploys and checks the site in one job. Its `github-pages` environment must permit
release tags when deployment follows a tagged release.

## Custom release pipelines

For other layouts, registries or packaging rules, compose the existing actions
while keeping preparation, building and release separate.

### Preparation

Use HoverKraft [`release/plan`](https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/plan)
for version selection. Commit version and lockfile updates before building
the source, especially when compiled files embed the version. Keep the planned
tag fixed throughout the pipeline. The [Node.js preparation action](../../actions/release/prepare/README.md)
handles this for one public npm package and dispatches the caller at the tag.

### Packaging and publication

For a custom package validation job, check out the prepared source tag and configure Node.js
and the package manager before calling the [Package action](../../actions/package/create/README.md).
Prepare the version, dependencies and build files first. The action uses the existing
checkout and never installs dependencies, changes versions or runs lifecycle scripts.
It can pack files already present in the job or restore an optional build artifact.

Package creation selects the native npm, pnpm or Yarn Classic command through
`get-package-manager`, using `package.json.packageManager` before lockfiles.
The command disables lifecycle scripts and writes to an isolated temporary
folder, so packaging does not depend on the manager's console output format.

Include generated files normally produced by `prepare` or `prepack` in that build.

The shared CI packaging job restores build files with `build-artifact-path: /`
on the default Ubuntu runner layout. Standalone Package calls can choose a
different restoration path or omit the build artifact inputs. Run consumer tests
and a publication dry run in this validation job, then pass the tarball artifact
ID to a separate publication job that depends on validation succeeding.

The [Publish action](../../actions/package/publish/README.md) consumes the resulting tarball
artifact ID. A dry run validates `npm publish` inputs but does not prove registry
authentication or trusted publishing. See its
[authentication guide](../../actions/package/publish/README.md#registry-tokens-and-github-packages)
for registries beyond npmjs.org.

Use HoverKraft [`release/create`](https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/create)
to draft notes and optional AI summaries before npm publication. Pass the prepared
tag and source SHA. Set `publish: "false"` until all packages and assets succeed.
Use [`release/update`](https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/update)
to attach assets and publish the draft. Those actions expect ZIP artifacts for release
assets; wrap the raw `.tgz` with `upload-artifact` using its default archive mode.

### Other release products

Node.js CI can build an application, container input or GitHub Action without
publishing an npm library. Keep these consumers on the appropriate
[`ci-github-publish` workflows](https://github.com/hoverkraft-tech/ci-github-publish/tree/main/.github/workflows)
and container tooling. Attach their build artifacts or deployment jobs to the release
caller. Do not introduce an npm package just to use shared release automation.

For custom package checks, [Test package](../../actions/package/test/README.md)
exposes the tarball path and rejects tests that change its bytes. Complete package
checks before publication.

### Recovery

The Publish action supports `recover-existing: "true"` for the public npm registry.
It checks the exact version on every attempt, restores the original registry tarball
when present, skips npm publication, and returns its local path for assets so the
remaining release steps can resume. Registry and integrity errors still fail the job.

Pass that `package-tarball-path` directly to `release/finalize`, with the desired
`.tgz` filename as `asset-name`. Finalization checks the existing asset's digest
and stages the file only if it is missing. Callers do not need to copy the tarball
into a predefined directory.

npm publication across several packages cannot be atomic. Check exact package
versions before retrying; published versions cannot be overwritten. Restore original
published bytes for release assets, verify integrity and existing asset digests, and
upload only missing assets. Do not delete a draft to undo an npm publication.

The [recovery procedure above](#run-and-resume-releases) describes this behavior
for the shared workflow. Custom pipelines own equivalent recovery rules. Keep the
original tag and source identity when finishing a partial release.

## Contributor validation

Unit tests live beside the implementation of each action in
[`actions/package`](../../actions/package) and [`actions/release`](../../actions/release).
Each action with unit tests owns its private `package.json`, lockfile and test
dependencies. Run one action's tests independently, for example:

```sh
npm ci --ignore-scripts --prefix actions/release/prepare
npm test --prefix actions/release/prepare
```

`release/verify/index.test.js` checks release tags and package artifact
run/commit/expiration. `package/restore/PackageRecovery.test.js` checks tarball
manifests, registry integrity and recovery. `release/finalize/index.test.js` checks
asset recovery without overwriting published assets. Each imports its action's
implementation directly, mocking GitHub and registry responses for focused failure
and recovery cases. Package validation and release lookup live in each action
that needs them and are covered by its own tests.

Scripts use the `core`, `exec`, `io` and `glob` helpers provided by
`actions/github-script`. Pass the required helpers into action modules; tests use
the actual toolkit packages declared in that action's `package.json`. Node APIs handle
file contents, hashing and filesystem checks without a toolkit equivalent.

`release/prepare/index.test.js` uses temporary local Git remotes to check staged-file
identity, already-versioned source, signature rejection, tag conflicts and atomic
push rejection after concurrent branch changes. GitHub API responses, including
signature verification, are mocked; these tests do not prove live App signing or
branch-rule authorization.

The [release test workflow](__test-release.yml) is called
by [shared CI](__shared-ci.yml). It runs the unit tests through
the existing Node.js CI workflow in a separate matrix job per action and invokes the actual release actions in separate
Arrange, Act and Assert steps. Integration checks cover private-package rejection,
invalid package artifact IDs, mismatched tarball versions, the unpublished registry output,
installed CLI behavior, failed smoke commands and modified tarball bytes. Assertions
read action outputs and step outcomes; they do not extract scripts from YAML.
An npm publication dry run with `recover-existing` enabled checks that `publish`
correctly composes `package/restore` and preserves unpublished package bytes.
The CI workflow tests exercise optional packaging, installed-package checks and
consuming the validated tarball in a separate job. Publish action tests reject
unexpected package identities before publication.

The [CI workflow integration test](__test-workflow-continuous-integration.yml)
checks real artifact restoration and packaging of prepared files with failing lifecycle hooks
and unavailable dependencies. It verifies the compiled bytes and exercises publication
only as an npm dry run. Release integration tests perform read-only npm lookups; they
never publish npm packages, create GitHub releases or call an LLM provider.

Live GitHub signing, protected-branch pushes and dispatch/retry of the complete
release pipeline require a release-capable test repository. These scenarios are not
covered by the local helper suite or the read-only action checks. A passing unit suite
is not evidence that GitHub workflow conditions, permissions or dispatch wiring work.

Each action test package links its `.node-version` directly to the root runtime file.
[Renovate](../../docs/development/dependency-updates.md) proposes reviewed runtime updates. Run `make lint`
for repository linting. Generate public action/workflow references through CI
Dokumentor. Edit workflow/action metadata for generated reference sections. This
release guide lives outside CI Dokumentor's section markers in this file, which
serves as its template; regeneration preserves that authored content.

<!-- inputs:start -->

## Inputs

### Workflow Call Inputs

| **Input**                         | **Description**                                                                                                                                                                                                         | **Required** | **Type**   | **Default** |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ----------- |
| **`packages`**                    | JSON array containing one public npm package from prepare-package-release.                                                                                                                                              | **true**     | **string** | -           |
| **`package-tarball-artifact-id`** | Validated package tarball artifact ID from this workflow run and the prepared tag's commit. Upload one raw .tgz with archive: false. The caller must depend on successful validation; any job can produce the artifact. | **true**     | **string** | -           |
| **`working-directory`**           | Project directory relative to the caller repository root, matching release preparation.                                                                                                                                 | **false**    | **string** | `.`         |
| **`changelog-summary`**           | Optional JSON configuration forwarded unchanged to ci-github-publish/actions/release/create.                                                                                                                            | **false**    | **string** | -           |
|                                   | Supports all upstream summary options. Use the changelog-summary secret when the configuration contains credentials.                                                                                                    |              |            |             |
|                                   | A non-empty secret overrides this input; omit both to disable summarization. Summary failures stop publication.                                                                                                         |              |            |             |
|                                   | See <https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/create>.                                                                                                                            |              |            |             |
| **`environment`**                 | Optional GitHub environment for release jobs. Leave empty to run without an environment. When set, its protection rules apply; use the same name if restricting npm trusted publishing to an environment.               | **false**    | **string** | -           |

<!-- inputs:end -->
<!-- secrets:start -->

## Secrets

| **Secret**              | **Description**                                                                                                                                                                             | **Required** |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **`changelog-summary`** | Optional complete JSON summary configuration, including provider credentials. Overrides the changelog-summary input and is forwarded unchanged to ci-github-publish/actions/release/create. | **false**    |

<!-- secrets:end -->
<!-- outputs:start -->
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
<!-- usage:start -->

## Usage

```yaml
name: Node.js Release
on:
  push:
    branches:
      - main
permissions: {}
jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@97f64bc080b78daca8fb3ece49de448aaac83429 # 1.1.0
    permissions:
      actions: read
      contents: write
      id-token: write
      pull-requests: read
    secrets:
      # Optional complete JSON summary configuration, including provider credentials. Overrides the changelog-summary input and is forwarded unchanged to ci-github-publish/actions/release/create.
      changelog-summary: ""
    with:
      # JSON array containing one public npm package from prepare-package-release.
      # This input is required.
      packages: ""

      # Validated package tarball artifact ID from this workflow run and the prepared tag's commit. Upload one raw .tgz with archive: false. The caller must depend on successful validation; any job can produce the artifact.
      #
      # This input is required.
      package-tarball-artifact-id: ""

      # Project directory relative to the caller repository root, matching release preparation.
      # Default: `.`
      working-directory: .

      # Optional JSON configuration forwarded unchanged to ci-github-publish/actions/release/create.
      # Supports all upstream summary options. Use the changelog-summary secret when the configuration contains credentials.
      # A non-empty secret overrides this input; omit both to disable summarization. Summary failures stop publication.
      # See https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/create.
      changelog-summary: ""

      # Optional GitHub environment for release jobs. Leave empty to run without an environment. When set, its protection rules apply; use the same name if restricting npm trusted publishing to an environment.
      environment: ""
```

<!-- usage:end -->
<!-- examples:start -->
<!-- examples:end -->

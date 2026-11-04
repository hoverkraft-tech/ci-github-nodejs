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

Package an existing build artifact and publish a Node.js release without rebuilding.
Call at the prepared tag with a build artifact from the same workflow run and commit.

### Permissions

- **`actions`**: `read`
- **`contents`**: `write`
- **`id-token`**: `write`
- **`pull-requests`**: `read`

<!-- overview:end -->

## Release guide

Connect **prepare → build → release**. The caller owns manual and scheduled triggers
and chooses the job that produces the build artifact. The examples use the shared
CI workflow for building and testing; any job meeting the artifact requirements can
replace it. HoverKraft selects the version from Conventional Commits and generates
GitHub release notes. The release workflow packages the build output, tests the
tarball, publishes to npm and finalizes the GitHub release, with an optional AI summary. Consumers need no custom release scripts.

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

  build:
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

  release:
    needs: [prepare, build]
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@<sha>
    permissions:
      actions: read
      contents: write
      pull-requests: read
      id-token: write
    with:
      packages: ${{ needs.prepare.outputs.packages }}
      build-artifact-id: ${{ needs.build.outputs.build-artifact-id }}
```

The caller concurrency group serializes the whole pipeline. Keep it distinct from
those used by the reusable workflows. Any build producer can replace the example's
shared CI job if it meets the [artifact requirements](#build-once-and-test-the-package).
Shared CI wrappers can expose `build-artifact-id`; CI has no release package inputs.
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

Build from the prepared tag because artifacts built earlier can embed an old
version. Include every generated package file in the artifact and preserve absolute
paths for the **default Ubuntu runner without a build container**. The shared CI
workflow already produces this layout; custom build jobs must provide the same
layout. Release verifies the artifact's run, source SHA and expiration, without
inspecting the producing job's name or workflow. Wire `needs` to the artifact
producer and any checks required by your project. Cross-run artifact reuse is unsupported.
Include generated declarations, static files copied into package output and any
needed documentation output. Remove npm publication from push CI when enabling
this manual and scheduled release caller.

Dependency installation skips project and dependency lifecycle scripts by default.
If your build needs installation hooks, set `ignore-scripts: false` on the build
workflow or action and configure any script approvals required by your package
manager. Explicit build, lint and test commands still run. Preparation and
release packaging always disable lifecycle scripts; this opt-in cannot enable them.

Release configures Node.js and calls [Package](../../actions/package/create/README.md)
to restore the build output and run `npm pack` without installing dependencies,
changing versions or running lifecycle hooks. Include files normally generated by
`prepare` or `prepack` in the build artifact. The tarball manifest must match the
expected public package and version.

Use `package-tests` for installed-package checks. Commands run from
`working-directory` with `PACKAGE_TARBALL_PATH`, `PACKAGE_NAME` and `PACKAGE_VERSION`:

```yaml
with:
  package-tests: |
    test_project=$(mktemp -d)
    npm install --prefix "$test_project" --ignore-scripts "$PACKAGE_TARBALL_PATH"
    "$test_project/node_modules/.bin/my-cli" --help
```

Install test dependencies explicitly. Tests may build a fixture consuming the package,
but must not change the release tarball. Package tests, `npm publish --dry-run` and
optional AI summaries all finish before npm publication. A dry run does not validate
npm authentication.

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

Rerun a failed release job to reuse the existing build artifact and repeat validation.
Every attempt checks npm again. Already published versions are skipped, and their
original tarballs are restored with SHA-512 verification for GitHub assets. Existing
assets must have matching SHA-256 digests. Conflicts, missing digests and expired
build artifacts fail rather than overwriting data or selecting another run.
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

For a custom release job, check out the prepared source tag and configure Node.js
and the package manager before calling the [Package action](../../actions/package/create/README.md).
Prepare the version, dependencies and build files first. The action uses the existing
checkout and never installs dependencies, changes versions or runs lifecycle scripts.
It can pack files already present in the job or restore an optional build artifact.

Package creation selects the native npm, pnpm or Yarn Classic command through
`get-package-manager`, using `package.json.packageManager` before lockfiles.
The command disables lifecycle scripts and writes to an isolated temporary
folder, so packaging does not depend on the manager's console output format.

Include generated files normally produced by `prepare` or `prepack` in that build.

The shared release workflow requires absolute artifact paths and restores them with
`build-artifact-path: /` on the default Ubuntu runner layout. The shared CI workflow
produces that layout; a custom producer must preserve the same paths. Standalone
Package calls can choose a different restoration path or omit the artifact inputs.

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

For custom package checks, [Test release package](../../actions/package/test/README.md)
exposes the tarball path and rejects tests that change its bytes. Complete package
checks before publication.

### Recovery

The Publish action supports `skip-existing: "true"` for the public npm registry.
It checks the exact version on every attempt, restores the original registry tarball
when present, and returns its local path for assets.

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

`release/verify/index.test.js` checks release tags and build artifact
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
invalid artifact IDs, mismatched tarball versions, the unpublished registry output,
installed CLI behavior, failed smoke commands and modified tarball bytes. Assertions
read action outputs and step outcomes; they do not extract scripts from YAML.
An npm publication dry run with `skip-existing` enabled checks that `publish`
correctly composes `package/restore` and preserves unpublished package bytes.

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

| **Input**               | **Description**                                                                                                                                                                                                                             | **Required** | **Type**   | **Default** |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ----------- |
| **`packages`**          | JSON array containing one public npm package from prepare-package-release.                                                                                                                                                                  | **true**     | **string** | -           |
| **`build-artifact-id`** | Build artifact ID from this workflow run and the prepared tag's commit. The artifact must be unexpired and contain every generated package file with absolute paths preserved for the default Ubuntu runner layout. Any job can produce it. | **true**     | **string** | -           |
| **`working-directory`** | Project directory relative to the caller repository root, matching release preparation and the build artifact's source directory.                                                                                                           | **false**    | **string** | `.`         |
| **`package-tests`**     | Shell commands testing the tarball before publication. Runs from working-directory with PACKAGE_TARBALL_PATH, PACKAGE_NAME and PACKAGE_VERSION.                                                                                             | **false**    | **string** | -           |
| **`changelog-summary`** | Optional JSON configuration forwarded unchanged to ci-github-publish/actions/release/create.                                                                                                                                                | **false**    | **string** | -           |
|                         | Supports all upstream summary options. Use the changelog-summary secret when the configuration contains credentials.                                                                                                                        |              |            |             |
|                         | A non-empty secret overrides this input; omit both to disable summarization. Summary failures stop publication.                                                                                                                             |              |            |             |
|                         | See <https://github.com/hoverkraft-tech/ci-github-publish/tree/main/actions/release/create>.                                                                                                                                                |              |            |             |
| **`environment`**       | Optional GitHub environment for release jobs. Leave empty to run without an environment. When set, its protection rules apply; use the same name if restricting npm trusted publishing to an environment.                                   | **false**    | **string** | -           |

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

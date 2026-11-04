# ADR 0001: Shared Node.js release orchestration

- Status: accepted
- Initial decision: 2026-10-29
- Consolidated: 2026-11-03

## Context

The Package and Publish actions handle individual tarballs. Consumers still need
version preparation, CI on the versioned source, release notes and recovery from
partial publication. Reactionable initially supplied custom scripts for those
responsibilities, while reactionable-cli used Release Please. HoverKraft already
provides Conventional Commit release planning and GitHub publication actions.

Consumers need one shared release composition with clear ownership: preparation
changes versions, CI builds, packages and tests, and release publishes. Build
output can embed a version, so CI must run after the version commit. Consumers
should configure their existing commands and permissions without writing release
orchestration scripts.

## Decision

### Composition and delivery scope

Expose **prepare -> validate -> release** as separate stages connected by the caller
through `needs`. Use the shared CI workflow as the recommended package validation producer,
while accepting any job that supplies the required artifact. Consumers own manual and scheduled triggers, CI policy,
credentials, environment rules and optional documentation deployment. Keep the
individual actions available for custom composition.

Release has no GitHub environment by default. Callers may pass `environment` to
apply environment approvals, secrets and deployment restrictions. An npm trusted
publisher's optional environment restriction must match that input when configured.

The reusable preparation workflow owns GitHub App token creation and cleanup. It
accepts a `github-app-client-id` input and `github-app-key` workflow secret,
requesting only the current repository and required permissions. Preparation has
no environment binding or implicit variable lookup; callers map their credential
names explicitly. Without App credentials, use `GITHUB_TOKEN`. Consumers do not need
a token-generation job or duplicated preparation steps.

Preparation exposes only the changing `status` and `packages` needed by callers.
Release uses the native job result for dependent jobs; it has no constant success
output or unused tag/URL outputs. Verification validates the supplied package list
without returning a second copy. Finalization uses `GITHUB_TOKEN` and the shared
`RUNNER_TEMP/release-assets` directory rather than accepting unused overrides.

[PR #562](https://github.com/hoverkraft-tech/ci-github-nodejs/pull/562) delivers the
common case: one public npm package with its own lockfile and one sequential release
job. Unsupported layouts fail early. Workspace selection, fixed/independent Lerna,
per-package notes and matrix recovery are delivered separately in
[PR #563](https://github.com/hoverkraft-tech/ci-github-nodejs/pull/563), extending this
same record and workflow composition. The common release tests need only Node.js
and npm; specialized tool dependencies belong to the extension.

Name the source preparation workflow `prepare-package-release.yml` to distinguish
it from `ci-github-publish/prepare-release.yml`, which manages pull request labels.
Keep orchestration visible in action steps and short scripts inline. Each action
owns its substantial JavaScript implementation and colocated tests: verification
belongs to `release/verify`, npm recovery to `package/restore`, and asset handling to
`release/finalize`. `package/publish` reuses the `package/restore` action. Share only package/tag
rules and GitHub release lookup, which have multiple consumers. Specialized
package preparation belongs to `prepare` in the workspace extension.

### Version preparation and release notes

Use the public `ci-github-publish/release/plan` action as the version authority for
the common release. npm applies the exact planned stable version to the manifest
and lockfile with lifecycle scripts disabled. Accept bare, `v`-prefixed and
directory-scoped tags. Reject older versions, conflicting tags and inconsistent
release history instead of calculating another version locally. Allow an already-
committed planned version when its release tag does not exist.

Create version commits through GitHub's API without custom author, committer or
signature fields, so GitHub signs them for the authenticated App or bot. Require
a verified signature, fetch the commit and atomically push it with the tag.
Check the expected branch head with an explicit lease to reject concurrent changes.
If version application leaves no changes, tag the existing source without an empty
commit. Dispatch the caller at that tag.
A no-change plan creates neither. The tag run starts building and publication without
planning again. This gives checkout, compiled output, source archives and provenance
the same committed identity. A concurrent branch update fails the atomic push.
The preparation identity must satisfy branch and tag rules; preparation neither
creates release PRs nor bypasses protections.

Keep release notes on GitHub. Preparation never creates or modifies `CHANGELOG.md`,
including existing files. Use `release/create` for the draft and optional AI summary,
and `release/update` for missing assets and final publication. Preserve caller release
configuration and published release notes. Do not use Release Please or the internal
`release/prepare` helper for source changelog rendering.

Expose upstream summary configuration through a `changelog-summary` workflow input
and secret. A non-empty secret takes precedence; forward the complete value unchanged
to `release/create`. Let that action own provider support, defaults and validation.
An empty configuration disables summaries. Do not add provider-specific credentials
or an enablement flag to the Node.js workflow.

### Build artifacts and packaging

Preparation commits versions before validation. CI builds, runs source tests,
packs the distributable and optionally runs consumer checks against that tarball.
The existing CI workflow adds an opt-in `package` job and a
`package-tarball-artifact-id` output. General applications keep packaging disabled.
`package-tests` belongs to CI and has no publication credentials or environment.
It derives package identity from the tarball and rejects changes to its bytes.
A publication dry run also runs in CI. The standard packaging job supports the
non-container Ubuntu artifact layout; custom producers can compose the actions.

Release consumes the resulting tarball artifact without inspecting the producing
job's identity. Callers require successful validation through `needs`; artifact
metadata alone cannot prove that checks passed. Release verifies that the artifact
is unexpired and belongs to the same run and prepared source SHA, and checks its
name and version against preparation. It never rebuilds, repacks or executes
caller-provided tests. Optional AI summaries finish before npm publication.

Package creation uses native manager commands with lifecycle scripts disabled.
Files normally generated by `prepare` or `prepack` must be produced before packing.
A retry reuses the validated artifact, or recovers the original npm bytes when the
version is already published. Source version, tested package and published package
remain aligned.

### Publication and recovery

Serialize the whole pipeline in the caller, with distinct reusable-workflow
concurrency groups. Publication checks npm on every attempt. If a version is already
published, restore its original registry tarball and verify its SHA-512 integrity.
Verify SHA-256 digests for existing GitHub assets and stage only missing assets for
`release/update`; conflicting assets or missing digests fail without overwrites.

A failed publication-job rerun reuses the validated package artifact from the same run. A new
dispatch at the original tag rebuilds and resumes that version. Expired artifacts
fail explicitly; cross-run lookup and CI polling are excluded. Preparation success
is separate from publication success, and a tag can remain after a later failure.
Documentation deployment stays in a separate caller job after successful publication,
using the build artifact.

### Runtime maintenance

Use the root `.node-version` as the fixture runtime authority. Fixture version files
are symlinks; `.nvmrc` tests and runtime assertions read the same value. Keep a
compatible explicit version rather than independent fixture pins.

Adopt scheduled/manual Renovate with CI GitHub App authentication following the
[ci-github-common workflow](https://github.com/hoverkraft-tech/ci-github-common/blob/fb0cdfb5418de834dcb8c3abba33182aa92062c5/.github/workflows/__renovate.yml).
Dependabot remains the primary updater. Renovate handles `docker://` action
references and the root `.node-version` through its native nodenv manager. Runtime
updates require review and passing CI, without automerge. Configuration and operation
are documented in the [dependency update guide](../development/dependency-updates.md).

## Consequences

Consumers need no custom release scripts, but must align committed versions, tags,
GitHub releases and npm history, authorize preparation pushes, configure npm trusted
publishing and allow release tags in their environments. The shared workflows cannot
repair inconsistent history or grant permissions; see the
[readiness guide](../../.github/workflows/release.md#establish-the-release-baseline).

Support stable public npm packages on GitHub.com and npmjs.org with the default
GitHub-hosted Ubuntu layout for the optional CI packaging job, without a build container. Custom registries,
prereleases and other release products remain custom compositions. Absolute build
paths constrain artifact restoration to that supported runner layout.

The release workflow preserves successful publication when a later step fails.
Review AI summaries for accuracy. The [release guide](../../.github/workflows/release.md) describes
operation and recovery; the [validation guide](../../.github/workflows/release.md#contributor-validation)
describes local tests and GitHub integration checks. These tests do not perform live
npm/GitHub publication or AI generation.

## Decision history and dated evidence

This record consolidates the original release ADRs. The decisions above are current;
the alternatives and observations below preserve their history, not new validation.

- **2026-10-29:** The initial design coupled CI to release, used Release Please for
  a single package and native fixed Lerna preparation for workspaces. The release
  guide at commit `b7eadcff0bdbd690f4688e7ce3f31d7ba0e39865` established committing
  versions before building and targeted recovery. The removed 0.25 publish workflow
  was not restored: the new composition covers preparation and the release lifecycle.
- **2026-10-31:** CI policy was separated from publication. Release Please's PR
  lifecycle was replaced with HoverKraft planning and atomic version/tag pushes;
  the upstream review used `ci-github-publish` 1.0.3 at commit
  `ea6682de88070c254dac619a6623a242a6d57cd3`. An intermediate design kept compilation
  in release, then moved compilation and packaging into CI to bind checked artifacts
  to the prepared source. The artifact identity and retry contracts were retained.
- **2026-11-02:** Packaging moved back to release while compilation stayed in CI,
  removing release-specific package inputs from CI. The
  [npm pack lifecycle documentation](https://docs.npmjs.com/cli/v11/commands/npm-pack/#ignore-scripts)
  informed disabling packaging hooks; fixtures with failing hooks and unavailable
  dependencies were used to detect accidental builds or installs.
- **2026-11-03:** Delivery was split into the common package and workspace extension.
  Source changelog generation was removed, eliminating the internal HoverKraft notes
  renderer and retaining GitHub release notes. Per-fixture runtime pins introduced
  for Gatsby compatibility were replaced with the shared root version and reviewed
  Renovate updates. The compatibility finding at that time was Gatsby's exclusion
  of Node 26; it is historical evidence, not a permanent runtime constraint.

- **2026-11-03, consumer validation:** The CLI planned `1.3.0`, already committed
  but unpublished, and required signed commits on its default branch. This
  supersedes rejection of equal versions and local unsigned release commits:
  accept equal plans without empty commits, and use verified GitHub API bot
  commits before the existing atomic push. App installation and branch-rule
  authorization remain consumer responsibilities. Local Git-remote tests cover
  atomic failure behavior; live App authentication requires configured credentials.
- **2026-11-03, consumer authentication:** Keep version commits on the default
  branch so the manifest and release tag remain aligned. The consumer uses an
  authorized GitHub App; token creation moves into the reusable preparation
  workflow to keep the caller declarative. Tag-only version commits and automated
  version-update PRs were considered but not adopted.
- **2026-11-03, preparation interface:** Explicit `github-app-client-id` and
  `github-app-key` parameters supersede the initial implicit `CI_BOT_APP_CLIENT_ID`
  lookup and environment-bound preparation credentials. Use the same parameter
  names as `ci-github-publish/release-actions.yml`. Consumers own credential storage;
  publication retains its environment for npm trusted publishing.
- **2026-11-03, summary configuration:** Pass upstream `changelog-summary` JSON
  through unchanged, superseding the initial OpenAI-only `ai-summary` flag and
  `OPENAI_API_KEY` workflow secret. Callers select their provider and its options;
  the same-named workflow secret takes precedence over the input.
- **2026-11-03, artifact producer contract:** Release accepts a build artifact from
  any job meeting its run, commit, expiration and path requirements. This supersedes
  wording that required a CI job. Shared CI remains a recommended producer; callers
  choose their build job and checks. Artifact verification behavior is unchanged.
- **2026-11-03, optional release environment:** An empty `environment` default
  supersedes the automatic `release` binding. npm trusted publishing does not
  require an environment; callers explicitly select one when they need its
  protections or secrets. Existing callers with an explicit environment retain it.
- **2026-11-03, interface audit:** Traced the changed manifests through their
  implementation, workflow/action callers, authored examples and the CLI consumer.
  Generated usage examples were excluded as evidence of a real caller. Removed
  unconsumed preparation tag/published outputs, the unused preparation token
  override, constant release status and unused tag/URL outputs, verification's
  pass-through package/tag outputs, and finalization's fixed directory/token
  parameters. The setup-node package-manager output belongs only to the workspace
  extension, where packaging selects npm or pnpm.
  `prebuilt`, `skip-existing`, installation/script flags and smoke commands have
  distinct execution paths. The requested environment and summary interfaces are
  retained. Existing standalone Package `version` and Publish `registry-url` and
  `github-token` have no non-default caller in the inspected repository; this is
  limited usage evidence, not proof that their published interfaces are unused
  downstream. Project-directory options remain part of supported nested projects.
- **2026-11-04, package action grouping:** Group tarball operations under
  `actions/package/create`, `publish`, `restore` and `test`. This intentionally
  replaces `actions/package`, `actions/publish`, `actions/release/restore-package`
  and `actions/release/test-package` without compatibility aliases. Release
  orchestration stays under `actions/release`. Move the existing private test
  package to `actions/` so Node's test discovery covers both groups, with tests
  remaining beside their implementations and the runtime linked to `.node-version`.
- **2026-11-04, installation script policy:** Default `ignore-scripts` to true in
  setup, build, lint, test, package creation and the reusable CI workflow. Consumers
  can opt in to installation hooks with false, subject to package-manager approval
  settings. This is an intentional breaking default for projects relying on those
  hooks. Explicit commands and ordinary version/pack hooks retain their behavior;
  preparation and prebuilt packaging keep scripts disabled regardless of the opt-in.
- **2026-11-04, GitHub Script helpers:** Use the `core`, `exec`, `io` and `glob`
  helpers supplied by `actions/github-script` for workflow logging, commands,
  file operations and discovery. Pass the required helpers explicitly to action
  modules. Preserve binary Git blobs through exec's buffer listeners and stage
  the exact bytes verified for release assets. Node APIs remain for file contents,
  hashing and filesystem checks without a toolkit equivalent. Direct tests use
  the real exec/glob toolkit packages as development dependencies; the actions
  continue using GitHub Script's bundled helpers without a runtime install.
- **2026-11-04, standalone actions:** Each tested action owns its private test
  manifest, lockfile and dependencies. This supersedes the shared `actions/` test
  package introduced by package action grouping. Keep package validation and
  release lookup inside each consuming action, accepting small local duplication
  to avoid imports from parent or sibling action directories. Tests run separately
  per action; workspace tools belong only to preparation in the workspace extension.
  Per-action runtime symlinks still point directly to the root `.node-version`.
- **2026-11-04, package creation responsibility:** Package prepared files with
  lifecycle scripts disabled. Remove the `prebuilt`, `version` and `ignore-scripts`
  inputs from `package/create`, along with checkout and runtime/dependency setup.
  This supersedes its ordinary/prebuilt mode split and version override. Callers
  check out the intended source and configure tooling before packaging; pnpm
  workspace linking belongs to the release workflow. Artifact restoration remains
  optional, so local build output is preserved and can be packed in the same job.
- **2026-11-04, native packaging commands:** `get-package-manager` provides a
  `pack-command` output for npm, pnpm and Yarn Classic, with lifecycle scripts
  disabled. The Bash command receives its output directory through the quoted
  `PACK_DESTINATION` environment variable. `package/create` runs that command
  through GitHub Script's `exec` helper, discovers one tarball in an isolated
  temporary folder and cleans the folder on success or failure. This replaces
  npm-only packing and manager-specific console-output parsing without adding
  package-manager selection inputs or a shared JavaScript module. Modern Yarn
  packing is outside this script-free contract because its pack hooks cannot be
  disabled through the Classic command's flags.

- **2026-11-04, CI package validation:** Supersede the earlier decision to pack and
  test inside publication. Package creation, consumer checks and publication dry
  runs now belong to an optional CI job. Release accepts its tarball artifact and
  retains source/identity checks and retry recovery. This avoids testing a
  different package from the one published and removes consumer commands from
  the job with publication credentials. The PR CI entry point remains unchanged.
- **2026-11-04, recovery input naming:** Rename Publish's `skip-existing` input to
  `recover-existing` to describe restoring original registry bytes when resuming a
  release. Keep the default false for standalone publication and enable recovery
  in release workflows. Registry and integrity failures remain errors.
- **2026-11-04, explicit release asset handoff:** Pass the published or recovered
  tarball path and its asset name directly to finalization. This supersedes the
  implicit `RUNNER_TEMP/release-assets` contract and the workflow's extra copy.
  Finalization stages missing bytes once, preserving digest checks on retries.

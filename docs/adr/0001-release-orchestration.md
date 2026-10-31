# ADR 0001: Shared Node.js release orchestration

- Status: accepted
- Date: 2026-10-29

The decision to run CI inside release is superseded by
[ADR 0002](0002-separate-ci-from-release.md). The other decisions remain accepted.

## Context

The Package and Publish actions handle a single tarball. Consumers still need
to prepare versions, select workspaces, start CI at the versioned source and
recover partial releases. Reactionable's first integration added custom scripts
for those responsibilities. A single-package consumer, reactionable-cli, uses
Release Please and has a different source preparation policy.

The Node.js release guide at commit
`b7eadcff0bdbd690f4688e7ce3f31d7ba0e39865` documents composition of the actions,
including committing versions before building and targeted recovery. The former
reusable publish workflow was removed in 0.25; the new workflow covers source
preparation and the complete release lifecycle instead of restoring that interface.

## Decision

Provide an optional reusable Release workflow, retaining the composable actions.
Consumers own triggers, build options, credentials, environment rules and optional
documentation deployment. HoverKraft owns preparation, publication and recovery.

Support one public package through Release Please and fixed-version workspaces
through the consumer's installed Lerna. Keep preparation policies explicit:
Release Please requires a merged release PR; Lerna pushes versions directly.
Both infer versions from Conventional Commits without a user-supplied version.

Use Release Please's PR creation action with GitHub release creation disabled.
Detect merged pending release PRs explicitly, tag their merge commits and mark
them released only after npm and GitHub publication succeed. Release Please v5.0.0
was verified on the decision date; its breaking change is the Node 24 runtime.

Dispatch the caller workflow at the resulting tag using `GITHUB_TOKEN` or an
explicit token. The Package action performs its own checkout, so starting a new
run ensures CI, package manifests, source archives and provenance use that commit.
The workflow serializes both runs and reports when publication has been dispatched.

Preserve successful npm publishes on retry. Restore their original tarballs,
verify registry integrity and never replace conflicting GitHub assets. Keep
published release notes intact. Reuse the existing release create/update actions
for AI notes and final publication. Do not introduce a second SemVer engine.

## Consequences

Consumers need no release scripts. The single-package path retains a review step;
the Lerna path requires branch rules that permit its atomic push. An app token is
needed when release PR creation must trigger normal PR CI. Neither mode bypasses
repository protection rules.

Preparation success and publication success belong to separate runs. A tag can
remain after CI or service failure, and npm publication is not atomic across
packages. Recovery operates on the original tag and package versions.

The initial scope is stable public npm packages on GitHub.com hosted Linux
runners. Independent workspace versions, custom registries and prereleases remain
available through custom composition. New consumer pins require the upstream
workflow implementation to be available on GitHub.

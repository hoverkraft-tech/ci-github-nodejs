# ADR 0003: Use HoverKraft release actions for planning and publication

- Status: accepted
- Date: 2026-10-31
- Partially supersedes: [ADR 0001](0001-release-orchestration.md)

## Context

Release Please added a separate release policy and PR lifecycle for single
packages. Lerna independently selected monorepo versions. HoverKraft already
provides shared release planning, changelog rendering, AI notes and publication.

The `ci-github-publish` stable release 1.0.3, commit
`ea6682de88070c254dac619a6623a242a6d57cd3`, was checked on this date.
Its `release/plan` returns change detection and the planned tag. Its internal
`release/prepare` helper can render notes for an explicit tag without writing a
release. `release/update` uploads provided assets without overwriting existing
names and publishes only after those uploads succeed.

## Decision

Use `release/plan` as the version authority for both single packages and Lerna
workspaces. Keep npm and Lerna as tools that apply the exact planned version to
manifests and lockfiles. Lerna also maintains workspace dependencies and package
changelogs. Remove Release Please, release PR detection and its pending labels.

Use `release/get-configuration` and the pinned `release/prepare` helper in dry-run
mode to render the planned changelog before committing source files. This is the
one direct use of the internal helper: the public planner's outputs do not expose
the rendered notes. Pass the planned tag explicitly; do not calculate a second
release identity. Preserve older root changelog entries.

Push the version commit and tag atomically in both modes. Retain explicit tag
dispatch, build and npm publication. Use `release/create` for the draft and its
optional AI summary. Verify existing asset digests and stage only missing files;
let `release/update` upload those files and publish the draft.

## Consequences

Manual and scheduled releases share the same preparation policy. Both require
branch rules permitting the release commit. Neither mode creates or auto-merges
a release PR. CI remains independent as decided in ADR 0002.

Root changelogs and release notes use HoverKraft's configuration. The initial
interface supports stable bare, v-prefixed and directory-scoped version tags.
Existing release history must be consistent with committed versions. Older or
equal plans, existing tags and concurrent branch updates stop preparation.

Retries use the original tag without planning again. Already published npm bytes
and GitHub assets remain protected. No additional release planner or npm runtime
dependency is introduced by the Node.js workflow.

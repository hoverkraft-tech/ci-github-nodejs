# ADR 0004: CI produces the artifacts consumed by release

- Status: accepted
- Date: 2026-10-31
- Partially supersedes: [ADR 0002](0002-separate-ci-from-release.md) and
  [ADR 0003](0003-hoverkraft-release-actions.md)

## Context

ADR 0002 separated validation from publication but left compilation and packaging
inside release. This duplicated build ownership and did not prove that CI checked
the generated version commit. Artifacts from before version preparation can embed
an old version, so simply reusing the preceding branch build is insufficient.

## Decision

Expose preparation and publication as separate reusable workflows. The caller
connects preparation, its existing CI configuration, and publication through `needs`.
Preparation retains HoverKraft's planner, npm/Lerna version application, atomic push
and explicit dispatch at the resulting tag. It never builds the project.

CI owns compilation, tests and optional packaging on that exact tagged commit. Add
an optional package list input and an artifact list output to the existing CI
workflow. Packaging runs only after all enabled checks succeed. Ordinary CI leaves
packaging disabled. Consumers with a shared CI wrapper forward these two values
instead of duplicating build and test settings.

Publication consumes immutable CI tarball IDs from the same run and source SHA.
Verify artifact metadata, tag versions and tarball manifests before npm publication.
Keep HoverKraft draft creation, AI summaries, asset upload and final publication.
Remove the release build helper and its configuration surface.

## Consequences

One caller serializes the complete pipeline; reusable workflow concurrency groups
remain distinct. The publication job depends on successful CI. Artifact metadata
checks alone cannot prove that tests passed, so that dependency is part of the caller
contract. Cross-run lookup and polling are deliberately excluded.

A failed-job rerun reuses successful CI artifacts, including successful matrix jobs
from earlier attempts of the same run. A new dispatch at the original tag reruns CI.
Expired artifacts fail explicitly. Existing npm bytes and GitHub assets retain the
integrity and retry protections from ADR 0003. Documentation deploys from CI's build
artifact after publication succeeds.

The initial packaging path supports the existing default Ubuntu runner and restored
build artifacts, not container-backed CI. This avoids promising path restoration
across incompatible runner layouts. Manual and scheduled triggers and automatic
Conventional Commit versions are unchanged.

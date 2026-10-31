# ADR 0002: Separate CI checks from release publication

- Status: accepted
- Date: 2026-10-31
- Partially supersedes: [ADR 0001](0001-release-orchestration.md)

## Context

ADR 0001 made the release workflow invoke the full continuous-integration
workflow. That coupled publication to lint, test, coverage and security settings,
repeated checks already owned by consumer CI, and required unrelated permissions.

Building release artifacts still depends on release preparation: compiled output
can embed the package version, and packaging and provenance must use the tagged
source. Reusing a pre-version CI artifact would break that relationship.

## Decision

Keep linting, tests, coverage and security analysis in independent consumer CI.
Remove their inputs and the nested CI invocation from the release workflow.
Keep a dedicated build job that delegates compilation to the existing Build
action. A small release build action translates the release build configuration
and preserves artifact paths for packaging and documentation deployment.

Release retains version preparation, tagged builds, changelogs, optional AI notes,
publication and recovery. Consumers retain CI policy and release environment
rules. The release workflow does not query or wait for CI status.

## Consequences

CI changes no longer change the release workflow's validation settings. The build
job needs only contents and packages read permissions. A release build is not
proof that tests passed on the tag; consumers must enforce their own checks.
This matters for Lerna's generated version commit, which is pushed directly.

Artifact output and recovery contracts remain unchanged. A failed release build
stops publication, and retries rebuild the original tag. Manual and scheduled
triggers and automatic Conventional Commit version selection remain unchanged.

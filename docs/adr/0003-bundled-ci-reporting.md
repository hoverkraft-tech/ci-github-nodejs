# ADR 0003: Adopt bundled CI reporting

- Status: proposed
- Date: 2026-11-09
- Related: [Pleey CI optimization](https://github.com/cloud-native-aixmarseille/pleey/issues/475)

## Context

The test and lint actions use common 2.0.2, whose report parser installs its
dependencies and configures Node.js for each invocation. Common 3.0.0 bundles
the parser, removing both operations from the reporting path. It also rejects
missing explicitly requested reports, exposing incorrect paths and commands
that did not produce the expected files.

## Decision

Adopt [common 3.0.0](https://github.com/hoverkraft-tech/ci-github-common/releases/tag/3.0.0)
by its immutable commit across actions and reusable workflows. Keep the shared
linter and PR-title validator on the same release.

Expose the upstream report contract through the existing `report-file` input:
each explicit positive path or glob must match after exclusions. Omitting the
input retains optional automatic discovery. Test report parsing remains limited
to GitHub coverage reporting. Reporting must preserve producer failures and
retain native test artifacts when reports are successfully parsed.

Treat the missing-report behavior as a breaking change in the Node.js release.
Do not hide missing explicit reports with a fallback to automatic discovery.
Existing callers can correct their paths or omit `report-file` for optional
discovery. This adoption needs no new inputs or dependencies in this repository.

## Validation and rollout

Extend hosted action tests for existing reports, missing paths and globs,
partially missing report lists, absent automatic reports and producer failures.
Run the existing workflow contracts, lint and full PR CI before review.
Consumers adopt the reviewed Node.js release separately; this PR does not
establish an end-to-end Pleey performance improvement. Rollback restores the
previous common pins and reporting contract.

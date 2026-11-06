# ADR 0002: Prepare CI metadata without application containers

- Status: proposed
- Date: 2026-11-06
- Consumer: [Pleey CI optimization, P2.1](https://github.com/cloud-native-aixmarseille/pleey/issues/475)

## Context

The CI workflow starts an application container only to resolve paths and build
options. An empty build then starts another container before tests can run. These
jobs perform no application validation and delay callers with prebuilt images.

## Decision

Normalize the working-directory and build inputs in the existing preparation job,
which needs neither a checkout nor the application image. Keep relative paths
relative: host and container workspaces can differ. Validate existence, access and
the non-container workspace boundary inside the build, lint and test actions.
Resolve artifact paths in the build job's filesystem context, preserving the
uploaded directory layout and existing download behavior.

An empty build string, including whitespace, omits the build job. Other supported
forms retain their defaults and validation: newline-separated scripts, JSON
arrays, and objects with commands, environment and artifact options. Invalid
command or artifact shapes fail preparation before starting application jobs.

Tests and optional packaging require successful preparation and either a
successful requested build or a build skipped because its command list is empty.
Use an explicit cancellation-aware condition so an intentional skip does not
propagate to these jobs. A failed, cancelled or unexpectedly skipped requested
build must block them. Lint remains independent of build and test results.

Do not change application commands, report handling, build-secret delivery or
CodeQL/dependency-review policy. Preserve package validation when no compilation
is needed. No additional runtime dependency or public workflow input is needed.

## Validation and rollout

Exercise the actual preparation scripts and scheduling expressions, including
malformed inputs, defaults, skipped and failed dependencies, cancellation and
disabled checks. Run host/container integration cases for omitted and requested
builds, workspace validation and artifact transfer. Measure preparation-to-first-
check latency and summed job time with fixed inputs; report timing variation.

Consumers adopt a reviewed release by SHA. Removing the setup job and skipping
empty build jobs changes emitted check names/statuses: callers requiring those
individual jobs must update their required checks when adopting the release.
Rollback restores the previous workflow pin and corresponding required checks.

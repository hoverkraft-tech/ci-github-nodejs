# ADR 0002: Prepare CI metadata without application containers

- Status: proposed
- Date: 2026-11-06
- Consumer: [Pleey CI optimization, P2.1](https://github.com/cloud-native-aixmarseille/pleey/issues/475)

## Context

For application callers, CI starts a container only to resolve paths and build
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

Public-package discovery needs the checked-out source. Run it in a separate host
job only when packaging is enabled, in parallel with compilation. Package matrix
validation requires successful discovery and the build condition above. Collect
results only after successful package validation. Preserve workspace selection,
consumer tests and artifact outputs without adding discovery to application CI.

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

## Initial implementation evidence: 2026-11-06

The [implementation CI](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42282825359)
passed on `5bccd49fb33a6c04d5332cb32754b28261b12103`. The 56 contract tests
exercise the actual YAML scripts and GitHub expression evaluator. Integration
cases cover host/container builds, omitted builds, artifact transfer, disabled
checks and package validation without compilation. Eight additional trials
confirmed preparation/build/lint/test failure, missing-directory and workspace
boundary rejection, disabled checks and cancellation. Expected failures are
successful negative tests, not successful workflow conclusions.

The initial baseline was `aaab44d37f5f675dc6789ea377ffc5b63cc3fe0f` and the
candidate was `5bccd49fb33a6c04d5332cb32754b28261b12103`. After
[priming](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42283024208),
the five measured pairs were
[1](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42284009431),
[2](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42284313836),
[3](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42284695321),
[4](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42285014018) and
[5](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42285335029).

The benchmark uses the existing preinstalled npm fixture with one test, an empty
build and this immutable image in both series:

```text
ghcr.io/hoverkraft-tech/ci-github-nodejs/ci-npm@sha256:324a3de0633bb5f7f0d41394ccf902195665fdaf2c23798f6145922161511574
```

Baseline and candidate run together in each dispatch. One priming pair precedes
five consecutive measured pairs; all measured pairs are retained. Measurement
starts after the full implementation CI finishes.

All five measured pairs passed. All 48 sampled job logs (including priming) used
runner `2.338.2`, Ubuntu image `ubuntu-26.04` version `20261101.186.1`; container
jobs resolved the recorded digest. Both variants passed one suite and one test.

| Metric                                 | Baseline median (range) | Candidate median (range) | Median change |
| -------------------------------------- | ----------------------- | ------------------------ | ------------- |
| Elapsed from preparation               | 101s (99–141s)          | 59s (49–118s)            | −41.58%       |
| Preparation to first validation action | 64s (53–70s)            | 31s (30–47s)             | −51.56%       |
| Summed job time                        | 143s (133–148s)         | 87s (74–89s)             | −39.16%       |
| Initial queue                          | 4s (3–7s)               | 3s (3–11s)               | −25.00%       |

Elapsed time starts at each variant's preparation job and includes downstream
queues, container pulls and cleanup. Initial queue time is recorded separately.
Validation-action latency ends at the first `Run lint` or `Run tests` composite
step; it does not measure the exact application command start. Summed job time
is not billed time. The candidate runs three jobs instead of five, omitting setup
and empty build; both versions still execute lint and the same test.

These measurements isolate reusable-workflow overhead. They do not establish a
Pleey end-to-end improvement or a cold-cache guarantee. A reviewed release and
consumer CI remain required before adopting its immutable SHA in Pleey.

## Upstream integration: 2026-11-06

Main advanced to `55afe8ef3c9b59932f87a99cb2620226f18b2062` during review
preparation, adding workspace packaging and updating shared action pins. Retain
that package API and move its source-dependent discovery out of the removed
setup job. The adapted suite has 60 contract tests, including discovery failure
and validation-result collection when compilation is omitted. The existing
source-package integration case also checks the resulting artifact output.

The initial measurements above retain their exact revisions and are historical
evidence for the pre-integration implementation. Validation against updated main
is recorded separately; do not treat that series as measurements of a later SHA.

The [integrated CI](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42288071590)
passed at `2f87ce61c0641934d24c39162732660b90451004`, including requested-build
artifact transfer and source packaging without compilation. Its workflow/action
sources equal the measured candidate `540c5f4ea785d853affae704ee5c4c270d96abcd`.
Eight probes matched their expected outcomes:
[preparation failure](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287006075),
[disabled checks](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287010624),
[build failure](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287014811),
[test failure](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287019554),
[lint failure](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287024618),
[missing directory](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287029142),
[workspace boundary](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287033354) and
[cancellation](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42287037745).

The preceding [integration run](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42286746512)
exposed duplicate reports when two cases packaged the same project. The no-build
case uses `tests/source-package`, whose build command deliberately fails if invoked,
to isolate it without changing the collector's project-based grouping.

The same method compared baseline `55afe8ef3c9b59932f87a99cb2620226f18b2062`
with candidate `540c5f4ea785d853affae704ee5c4c270d96abcd`. After
[priming](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42286929531),
all five measured pairs passed:
[1](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42289175642),
[2](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42289482879),
[3](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42289790837),
[4](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42290030964) and
[5](https://github.com/hoverkraft-tech/ci-github-nodejs/actions/runs/42290263969).
The runs retain job timestamps and outcomes. All 48 sampled job logs again used
runner `2.338.2` and Ubuntu image `20261101.186.1`; both variants used the image
above and passed the same one-suite, one-test inventory.

| Metric                                 | Baseline median (range) | Candidate median (range) | Median change |
| -------------------------------------- | ----------------------- | ------------------------ | ------------- |
| Elapsed from preparation               | 101s (89–107s)          | 52s (50–58s)             | −48.51%       |
| Preparation to first validation action | 61s (58–68s)            | 31s (29–36s)             | −49.18%       |
| Summed job time                        | 135s (121–149s)         | 90s (77–91s)             | −33.33%       |
| Initial queue                          | 4s (4–4s)               | 4s (3–4s)                | 0.00%         |

This confirms the reduction for the controlled application fixture against the
workspace-aware upstream implementation. Package-discovery jobs remain skipped
for this caller. The same scope limits apply: Pleey adoption and end-to-end
measurement require a reviewed release.

# ADR 0004: Optional Vitest sharding in continuous integration

- Status: proposed
- Date: 2026-11-16
- Consumer: [Pleey CI optimization, P6](https://github.com/cloud-native-aixmarseille/pleey/issues/475)

## Context

Frontend tests were the last validation in four of five measured Pleey runs after
independent candidate starts. Splitting every CI job would duplicate preparation,
lint and compilation. Reporting each shard separately would publish incomplete
coverage and could conceal missing results.

## Decision

Extend the existing workflow's `test` object with optional `shards`, `arguments`
and `merge-command`. Default to one test job with existing reporting behavior.
For multiple shards, use Vitest's native `--shard`, blob reporter and
`--merge-reports`. The caller owns its Vitest configuration and package scripts;
the workflow does not install or upgrade the project's test framework. The first
integration fixture exercises Vitest 5.1.0. Other test frameworks are outside this
increment.

Matrix only the test job, with fail-fast disabled and concurrency bounded by the
requested shard count. Keep preparation, lint and build single. Reuse the current
test action for host/container setup, argument forwarding and final reporting.
Use argv arrays, including npm's argument separator, without constructing shell
commands. `merge-command` defaults to `command`; separate scripts are supported
when the project needs different reporter settings. Use reporter-specific output
paths such as `--outputFile.junit`, because Vitest rejects combining scalar
`--outputFile` with the blob reporter's `--outputFile.blob`. Pleey adoption must
update that argument without changing the JUnit destination.

Shard execution sets `CI_TEST_SHARD` to its index/total. Merge leaves it empty.
Callers with coverage thresholds disable them only for shard execution and retain
the original thresholds for merging. Coverage collection stays enabled in both.
Do not flatten configured thresholds or combine independently rendered LCOV files.

Use a unique preparation identifier plus run ID, attempt and shard index for
artifact names. Each payload contains one fresh blob and a manifest identifying
source SHA, project path, group, shard/total, exit status and blob checksum.
Upload available results after test failure, including hidden files. Do not
publish partial shard reports or comments.

The merge job runs after completed shards, including failed shards, but not after
cancellation. It requires exactly one matching payload for every expected shard
before invoking the project's merge command. Reject missing, extra, stale,
mismatched or modified payloads. Run the native merger and publish final reports
once; preserve any shard failure even if merging returns success. The reusable
workflow also requires the original matrix job to succeed, covering upload or
setup failures independently of the test exit code.

Rerun the complete workflow after a failed attempt. A partial job rerun cannot
reuse prior-attempt shard artifacts. This intentionally fails closed rather than
combining results from different attempts. No additional token permission or
cross-run artifact access is introduced.

## Validation and rollout

Extend existing workflow contracts for configuration, argument forwarding and
failure-aware scheduling. Test payload validation with small local files, and
use a small real Vitest suite to verify complete inventory, coverage denominator,
threshold enforcement and failed-test reporting after merging. Hosted coverage
must exercise both checkout and preinstalled-container execution, using existing
fixture/image patterns rather than creating production images for testing.

Regenerate action/workflow references through the existing documentation tooling.
Review upstream CI before adopting in Pleey. A subsequent two-shard consumer
experiment must compare elapsed time and summed job time, including artifact
transfer and merging. This API implementation does not establish a performance
gain; retain unsharded execution if overhead outweighs the benefit.

## References

- [Vitest sharding](https://vitest.dev/guide/improving-performance.html#sharding)
- [Blob reporting](https://vitest.dev/guide/reporters.html#blob-reporter)
- [Coverage thresholds](https://vitest.dev/config/coverage#thresholds)

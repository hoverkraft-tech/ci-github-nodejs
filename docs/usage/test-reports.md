# Native test reports

The test action provides a fresh `CI_REPORTS_DIR` and sets `CI_TEST_COVERAGE`.
Write reports during that invocation. By default, native Vitest or Jest
`results.json` supplies both detailed test outcomes and coverage. Missing
requested coverage fails validation; tests remain available for diagnosis.
The final common `ci-reports` workflow publishes the collected results once.

## Vitest

Use the built-in JSON reporter and the coverage provider already configured by
the project. For example, a `test:ci` package script can run:

```sh
vitest run --reporter=default --reporter=json \
  --outputFile.json="${CI_REPORTS_DIR:-.reports}/results.json" \
  --coverage.enabled="${CI_TEST_COVERAGE:-true}" \
  --coverage.reporter=text --coverage.reportOnFailure=true
```

The JSON contains assertion results and the final Istanbul coverage map.
Keep coverage inclusion, exclusions and thresholds in the project's Vitest
configuration. Other runtimes run with `CI_TEST_COVERAGE=false` while retaining
their detailed tests in the same JSON format.

## Jest

Use Jest's built-in JSON output. No extra test reporter package is required:

```sh
jest --json --outputFile="${CI_REPORTS_DIR:-.reports}/results.json" \
  --coverage="${CI_TEST_COVERAGE:-true}" --coverageReporters=text
```

The test action validates the assertions and final coverage map independently
and retains the native file once. Coverage publication generates only the
destination's required representation.

## Vitest shards

The action sets `CI_TEST_SHARD` during shard execution and `CI_TEST_MERGE=true`
during native merging. Vitest's merge lifecycle emits JSON before merging
coverage. Enable a separate coverage reporter for that final invocation:

```js
coverage: {
  enabled: process.env.CI_TEST_COVERAGE !== "false",
  reporter: process.env.CI_TEST_MERGE === "true"
    ? ["text", "lcovonly"]
    : ["text"],
  reportsDirectory: `${process.env.CI_REPORTS_DIR || ".reports"}/coverage`,
  reportOnFailure: true,
}
```

Merged test results default to `results.json` and coverage to `coverage/lcov.info`.
Keep reporter-specific `outputFile.json` configuration, since the action adds
`outputFile.blob` for shards. Defer coverage thresholds during shard execution
and enforce the original thresholds during merging. The action checks the
complete shard set and retains failed shard outcomes.

## Other runners

Keep separate native reports when the runner needs them. For `node:test`, use
JUnit and LCOV and configure the existing inputs:

```yaml
test-results: junit.xml
test-coverage: coverage/lcov.info
```

For the reusable continuous-integration workflow, supply those paths inside
its `test` JSON object. Coverage can be disabled without removing detailed test
results. Test and coverage publication destinations remain independent of the
number of native files.

## Overall CI status

Call `ci-reports` once after all producers. It validates evidence and publication;
it can succeed while displaying failed tests. Add one required `CI complete` job
with `if: always()`, direct `needs` on every required producer and `reports`, and
`ci-github-common/actions/check-jobs` with `job-results: toJSON(needs)`.
Unexpected skipped jobs fail the gate. Allow only intentionally conditional job
IDs through `allow-skipped`. See the
[common CI gate contract](https://github.com/hoverkraft-tech/ci-github-common/blob/85351002dc2303c4a70233197edcadb20b1cb90e/docs/usage/ci-reports.md#required-ci-verdict).

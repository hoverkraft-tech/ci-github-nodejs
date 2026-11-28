import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
const require = createRequire(import.meta.url);
const {
  ReportDefinition,
} = require("../../actions/reporting/ReportDefinition.cjs");
const base = {
  kind: "test",
  workspace: "/repository",
  directory: "/repository/app",
  runtime: "v26.0.0",
  results: "junit.xml",
  coverage: "false",
};

test("container reports require an explicit source and map back to the checkout", () => {
  assert.throws(
    () => ReportDefinition.create({ ...base, directory: "/image/app" }),
    /requires source-sha and source-prefix/,
  );
  const definition = ReportDefinition.create({
    ...base,
    directory: "/image/app",
    sourceSha: "a".repeat(40),
    sourcePrefix: "app",
  });
  assert.equal(definition.project, "app");
  assert.deepEqual(definition["path-mapping"], { "/image/app": "app" });
  assert.equal(definition.source.sha, "a".repeat(40));
});

test("secondary runs retain tests without coverage promises; merged coverage identifies every shard", () => {
  const tests = ReportDefinition.create(base);
  assert.deepEqual(tests.reports, [{ kind: "test", pattern: "junit.xml" }]);
  const merged = ReportDefinition.create({
    ...base,
    coverage: "true",
    coveragePaths: "coverage/lcov.info",
    shards: "2",
  });
  assert.deepEqual(merged.reports[1].shards, {
    expected: ["1", "2"],
    included: ["1", "2"],
  });
  assert.throws(
    () => ReportDefinition.create({ ...base, results: "  " }),
    /must not be empty/,
  );
  assert.throws(
    () => ReportDefinition.create({ ...base, mapping: "[]" }),
    /JSON object/,
  );
});

test("a failed project command preserves its exit status and receives the fresh report directory", async () => {
  const action = parse(
    readFileSync(
      new URL("../../actions/test/action.yml", import.meta.url),
      "utf8",
    ),
  );
  const script = action.runs.steps.find((step) => step.id === "run-test").with
    .script;
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const outputs = {},
    failures = [];
  const env = {
    WORKING_DIRECTORY: "/repository/app",
    NODE_ACTION_PATH: new URL("../../actions/test", import.meta.url).pathname,
    RUN_TEST_COMMAND: "npm run",
    TEST_COMMAND: "test:ci",
    TEST_ARGUMENTS: "[]",
    CI_REPORTS_DIR: "/fresh/reports",
    CI_TEST_COVERAGE: "false",
  };
  await new AsyncFunction("process", "core", "exec", "require", script)(
    { env, chdir() {} },
    {
      debug() {},
      info() {},
      setOutput(name, value) {
        outputs[name] = value;
      },
      setFailed(message) {
        failures.push(message);
      },
    },
    {
      async exec(_command, _args, options) {
        assert.equal(options.env.CI_REPORTS_DIR, "/fresh/reports");
        assert.equal(options.env.CI_TEST_COVERAGE, "false");
        return 17;
      },
    },
    require,
  );
  assert.equal(outputs["test-exit-code"], 17);
  assert.match(failures[0], /exit code 17/);
});

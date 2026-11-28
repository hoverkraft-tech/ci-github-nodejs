import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";
import shardsModule from "../../actions/test/TestShards.cjs";

const { TestShards } = shardsModule;
const require = createRequire(import.meta.url);
const packageDirectory = fileURLToPath(new URL(".", import.meta.url));
const actionDirectory = fileURLToPath(
  new URL("../../actions/test", import.meta.url),
);
const identity = { runId: "123", attempt: "2", sha: "source-sha" };

function fixture(t) {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "test-shards-"),
  );
  t.after(() =>
    fs.rmSync(temporaryDirectory, { recursive: true, force: true }),
  );
  const configuration = {
    temporaryDirectory,
    workingDirectory: path.join(temporaryDirectory, "project"),
    group: "run-123-2-project",
    identity,
  };
  const merger = new TestShards({ ...configuration, mergeShards: "2" });
  merger.prepare([]);
  const record = (index, contents = "[]", exitCode = 0) => {
    const shard = new TestShards({ ...configuration, shard: `${index}/2` });
    shard.prepare([]);
    fs.writeFileSync(path.join(shard.payload, "blob.json"), contents);
    shard.record(exitCode);
    fs.cpSync(
      shard.payload,
      path.join(merger.incoming, `${shard.group}-${index}`),
      { recursive: true },
    );
    return shard;
  };
  return { configuration, merger, record };
}

test("script arguments preserve spaces and shell syntax without expansion", () => {
  const args = TestShards.arguments('["--config","a b.js","$(not-a-command)"]');
  assert.deepEqual(TestShards.scriptArguments("npm run", "test:ci", args), [
    "test:ci",
    "--",
    ...args,
  ]);
  for (const manager of ["pnpm", "yarn"])
    assert.deepEqual(TestShards.scriptArguments(manager, "test:ci", args), [
      "test:ci",
      ...args,
    ]);
  assert.deepEqual(TestShards.scriptArguments("npm run", "test:ci", []), [
    "test:ci",
  ]);
  for (const input of ['"--coverage"', "[1]", '["\\u0000"]'])
    assert.throws(() => TestShards.arguments(input), /arguments/);
});

test("fresh shard execution cannot publish a blob left by an earlier invocation", (t) => {
  const { record } = fixture(t);
  const shard = record(1);
  shard.prepare([]);
  assert.throws(() => shard.record(0), /ENOENT/);
  assert.throws(() => shard.record(""), /exit code/);
  assert.throws(() => shard.prepare(["--shard=2/2"]), /owns/);
});

test("merge requires the complete set and retains failed shard status", (t) => {
  const { merger, record } = fixture(t);
  record(1);
  assert.throws(() => merger.validate(), /Missing/);
  record(2, '["failure"]', 1);
  assert.equal(merger.validate(), true);
  assert.equal(
    fs.readFileSync(path.join(merger.blobs, "2.json"), "utf8"),
    '["failure"]',
  );
  fs.mkdirSync(path.join(merger.incoming, "unexpected"));
  assert.throws(() => merger.validate(), /unexpected/);
});

for (const [field, value] of Object.entries({
  attempt: "1",
  runId: "122",
  sha: "other-source",
  project: "/other-project",
  group: "other-group",
  index: 2,
  total: 3,
  exitCode: "0",
})) {
  test(`merge rejects mismatched ${field}`, (t) => {
    const { merger, record } = fixture(t);
    record(1);
    record(2);
    const manifestPath = path.join(
      merger.incoming,
      `${merger.group}-1`,
      "manifest.json",
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath));
    manifest[field] = value;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => merger.validate(), /mismatch|exit code/);
    assert.equal(fs.existsSync(merger.blobs), false);
  });
}

test("merge rejects changed blobs and symbolic links", (t) => {
  const { merger, record } = fixture(t);
  record(1);
  record(2);
  const blob = path.join(merger.incoming, `${merger.group}-1`, "blob.json");
  fs.writeFileSync(blob, '["changed"]');
  assert.throws(() => merger.validate(), /checksum/);
  fs.unlinkSync(blob);
  fs.symlinkSync(
    path.join(merger.incoming, `${merger.group}-2`, "blob.json"),
    blob,
  );
  assert.throws(() => merger.validate(), /regular file/);
});

test("a successful merge command cannot mask a failed shard", async () => {
  const action = parse(
    fs.readFileSync(path.join(actionDirectory, "action.yml"), "utf8"),
  );
  const script = action.runs.steps.find((step) => step.id === "run-test").with
    .script;
  const failures = [];
  await runInNewContext(`(async () => { ${script} })()`, {
    require,
    process: {
      chdir() {},
      env: {
        NODE_ACTION_PATH: actionDirectory,
        WORKING_DIRECTORY: packageDirectory,
        RUN_TEST_COMMAND: "npm run",
        TEST_COMMAND: "merge",
        TEST_ARGUMENTS: "[]",
        SHARDS_FAILED: "true",
      },
    },
    exec: { exec: async () => 0 },
    core: {
      debug() {},
      info() {},
      setOutput() {},
      setFailed: (message) => failures.push(message),
    },
  });
  assert.match(failures.join("\n"), /shards failed/);
});

test("real Vitest merging preserves inventory, coverage, thresholds and failed tests", (t) => {
  const { configuration, merger } = fixture(t);
  const project = configuration.workingDirectory;
  fs.mkdirSync(project);
  fs.cpSync(
    path.join(packageDirectory, "fixtures"),
    path.join(project, "fixtures"),
    { recursive: true },
  );
  fs.writeFileSync(
    path.join(project, "package.json"),
    '{"type":"module","private":true}',
  );
  fs.symlinkSync(
    path.join(packageDirectory, "node_modules"),
    path.join(project, "node_modules"),
    "dir",
  );
  const cli = path.join(packageDirectory, "node_modules/vitest/vitest.mjs");
  const run = (args, env = {}) =>
    spawnSync(
      process.execPath,
      [
        cli,
        "run",
        "--config",
        "fixtures/vitest.config.mjs",
        "--reporter=default",
        "--reporter=json",
        "--outputFile.json=coverage/sharding/results.json",
        ...args,
      ],
      {
        cwd: project,
        env: {
          ...process.env,
          CI: "true",
          CI_TEST_SHARD: "",
          CI_TEST_MERGE: args.some((arg) => arg.startsWith("--merge-reports="))
            ? "true"
            : "false",
          CI_REPORTS_DIR: "",
          CI_TEST_COVERAGE: "true",
          ...env,
        },
        encoding: "utf8",
        timeout: 30_000,
      },
    );
  const assertSuccess = (result) =>
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const report = () =>
    JSON.parse(
      fs.readFileSync(
        path.join(project, "coverage/sharding/results.json"),
        "utf8",
      ),
    );
  const coverage = () => {
    const combined = report().coverageMap;
    const count = (hits) => ({
      total: hits.length,
      covered: hits.filter((hit) => hit > 0).length,
    });
    if (combined) {
      const lines = new Map();
      for (const [source, file] of Object.entries(combined))
        for (const [id, location] of Object.entries(file.statementMap)) {
          const key = `${source}:${location.start.line}`;
          lines.set(key, lines.get(key) || file.s[id] > 0);
        }
      return {
        lines: [...lines].sort(),
        functions: count(
          Object.values(combined).flatMap((file) => Object.values(file.f)),
        ),
        branches: count(
          Object.values(combined).flatMap((file) =>
            Object.values(file.b).flat(),
          ),
        ),
      };
    }
    const lcov = fs.readFileSync(
      path.join(project, "coverage/sharding/lcov.info"),
      "utf8",
    );
    const lines = [...lcov.matchAll(/^DA:(\d+),(\d+)$/gm)];
    const source = lcov.match(/^SF:(.+)$/m)[1];
    return {
      lines: lines
        .map((line) => [
          `${path.resolve(project, source)}:${line[1]}`,
          Number(line[2]) > 0,
        ])
        .sort(),
      functions: count(
        [...lcov.matchAll(/^FNDA:(\d+),/gm)].map((match) => Number(match[1])),
      ),
      branches: count(
        [...lcov.matchAll(/^BRDA:[^,]+,[^,]+,[^,]+,([^\r\n]+)/gm)].map(
          (match) => Number(match[1]) || 0,
        ),
      ),
    };
  };
  assertSuccess(run([]));
  const baselineCoverage = coverage();
  assert.equal(report().numTotalTests, 2);
  const shards = [1, 2].map((index) => {
    const shard = new TestShards({ ...configuration, shard: `${index}/2` });
    assertSuccess(run(shard.prepare([]), { CI_TEST_SHARD: `${index}/2` }));
    shard.record(0);
    fs.cpSync(
      shard.payload,
      path.join(merger.incoming, `${shard.group}-${index}`),
      { recursive: true },
    );
    return shard;
  });
  assert.equal(merger.validate(), false);
  assertSuccess(run([`--merge-reports=${merger.blobs}`]));
  assert.equal(report().numTotalTests, 2);
  assert.deepEqual(coverage(), baselineCoverage);
  const threshold = run([`--merge-reports=${merger.blobs}`], {
    TEST_COVERAGE_THRESHOLD: "101",
  });
  assert.notEqual(threshold.status, 0);
  assert.match(threshold.stderr, /threshold/i);

  const failed = shards.find((shard) =>
    fs
      .readFileSync(path.join(shard.payload, "blob.json"), "utf8")
      .includes("enabled answer"),
  );
  assert.ok(failed);
  const outcome = run(failed.prepare([]), {
    CI_TEST_SHARD: `${failed.index}/2`,
    EXPECT_TEST_FAILURE: "true",
  });
  assert.notEqual(outcome.status, 0);
  failed.record(outcome.status);
  fs.cpSync(
    failed.payload,
    path.join(merger.incoming, `${failed.group}-${failed.index}`),
    { recursive: true },
  );
  assert.equal(merger.validate(), true);
  const merged = run([`--merge-reports=${merger.blobs}`]);
  assert.notEqual(merged.status, 0);
  assert.equal(report().numFailedTests, 1);
  assert.equal(report().numTotalTests, 2);
  assert.deepEqual(coverage(), baselineCoverage);
});

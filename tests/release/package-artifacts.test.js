const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const {
  PackageArtifacts,
} = require("../../actions/package-artifacts/PackageArtifacts.js");
const {
  ReleaseArtifacts,
} = require("../../actions/release/ReleaseArtifacts.js");

const context = {
  repo: { owner: "example", repo: "project" },
  runId: 42,
  sha: "prepared-commit",
};
const item = {
  name: "@example/cli",
  slug: "example-cli",
  version: "1.2.3",
  directory: ".",
};
const artifact = (id, attempt = 1, overrides = {}) => ({
  id,
  name: `npm-example-cli-42-${attempt}.tgz`,
  expired: false,
  workflow_run: { id: 42, head_sha: context.sha },
  ...overrides,
});
const collector = (artifacts) =>
  new PackageArtifacts({
    context,
    github: {
      paginate: async () => artifacts,
      rest: {
        actions: {
          listWorkflowRunArtifacts() {},
          getArtifact: async ({ artifact_id }) => ({
            data: artifacts.find((entry) => entry.id === artifact_id),
          }),
        },
      },
    },
  });

test("collects exact CI artifact IDs and filenames for publication", async () => {
  const result = await collector([artifact(10)]).collect(
    JSON.stringify([item]),
  );
  assert.deepEqual(result, [
    { ...item, "artifact-id": 10, "artifact-name": "npm-example-cli-42-1.tgz" },
  ]);
  assert.deepEqual(
    await collector([artifact(10)]).verify(JSON.stringify(result), "1.2.3"),
    result,
  );
});

test("failed-job reruns combine successful packages from different attempts", async () => {
  const other = {
    ...item,
    name: "other",
    slug: "other",
    directory: "packages/other",
  };
  const result = await collector([
    artifact(10),
    artifact(20, 2),
    artifact(30, 1, { name: "npm-other-42-1.tgz" }),
  ]).collect(JSON.stringify([item, other]));
  assert.deepEqual(
    result.map((entry) => entry["artifact-id"]),
    [20, 30],
  );
});

test("fails when any package is missing, expired or from another run", async () => {
  for (const artifacts of [
    [],
    [artifact(10, 1, { expired: true })],
    [artifact(10, 1, { workflow_run: { id: 41, head_sha: context.sha } })],
    [artifact(10, 1, { workflow_run: undefined })],
  ]) {
    await assert.rejects(
      collector(artifacts).collect(JSON.stringify([item])),
      /CI tarball|CI artifact/,
    );
  }
});

test("rejects ambiguous names, unsafe paths, invalid versions and invalid package lists", () => {
  const service = collector([]);
  for (const packages of [
    [],
    {},
    [null],
    [item, item],
    [{ ...item, slug: "wrong" }],
    [{ ...item, name: "../bad" }],
    [{ ...item, directory: "../outside" }],
    [{ ...item, directory: "/tmp" }],
    [{ ...item, version: "1.2.3-beta" }],
  ]) {
    assert.throws(
      () => service.parse(JSON.stringify(packages)),
      /Expected|unique/,
    );
  }
});

test("publication rejects changed artifact IDs, filenames, source commits and release versions", async () => {
  const service = collector([artifact(10)]);
  const [valid] = await service.collect(JSON.stringify([item]));
  for (const entry of [
    { ...valid, version: "1.2.2" },
    { ...valid, "artifact-id": "10" },
    { ...valid, "artifact-name": "other.tgz" },
  ]) {
    await assert.rejects(
      service.verify(JSON.stringify([entry]), "1.2.3"),
      /version|artifact/,
    );
  }
  await assert.rejects(
    collector([
      artifact(10, 1, { workflow_run: { id: 42, head_sha: "old" } }),
    ]).verify(JSON.stringify([valid]), "1.2.3"),
    /prepared commit/,
  );
});

test("checks the packaged manifest without executing package lifecycle scripts", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ci-tarball-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "package"));
  const tarballPath = path.join(directory, "package.tgz");
  for (const manifest of [
    { name: item.name, version: item.version },
    { name: "wrong", version: item.version },
    { name: item.name, version: "1.2.2" },
    { name: item.name, version: item.version, private: true },
  ]) {
    fs.writeFileSync(
      path.join(directory, "package/package.json"),
      JSON.stringify({ ...manifest, scripts: { prepublishOnly: "exit 1" } }),
    );
    execFileSync("tar", ["-czf", tarballPath, "package"], { cwd: directory });
    const verify = () =>
      ReleaseArtifacts.verifyTarball({ ...item, tarballPath });
    if (
      manifest.name === item.name &&
      manifest.version === item.version &&
      !manifest.private
    )
      assert.doesNotThrow(verify);
    else assert.throws(verify, /expected public package/);
  }
});

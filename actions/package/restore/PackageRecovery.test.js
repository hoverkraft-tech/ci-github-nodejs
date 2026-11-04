const assert = require("node:assert/strict");
const exec = require("@actions/exec");
const { test } = require("node:test");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { PackageRecovery } = require("./PackageRecovery.js");
const restorePackage = (inputs, fetchPackage) =>
  new PackageRecovery(fetchPackage).restorePackage(inputs);

function directory(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nodejs-release-assets-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function registryFixture(t) {
  const root = directory(t);
  const tarballPath = path.join(root, "package.tgz");
  fs.writeFileSync(tarballPath, "new build");
  const published = Buffer.from("the exact bytes published to npm");
  const metadata = {
    name: "@example/core",
    version: "1.2.0",
    dist: {
      tarball: "https://registry.npmjs.org/@example/core/-/core-1.2.0.tgz",
      integrity: `sha512-${createHash("sha512").update(published).digest("base64")}`,
    },
  };
  return {
    tarballPath,
    published,
    metadata,
    inputs: { name: metadata.name, version: metadata.version, tarballPath },
  };
}

const item = {
  name: "@example/cli",
  slug: "example-cli",
  version: "1.2.3",
  directory: ".",
  tag: "v1.2.3",
};
test("allows publication only when the npm version is absent", async (t) => {
  const f = registryFixture(t);
  assert.equal(
    await restorePackage(
      f.inputs,
      async () => new Response(null, { status: 404 }),
    ),
    false,
  );
  assert.equal(fs.readFileSync(f.tarballPath, "utf8"), "new build");
  await assert.rejects(
    restorePackage(f.inputs, async () => new Response(null, { status: 503 })),
    /HTTP 503/,
  );
});

test("recovers the original npm tarball for an already published version", async (t) => {
  const f = registryFixture(t);
  const requested = [];
  const published = await restorePackage(f.inputs, async (url) => {
    requested.push(url);
    return requested.length === 1
      ? Response.json(f.metadata)
      : new Response(f.published);
  });
  assert.equal(published, true);
  assert.deepEqual(fs.readFileSync(f.tarballPath), f.published);
  assert.deepEqual(requested, [
    "https://registry.npmjs.org/%40example%2Fcore/1.2.0",
    f.metadata.dist.tarball,
  ]);
});

test("rejects corrupted tarballs without replacing the package file", async (t) => {
  const f = registryFixture(t);
  let requests = 0;
  await assert.rejects(
    restorePackage(f.inputs, async () =>
      ++requests === 1 ? Response.json(f.metadata) : new Response("corrupt"),
    ),
    /integrity verification/,
  );
  assert.equal(fs.readFileSync(f.tarballPath, "utf8"), "new build");
});

test("rejects unexpected registry identities, download hosts, and failed downloads", async (t) => {
  const f = registryFixture(t);
  await assert.rejects(
    restorePackage(f.inputs, async () =>
      Response.json({ ...f.metadata, version: "9.0.0" }),
    ),
    /unexpected package version/,
  );
  await assert.rejects(
    restorePackage(f.inputs, async () =>
      Response.json({
        ...f.metadata,
        dist: { tarball: "https://example.invalid/package.tgz" },
      }),
    ),
    /npm registry/,
  );
  let requests = 0;
  await assert.rejects(
    restorePackage(f.inputs, async () =>
      ++requests === 1
        ? Response.json(f.metadata)
        : new Response(null, { status: 503 }),
    ),
    /download failed/,
  );
});

test("checks the packaged manifest without executing package lifecycle scripts", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "release-tarball-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "package"));
  const tarballPath = path.join(directory, "package.tgz");
  for (const manifest of [
    { name: item.name, version: item.version },
    { name: "wrong", version: item.version },
    { name: item.name, version: "1.2.2" },
    { name: item.name, version: item.version, private: true },
    ...["dependencies", "optionalDependencies", "peerDependencies"].map(
      (field) => ({
        name: item.name,
        version: item.version,
        [field]: { core: "workspace:*" },
      }),
    ),
  ]) {
    fs.writeFileSync(
      path.join(directory, "package/package.json"),
      JSON.stringify({ ...manifest, scripts: { prepublishOnly: "exit 1" } }),
    );
    execFileSync("tar", ["-czf", tarballPath, "package"], { cwd: directory });
    const verify = () =>
      PackageRecovery.verifyTarball({ exec, ...item, tarballPath });
    if (
      manifest.name === item.name &&
      manifest.version === item.version &&
      !manifest.private &&
      !manifest.dependencies &&
      !manifest.optionalDependencies &&
      !manifest.peerDependencies
    )
      await assert.doesNotReject(verify);
    else
      await assert.rejects(
        verify,
        /expected public package|unresolved workspace/,
      );
  }
});

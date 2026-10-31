const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const {
  ReleaseArtifacts,
} = require("../../actions/release/ReleaseArtifacts.js");
const restorePackage = (inputs, fetchPackage) =>
  new ReleaseArtifacts(fetchPackage).restorePackage(inputs);

function directory(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nodejs-release-assets-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("finds drafts when the release-by-tag endpoint does not return them", async () => {
  const draft = { id: 1, tag_name: "v1.2.0", draft: true };
  const github = {
    rest: {
      repos: {
        getReleaseByTag: async () => {
          throw Object.assign(new Error("Not found"), { status: 404 });
        },
      },
    },
    paginate: async () => [draft],
  };
  assert.equal(await ReleaseArtifacts.findRelease(github, {}, "v1.2.0"), draft);
  assert.equal(
    await ReleaseArtifacts.findRelease(github, {}, "v1.3.0"),
    undefined,
  );
  github.rest.repos.getReleaseByTag = async () => {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  };
  await assert.rejects(
    ReleaseArtifacts.findRelease(github, {}, "v1.2.0"),
    /Forbidden/,
  );
});

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

function assetsFixture(t) {
  const root = directory(t);
  const data = Buffer.from("published package");
  fs.writeFileSync(path.join(root, "example-core-1.2.0.tgz"), data);
  const release = { id: 1, draft: true };
  const assets = [];
  const github = {
    rest: {
      repos: {
        getReleaseByTag: async () => ({ data: release }),
      },
    },
    paginate: async () => assets,
  };
  return {
    release,
    assets,
    data,
    args: {
      github,
      repo: { owner: "example", repo: "project" },
      tag: "v1.2.0",
      directory: root,
    },
  };
}

test("stages only missing package bytes for HoverKraft upload and skips identical assets", async (t) => {
  const f = assetsFixture(t);
  const result = await new ReleaseArtifacts().prepareAssets(f.args);
  assert.equal(result.hasAssets, true);
  assert.deepEqual(
    fs.readFileSync(
      path.join(result.pendingDirectory, "example-core-1.2.0.tgz"),
    ),
    f.data,
  );
  f.assets.push({
    name: "example-core-1.2.0.tgz",
    digest: `sha256:${createHash("sha256").update(f.data).digest("hex")}`,
  });
  const retry = await new ReleaseArtifacts().prepareAssets(f.args);
  assert.equal(retry.hasAssets, false);
  assert.deepEqual(fs.readdirSync(retry.pendingDirectory), []);
  f.release.draft = false;
  assert.equal(
    (await new ReleaseArtifacts().prepareAssets(f.args)).hasAssets,
    false,
  );
});

test("does not overwrite mismatched assets or modify an incomplete published release", async (t) => {
  const f = assetsFixture(t);
  f.assets.push({ name: "example-core-1.2.0.tgz", digest: "sha256:different" });
  await assert.rejects(
    new ReleaseArtifacts().prepareAssets(f.args),
    /different or unavailable digest/,
  );
  f.assets.length = 0;
  f.release.draft = false;
  await assert.rejects(
    new ReleaseArtifacts().prepareAssets(f.args),
    /missing expected asset/,
  );
});

test("partial asset recovery passes only missing tarballs to the uploader", async (t) => {
  const f = assetsFixture(t);
  const name = "example-cli-1.2.0.tgz";
  fs.writeFileSync(path.join(f.args.directory, name), "second package");
  f.assets.push({
    name: "example-core-1.2.0.tgz",
    digest: `sha256:${createHash("sha256").update(f.data).digest("hex")}`,
  });
  const result = await new ReleaseArtifacts().prepareAssets(f.args);
  assert.equal(result.hasAssets, true);
  assert.deepEqual(fs.readdirSync(result.pendingDirectory), [name]);
  assert.equal(
    fs.readFileSync(path.join(result.pendingDirectory, name), "utf8"),
    "second package",
  );
});

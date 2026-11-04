const assert = require("node:assert/strict");
const glob = require("@actions/glob");
const { test } = require("node:test");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const releaseAssets = require("./index.js");

function directory(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nodejs-release-assets-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
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
      glob,
      repo: { owner: "example", repo: "project" },
      tag: "v1.2.0",
      directory: root,
    },
  };
}

test("stages only missing package bytes for HoverKraft upload and skips identical assets", async (t) => {
  const f = assetsFixture(t);
  const result = await releaseAssets.prepareAssets(f.args);
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
  const retry = await releaseAssets.prepareAssets(f.args);
  assert.equal(retry.hasAssets, false);
  assert.deepEqual(fs.readdirSync(retry.pendingDirectory), []);
  f.release.draft = false;
  assert.equal((await releaseAssets.prepareAssets(f.args)).hasAssets, false);
});

test("does not overwrite mismatched assets or modify an incomplete published release", async (t) => {
  const f = assetsFixture(t);
  f.assets.push({ name: "example-core-1.2.0.tgz", digest: "sha256:different" });
  await assert.rejects(
    releaseAssets.prepareAssets(f.args),
    /different or unavailable digest/,
  );
  f.assets.length = 0;
  f.release.draft = false;
  await assert.rejects(
    releaseAssets.prepareAssets(f.args),
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
  const result = await releaseAssets.prepareAssets(f.args);
  assert.equal(result.hasAssets, true);
  assert.deepEqual(fs.readdirSync(result.pendingDirectory), [name]);
  assert.equal(
    fs.readFileSync(path.join(result.pendingDirectory, name), "utf8"),
    "second package",
  );
});

test("asset discovery excludes nested tarballs, directories and symbolic links", async (t) => {
  const f = assetsFixture(t);
  const nested = path.join(f.args.directory, "previous-attempt");
  fs.mkdirSync(nested);
  fs.writeFileSync(path.join(nested, "ignored.tgz"), "previous attempt");
  fs.mkdirSync(path.join(f.args.directory, "directory.tgz"));
  fs.symlinkSync(
    path.join(nested, "ignored.tgz"),
    path.join(f.args.directory, "link.tgz"),
  );
  const result = await releaseAssets.prepareAssets(f.args);
  assert.deepEqual(fs.readdirSync(result.pendingDirectory), [
    "example-core-1.2.0.tgz",
  ]);
  fs.unlinkSync(path.join(f.args.directory, "example-core-1.2.0.tgz"));
  await assert.rejects(
    releaseAssets.prepareAssets(f.args),
    /No package tarballs/,
  );
});

test("recovers draft assets through release listing and propagates lookup failures", async (t) => {
  const f = assetsFixture(t);
  const { github } = f.args;
  github.rest.repos.getReleaseByTag = async () => {
    throw Object.assign(new Error("Not found"), { status: 404 });
  };
  github.rest.repos.listReleases = Symbol("list releases");
  github.rest.repos.listReleaseAssets = Symbol("list assets");
  github.paginate = async (method) =>
    method === github.rest.repos.listReleases
      ? [{ ...f.release, tag_name: f.args.tag }]
      : f.assets;
  assert.equal((await releaseAssets.prepareAssets(f.args)).hasAssets, true);
  github.paginate = async () => [];
  await assert.rejects(releaseAssets.prepareAssets(f.args), /No release found/);
  github.rest.repos.getReleaseByTag = async () => {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  };
  await assert.rejects(releaseAssets.prepareAssets(f.args), /Forbidden/);
});

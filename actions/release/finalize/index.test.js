const assert = require("node:assert/strict");
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
  const tarballPath = path.join(root, "downloaded-artifact.tgz");
  fs.writeFileSync(tarballPath, data);
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
      tarballPath,
      assetName: "example-core-1.2.0.tgz",
      tempDirectory: root,
    },
  };
}

test("stages the explicit tarball under its release name and skips identical assets", async (t) => {
  const f = assetsFixture(t);
  const result = await releaseAssets.prepareAssets(f.args);
  assert.equal(result.hasAssets, true);
  assert.deepEqual(
    fs.readFileSync(
      path.join(result.pendingDirectory, "example-core-1.2.0.tgz"),
    ),
    f.data,
  );
  assert.deepEqual(fs.readdirSync(result.pendingDirectory), [f.args.assetName]);
  assert.deepEqual(fs.readFileSync(f.args.tarballPath), f.data);
  f.assets.push({
    name: "example-core-1.2.0.tgz",
    digest: `sha256:${createHash("sha256").update(f.data).digest("hex")}`,
  });
  const retry = await releaseAssets.prepareAssets(f.args);
  assert.equal(retry.hasAssets, false);
  assert.equal(retry.pendingDirectory, "");
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

test("attaches only the requested file even when other tarballs are present", async (t) => {
  const f = assetsFixture(t);
  fs.writeFileSync(
    path.join(f.args.tempDirectory, "unrelated.tgz"),
    "other package",
  );
  const result = await releaseAssets.prepareAssets(f.args);
  assert.deepEqual(fs.readdirSync(result.pendingDirectory), [f.args.assetName]);
});

test("rejects asset names that could escape staging or are not tarball filenames", async (t) => {
  const f = assetsFixture(t);
  for (const assetName of [
    "",
    "../outside.tgz",
    "/outside.tgz",
    "dir\\outside.tgz",
    "package.zip",
    "bad\nname.tgz",
  ]) {
    await assert.rejects(
      releaseAssets.prepareAssets({ ...f.args, assetName }),
      /asset-name must be a plain .tgz filename/,
    );
  }
  assert.deepEqual(fs.readdirSync(f.args.tempDirectory), [
    "downloaded-artifact.tgz",
  ]);
});

test("rejects missing tarballs, directories and symbolic links", async (t) => {
  const f = assetsFixture(t);
  const folder = path.join(f.args.tempDirectory, "directory.tgz");
  const link = path.join(f.args.tempDirectory, "link.tgz");
  fs.mkdirSync(folder);
  fs.symlinkSync(f.args.tarballPath, link);
  for (const tarballPath of [folder, link]) {
    await assert.rejects(
      releaseAssets.prepareAssets({ ...f.args, tarballPath }),
      /package-tarball-path must point to a regular file/,
    );
  }
  fs.unlinkSync(f.args.tarballPath);
  await assert.rejects(releaseAssets.prepareAssets(f.args), /ENOENT/);
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

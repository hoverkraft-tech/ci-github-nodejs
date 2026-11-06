const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

async function findRelease(github, repo, tag) {
  try {
    const { data } = await github.rest.repos.getReleaseByTag({
      ...repo,
      tag,
    });
    return data;
  } catch (error) {
    if (error.status !== 404) throw error;
    const releases = await github.paginate(github.rest.repos.listReleases, {
      ...repo,
      per_page: 100,
    });
    return releases.find((release) => release.tag_name === tag);
  }
}

async function prepareAssets({
  github,
  glob,
  repo,
  tag,
  tarballPath,
  assetName,
  tempDirectory,
}) {
  let files;
  if (assetName) {
    files = [{ file: tarballPath, name: assetName }];
  } else {
    const globber = await glob.create(tarballPath, {
      followSymbolicLinks: false,
      matchDirectories: false,
      implicitDescendants: false,
    });
    files = (await globber.glob())
      .filter((file) => fs.lstatSync(file).isFile())
      .map((file) => ({ file, name: path.basename(file) }));
  }
  if (!files.length)
    throw new Error("No package tarballs available to attach.");
  const names = new Set();
  for (const { file, name } of files) {
    if (
      typeof name !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*\.tgz$/.test(name)
    )
      throw new Error("asset-name must be a plain .tgz filename.");
    if (!fs.lstatSync(file).isFile())
      throw new Error("package-tarball-path must point to a regular file.");
    if (names.has(name))
      throw new Error(`Duplicate release asset name ${name}.`);
    names.add(name);
  }
  const release = await findRelease(github, repo, tag);
  if (!release) throw new Error(`No release found for ${tag}.`);
  const assets = await github.paginate(github.rest.repos.listReleaseAssets, {
    ...repo,
    release_id: release.id,
    per_page: 100,
  });
  const missing = [];
  for (const { file, name } of files) {
    const data = fs.readFileSync(file);
    const digest = `sha256:${createHash("sha256").update(data).digest("hex")}`;
    const existing = assets.find((asset) => asset.name === name);
    if (existing) {
      if (existing.digest !== digest)
        throw new Error(
          `Release asset ${name} has a different or unavailable digest.`,
        );
      continue;
    }
    if (!release.draft)
      throw new Error(`Published release is missing expected asset ${name}.`);
    missing.push({ name, data });
  }
  if (!missing.length)
    return { release, pendingDirectory: "", hasAssets: false };
  const pendingDirectory = fs.mkdtempSync(
    path.join(tempDirectory, "release-pending-"),
  );
  for (const { name, data } of missing)
    fs.writeFileSync(path.join(pendingDirectory, name), data);
  return { release, pendingDirectory, hasAssets: true };
}

module.exports = { prepareAssets };

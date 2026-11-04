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
  repo,
  tag,
  tarballPath,
  assetName,
  tempDirectory,
}) {
  if (
    typeof assetName !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\.tgz$/.test(assetName)
  )
    throw new Error("asset-name must be a plain .tgz filename.");
  if (!fs.lstatSync(tarballPath).isFile())
    throw new Error("package-tarball-path must point to a regular file.");
  const release = await findRelease(github, repo, tag);
  if (!release) throw new Error(`No release found for ${tag}.`);
  const assets = await github.paginate(github.rest.repos.listReleaseAssets, {
    ...repo,
    release_id: release.id,
    per_page: 100,
  });
  const data = fs.readFileSync(tarballPath);
  const digest = `sha256:${createHash("sha256").update(data).digest("hex")}`;
  const existing = assets.find((asset) => asset.name === assetName);
  if (existing) {
    if (existing.digest !== digest)
      throw new Error(
        `Release asset ${assetName} has a different or unavailable digest.`,
      );
    return { release, pendingDirectory: "", hasAssets: false };
  }
  if (!release.draft)
    throw new Error(
      `Published release is missing expected asset ${assetName}.`,
    );
  const pendingDirectory = fs.mkdtempSync(
    path.join(tempDirectory, "release-pending-"),
  );
  fs.writeFileSync(path.join(pendingDirectory, assetName), data);
  return { release, pendingDirectory, hasAssets: true };
}

module.exports = { prepareAssets };

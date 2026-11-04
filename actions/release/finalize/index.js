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

async function prepareAssets({ github, glob, repo, tag, directory }) {
  const release = await findRelease(github, repo, tag);
  if (!release) throw new Error(`No release found for ${tag}.`);
  const assets = await github.paginate(github.rest.repos.listReleaseAssets, {
    ...repo,
    release_id: release.id,
    per_page: 100,
  });
  const globber = await glob.create(path.join(directory, "*.tgz"), {
    followSymbolicLinks: false,
    matchDirectories: false,
    implicitDescendants: false,
  });
  const files = (await globber.glob()).filter((file) =>
    fs.lstatSync(file).isFile(),
  );
  if (!files.length)
    throw new Error("No package tarballs available to attach.");
  const missing = [];
  for (const file of files) {
    const name = path.basename(file);
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
  const pendingDirectory = fs.mkdtempSync(path.join(directory, "pending-"));
  for (const { name, data } of missing)
    fs.writeFileSync(path.join(pendingDirectory, name), data);
  return { release, pendingDirectory, hasAssets: missing.length > 0 };
}

module.exports = { prepareAssets };

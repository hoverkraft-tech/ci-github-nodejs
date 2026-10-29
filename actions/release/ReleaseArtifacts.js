const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

class ReleaseArtifacts {
  constructor(fetchPackage = fetch) {
    this.fetchPackage = fetchPackage;
  }

  static async findRelease(github, repo, tag) {
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

  async restorePackage({ name, version, tarballPath }) {
    const response = await this.fetchPackage(
      `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
    );
    if (response.status === 404) return false;
    if (!response.ok)
      throw new Error(`npm registry lookup failed: HTTP ${response.status}`);
    const metadata = await response.json();
    if (metadata.name !== name || metadata.version !== version)
      throw new Error("npm registry returned an unexpected package version.");
    const url = new URL(metadata.dist.tarball);
    if (url.origin !== "https://registry.npmjs.org")
      throw new Error(
        "Published package tarball must come from the npm registry.",
      );
    const tarballResponse = await this.fetchPackage(url.href);
    if (!tarballResponse.ok)
      throw new Error(
        `npm tarball download failed: HTTP ${tarballResponse.status}`,
      );
    const tarball = Buffer.from(await tarballResponse.arrayBuffer());
    const integrity = `sha512-${createHash("sha512").update(tarball).digest("base64")}`;
    if (metadata.dist.integrity !== integrity)
      throw new Error(
        "Published package tarball failed integrity verification.",
      );
    fs.writeFileSync(tarballPath, tarball);
    return true;
  }

  async attachAssets({ github, repo, tag, directory }) {
    const release = await ReleaseArtifacts.findRelease(github, repo, tag);
    if (!release) throw new Error(`No release found for ${tag}.`);
    const assets = await github.paginate(github.rest.repos.listReleaseAssets, {
      ...repo,
      release_id: release.id,
      per_page: 100,
    });
    const files = fs
      .readdirSync(directory)
      .filter((name) => name.endsWith(".tgz"));
    if (!files.length)
      throw new Error("No package tarballs available to attach.");
    for (const name of files) {
      const data = fs.readFileSync(path.join(directory, name));
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
      await github.rest.repos.uploadReleaseAsset({
        ...repo,
        release_id: release.id,
        name,
        data,
        headers: {
          "content-type": "application/gzip",
          "content-length": data.length,
        },
      });
    }
    return release;
  }

  async markReleaseRequests({ github, context }) {
    const issues = await github.paginate(github.rest.issues.listForRepo, {
      ...context.repo,
      labels: "autorelease: pending",
      state: "closed",
      per_page: 100,
    });
    for (const issue of issues.filter((item) => item.pull_request)) {
      const { data } = await github.rest.pulls.get({
        ...context.repo,
        pull_number: issue.number,
      });
      if (
        data.merged_at &&
        data.merge_commit_sha === context.sha &&
        data.base.ref === context.payload.repository.default_branch
      ) {
        await github.rest.issues.addLabels({
          ...context.repo,
          issue_number: issue.number,
          labels: ["autorelease: tagged"],
        });
        await github.rest.issues.removeLabel({
          ...context.repo,
          issue_number: issue.number,
          name: "autorelease: pending",
        });
      }
    }
  }
}

module.exports = { ReleaseArtifacts };

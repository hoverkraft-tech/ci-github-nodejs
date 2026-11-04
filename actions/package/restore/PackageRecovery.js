const { createHash } = require("node:crypto");
const fs = require("node:fs");

class PackageRecovery {
  constructor(fetchPackage = fetch) {
    this.fetchPackage = fetchPackage;
  }

  static async verifyTarball({ exec, name, version, tarballPath }) {
    const { stdout } = await exec.getExecOutput(
      "tar",
      ["-xOf", tarballPath, "package/package.json"],
      { silent: true },
    );
    const manifest = JSON.parse(stdout);
    if (
      manifest.name !== name ||
      manifest.version !== version ||
      manifest.private
    )
      throw new Error(
        "Release tarball must contain the expected public package and release version.",
      );
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      if (
        Object.values(manifest[field] || {}).some(
          (value) =>
            typeof value === "string" && value.startsWith("workspace:"),
        )
      )
        throw new Error(
          "Release tarball contains unresolved workspace dependency references.",
        );
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
}

module.exports = { PackageRecovery };

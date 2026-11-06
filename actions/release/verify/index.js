const path = require("node:path");

function versionFromTag(tag, directory, relativeDirectory) {
  const slug = path
    .basename(directory)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const prefixes = ["", "v", ...(relativeDirectory ? [`${slug}-`] : [])];
  const version = prefixes
    .map((prefix) => (tag.startsWith(prefix) ? tag.slice(prefix.length) : ""))
    .find((candidate) =>
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(candidate),
    );
  if (!version)
    throw new Error(
      "Expected a stable version tag, optionally prefixed with v or the project directory slug.",
    );
  return version;
}

function parsePackages(input, version) {
  const packages = JSON.parse(input);
  if (!Array.isArray(packages) || !packages.length || packages.length > 256)
    throw new Error(
      "Expected a nonempty package array with at most 256 entries.",
    );
  for (const item of packages) {
    if (
      !item ||
      typeof item.name !== "string" ||
      !/^(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(item.name) ||
      item.slug !== item.name.replace(/^@/, "").replace("/", "-") ||
      typeof item.version !== "string" ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(item.version) ||
      typeof item.directory !== "string" ||
      !item.directory ||
      path.isAbsolute(item.directory) ||
      item.directory.split(/[\\/]/).includes("..")
    )
      throw new Error(
        "Expected valid package names, slugs, stable versions and relative directories.",
      );
  }
  if (new Set(packages.map((item) => item.slug)).size !== packages.length)
    throw new Error("Package slugs must be unique.");
  if (version && packages.some((item) => item.version !== version))
    throw new Error("Package versions must match the prepared release tag.");
  return packages;
}

function bindArtifacts(packages, artifactId = "", artifactsInput = "") {
  if (Boolean(artifactId) === Boolean(artifactsInput))
    throw new Error(
      "Supply either one package artifact ID or a directory-to-artifact map.",
    );
  if (artifactId && packages.length !== 1)
    throw new Error("Multiple packages require a directory-to-artifact map.");
  const artifacts = artifactsInput
    ? JSON.parse(artifactsInput)
    : { [packages[0].directory]: artifactId };
  if (!artifacts || Array.isArray(artifacts) || typeof artifacts !== "object")
    throw new Error("Package artifacts must be a directory-to-artifact map.");
  const result = packages.map((item) => {
    const id = Object.hasOwn(artifacts, item.directory)
      ? String(artifacts[item.directory])
      : "";
    if (!/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id)))
      throw new Error(
        `Missing or invalid package artifact for ${item.directory}.`,
      );
    return { ...item, artifactId: id };
  });
  if (new Set(result.map((item) => item.artifactId)).size !== result.length)
    throw new Error("Each package must have its own tarball artifact.");
  return result;
}

function prepareReleases({ context, packages, workingDirectory = "." }) {
  if (!context.ref.startsWith("refs/tags/"))
    throw new Error("Publish from the prepared release tag.");
  const sourceTag = context.ref.slice("refs/tags/".length);
  const directory = path.resolve(
    context.workspace || process.env.GITHUB_WORKSPACE,
    workingDirectory,
  );
  const relativeDirectory = path.relative(
    context.workspace || process.env.GITHUB_WORKSPACE,
    directory,
  );
  if (relativeDirectory.startsWith("..") || path.isAbsolute(relativeDirectory))
    throw new Error("Release directory must be inside the repository.");
  const releases = new Map();
  for (const item of packages) {
    const independent = item.tag === `${item.name}@${item.version}`;
    if (
      typeof item.tag !== "string" ||
      (!independent &&
        versionFromTag(item.tag, directory, relativeDirectory) !== item.version)
    )
      throw new Error("Package versions must match their release tags.");
    if (!releases.has(item.tag)) {
      releases.set(item.tag, {
        tag: item.tag,
        packageName: independent ? item.name : "",
        workingDirectory: independent
          ? path.posix.join(workingDirectory, item.directory)
          : workingDirectory,
        artifactPattern: independent
          ? `release-assets-${item.slug}`
          : "release-assets-*",
      });
    }
  }
  if (!releases.has(sourceTag))
    throw new Error("Package list must include the workflow source tag.");
  if (
    releases.size > 1 &&
    [...releases.values()].some((release) => !release.packageName)
  )
    throw new Error("Multiple releases require independent package tags.");
  return [...releases.values()];
}

module.exports = {
  parsePackages,
  bindArtifacts,
  prepareReleases,
};

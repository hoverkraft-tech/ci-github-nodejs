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
  if (!Array.isArray(packages) || packages.length !== 1)
    throw new Error("Expected exactly one public npm package.");
  for (const item of packages) {
    if (
      !item ||
      typeof item.name !== "string" ||
      !/^(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(item.name) ||
      item.slug !== item.name.replace(/^@/, "").replace("/", "-") ||
      typeof item.version !== "string" ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(item.version) ||
      item.directory !== "."
    )
      throw new Error(
        "Expected a valid package name, slug, stable version and root package directory.",
      );
  }
  if (version && packages.some((item) => item.version !== version))
    throw new Error("Package versions must match the prepared release tag.");
  return packages;
}

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

async function verifyReleases({
  github,
  context,
  packages,
  workingDirectory = ".",
}) {
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
  const [item] = parsePackages(JSON.stringify(packages));
  if (item.tag !== sourceTag)
    throw new Error("Package tag must match the workflow source tag.");
  if (versionFromTag(sourceTag, directory, relativeDirectory) !== item.version)
    throw new Error("Package version must match the release tag.");
  const { data: commit } = await github.rest.repos.getCommit({
    ...context.repo,
    ref: sourceTag,
  });
  if (commit.sha !== context.sha)
    throw new Error("Release tag must identify the prepared source commit.");
  const release = await findRelease(github, context.repo, sourceTag);
  return [{ tag: sourceTag, published: Boolean(release && !release.draft) }];
}

async function verifyBuild({ github, context, buildArtifactId }) {
  if (
    !/^[1-9][0-9]*$/.test(buildArtifactId) ||
    !Number.isSafeInteger(Number(buildArtifactId))
  )
    throw new Error("Expected one positive build artifact ID.");
  const { data: artifact } = await github.rest.actions.getArtifact({
    ...context.repo,
    artifact_id: Number(buildArtifactId),
  });
  if (
    artifact.expired ||
    artifact.workflow_run?.id !== context.runId ||
    artifact.workflow_run?.head_sha !== context.sha
  )
    throw new Error(
      "Build artifact must be unexpired and belong to this run and prepared commit.",
    );
}

module.exports = { parsePackages, verifyReleases, verifyBuild };

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

function validateVersion(version, current) {
  const previous = current.split(".").map(BigInt);
  const difference = version
    .split(".")
    .map((part, index) => BigInt(part) - previous[index])
    .find((part) => part !== 0n);
  if (difference < 0n) {
    throw new Error(
      "Planned version is older than the committed version; reconcile the release history and configuration.",
    );
  }
}

async function pushRelease({ github, context, exec, directory, tags }) {
  const git = async (...args) => {
    const { stdout, stderr, exitCode } = await exec.getExecOutput("git", args, {
      cwd: directory,
      silent: true,
      ignoreReturnCode: true,
    });
    if (exitCode !== 0)
      throw new Error(
        stderr.trim() || `git failed with exit code ${exitCode}.`,
      );
    return stdout.trim();
  };
  const branch = context.payload.repository.default_branch;
  if ((await git("rev-parse", "HEAD")) !== context.sha) {
    throw new Error("Release preparation must start from the planned source.");
  }
  if (
    !Array.isArray(tags) ||
    !tags.length ||
    new Set(tags).size !== tags.length
  ) {
    throw new Error("Expected unique release tags.");
  }
  for (const tag of tags) await git("check-ref-format", `refs/tags/${tag}`);
  await git("check-ref-format", `refs/heads/${branch}`);

  let commit = context.sha;
  const tree = await git("write-tree");
  const baseTree = await git("rev-parse", `${context.sha}^{tree}`);
  if (tree !== baseTree) {
    const changes = (
      await git(
        "diff",
        "--cached",
        "--raw",
        "--no-abbrev",
        "--no-renames",
        "-z",
      )
    ).split("\0");
    const entries = [];
    for (let index = 0; index < changes.length - 1; index += 2) {
      const [, mode, , sha] = changes[index].split(" ");
      const path = changes[index + 1];
      if (mode === "000000") {
        entries.push({ path, mode: "100644", type: "blob", sha: null });
        continue;
      }
      if (!["100644", "100755", "120000"].includes(mode)) {
        throw new Error(`Unsupported release file mode: ${mode}`);
      }
      const chunks = [];
      await exec.exec("git", ["cat-file", "blob", sha], {
        cwd: directory,
        silent: true,
        listeners: { stdout: (chunk) => chunks.push(chunk) },
      });
      const content = Buffer.concat(chunks).toString("base64");
      const { data: blob } = await github.rest.git.createBlob({
        ...context.repo,
        content,
        encoding: "base64",
      });
      if (blob.sha !== sha)
        throw new Error("Release blob does not match staged bytes.");
      entries.push({ path, mode, type: "blob", sha });
    }
    const { data: createdTree } = await github.rest.git.createTree({
      ...context.repo,
      base_tree: baseTree,
      tree: entries,
    });
    if (createdTree.sha !== tree)
      throw new Error("Release tree does not match staged files.");
    // GitHub signs App/bot commits when no custom author, committer or signature is supplied.
    const { data: createdCommit } = await github.rest.git.createCommit({
      ...context.repo,
      message: `chore(release): ${tags.join(", ")}`,
      tree,
      parents: [context.sha],
    });
    if (!createdCommit.verification?.verified) {
      throw new Error(
        "GitHub did not verify the release commit signature; use a GitHub App installation token.",
      );
    }
    commit = createdCommit.sha;
    await git("fetch", "--no-tags", "origin", commit);
    if (
      (await git("rev-parse", `${commit}^{tree}`)) !== tree ||
      (await git("rev-parse", `${commit}^`)) !== context.sha
    ) {
      throw new Error(
        "Signed release commit does not match the planned source and files.",
      );
    }
  }
  for (const tag of tags) await git("tag", tag, commit);
  await git(
    "push",
    "--atomic",
    `--force-with-lease=refs/heads/${branch}:${context.sha}`,
    "origin",
    `${commit}:refs/heads/${branch}`,
    ...tags.map((tag) => `refs/tags/${tag}`),
  );
  return commit;
}

module.exports = {
  versionFromTag,
  parsePackages,
  findRelease,
  validateVersion,
  pushRelease,
};

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

class ReleaseProject {
  constructor({
    workspace,
    workingDirectory = ".",
    versioning = "npm",
    github,
    context,
  }) {
    this.workspace = fs.realpathSync(workspace);
    this.directory = fs.realpathSync(path.resolve(workspace, workingDirectory));
    this.relativeDirectory = path.relative(this.workspace, this.directory);
    if (
      this.relativeDirectory.startsWith("..") ||
      path.isAbsolute(this.relativeDirectory)
    ) {
      throw new Error(
        "Release working directory must be inside the repository.",
      );
    }
    if (!["lerna", "npm"].includes(versioning)) {
      throw new Error("versioning must be npm or lerna.");
    }
    this.versioning = versioning;
    this.github = github;
    this.context = context;
    const manifest = this.readJson("package.json");
    if (versioning === "npm" && (manifest.workspaces || manifest.private)) {
      throw new Error(
        "npm mode requires one public package; use lerna for fixed-version workspaces.",
      );
    }
    this.version();
  }

  readJson(file) {
    return JSON.parse(fs.readFileSync(path.join(this.directory, file), "utf8"));
  }

  run(command, args) {
    return execFileSync(command, args, {
      cwd: this.directory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, CI: "true" },
    }).trim();
  }

  git(...args) {
    return this.run("git", args);
  }

  version() {
    const { version } = this.readJson(
      this.versioning === "lerna" ? "lerna.json" : "package.json",
    );
    if (
      typeof version !== "string" ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
    ) {
      throw new Error(
        "Releases require a stable version; independent Lerna versions and prereleases are not supported.",
      );
    }
    return version;
  }

  packages(tag) {
    const version = this.version();
    if (this.versionFromTag(tag) !== version)
      throw new Error("Release tag must match the committed package version.");
    const candidates =
      this.versioning === "lerna"
        ? JSON.parse(
            this.run("npm", [
              "exec",
              "--no",
              "--",
              "lerna",
              "list",
              "--all",
              "--json",
              "--loglevel",
              "silent",
            ]),
          )
        : [{ ...this.readJson("package.json"), location: this.directory }];
    const packages = candidates
      .filter((item) => !item.private && item.version === version)
      .map((item) => {
        if (
          typeof item.name !== "string" ||
          !/^(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(item.name)
        ) {
          throw new Error("Release packages must have valid npm names.");
        }
        const directory = path.relative(
          this.directory,
          fs.realpathSync(item.location),
        );
        if (directory.startsWith("..") || path.isAbsolute(directory))
          throw new Error("Package is outside the release working directory.");
        return {
          name: item.name,
          version,
          directory: directory || ".",
          slug: item.name.replace(/^@/, "").replace("/", "-"),
        };
      });
    if (
      !packages.length ||
      new Set(packages.map((item) => item.slug)).size !== packages.length
    ) {
      throw new Error(
        "Expected uniquely named public packages at the release version.",
      );
    }
    return packages;
  }

  tagCommit(tag) {
    try {
      return this.git("rev-parse", "--verify", `${tag}^{commit}`);
    } catch {
      return undefined;
    }
  }

  versionFromTag(tag) {
    const slug = path
      .basename(this.directory)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const prefixes = ["", "v", ...(this.relativeDirectory ? [`${slug}-`] : [])];
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

  currentTag() {
    if (this.context.ref.startsWith("refs/tags/"))
      return this.context.ref.slice("refs/tags/".length);
    if (
      this.context.ref !==
      `refs/heads/${this.context.payload.repository.default_branch}`
    ) {
      throw new Error(
        "Run releases from the default branch or an existing release tag.",
      );
    }
    const tags = this.git("tag", "--points-at", this.context.sha)
      .split("\n")
      .filter((tag) => {
        try {
          return this.versionFromTag(tag) === this.version();
        } catch {
          return false;
        }
      });
    if (tags.length > 1)
      throw new Error(
        "Several release tags match this commit; resume the intended tag explicitly.",
      );
    return tags[0];
  }

  prepareVersion({ tag, body }) {
    const version = this.versionFromTag(tag);
    const current = this.version();
    const previousParts = current.split(".").map(BigInt);
    const parts = version.split(".").map(BigInt);
    const difference = parts
      .map((part, index) => part - previousParts[index])
      .find((part) => part !== 0n);
    if (!difference || difference < 0n)
      throw new Error(
        "Planned version must be newer than the committed version; reconcile the release history and configuration.",
      );
    if (this.tagCommit(tag))
      throw new Error(`Existing tag ${tag} must not be overwritten.`);
    if (typeof body !== "string" || !body.trim())
      throw new Error(
        "Upstream release notes are required before preparing source files.",
      );
    const branch = this.context.payload.repository.default_branch;
    this.git("switch", "--force-create", branch, this.context.sha);
    if (this.git("status", "--porcelain"))
      throw new Error(
        "Release source must be clean before applying the planned version.",
      );
    this.git("config", "user.name", "github-actions[bot]");
    this.git(
      "config",
      "user.email",
      "41898282+github-actions[bot]@users.noreply.github.com",
    );
    if (this.versioning === "lerna") {
      this.run("npm", [
        "exec",
        "--no",
        "--",
        "lerna",
        "version",
        version,
        "--conventional-commits",
        "--tag-version-prefix",
        tag.slice(0, -version.length),
        "--no-git-tag-version",
        "--no-push",
        "--yes",
      ]);
      if (this.version() === current) return { status: "no-changes" };
    } else {
      this.run("npm", [
        "version",
        version,
        "--no-git-tag-version",
        "--ignore-scripts",
      ]);
    }
    if (this.version() !== version)
      throw new Error("Version preparation did not apply the planned version.");
    const changelog = path.join(this.directory, "CHANGELOG.md");
    const previous = fs.existsSync(changelog)
      ? fs.readFileSync(changelog, "utf8").replace(/^# Changelog\s*/i, "")
      : "";
    fs.writeFileSync(
      changelog,
      `# Changelog\n\n## ${tag}\n\n${body.trim()}\n\n${previous}`,
    );
    this.git("add", "--all", "--", ".");
    this.git("commit", "-m", `chore(release): ${tag}`);
    this.git("tag", tag);
    this.git(
      "push",
      "--atomic",
      "origin",
      `HEAD:refs/heads/${branch}`,
      `refs/tags/${tag}`,
    );
    return { tag };
  }

  async prepare({ workflowRef, findRelease, plan }) {
    const { ref, payload, repo } = this.context;
    if (ref.startsWith("refs/tags/")) {
      const tag = ref.slice("refs/tags/".length);
      const packages = this.packages(tag);
      const release = await findRelease(this.github, repo, tag);
      return {
        status: "ready",
        tag,
        packages,
        published: Boolean(release && !release.draft),
      };
    }
    if (ref !== `refs/heads/${payload.repository.default_branch}`) {
      throw new Error(
        "Run releases from the default branch or an existing release tag.",
      );
    }
    const currentTag = this.currentTag();
    if (!currentTag && !plan)
      throw new Error("An upstream release plan is required.");
    if (!currentTag && !plan.hasChanges) return { status: "no-changes" };
    const result = currentTag ? { tag: currentTag } : this.prepareVersion(plan);
    if (!result.tag) return result;
    const release = await findRelease(this.github, repo, result.tag);
    if (release && !release.draft) {
      return { ...result, status: "released", url: release.html_url };
    }
    const prefix = `${repo.owner}/${repo.repo}/`;
    const workflow = workflowRef.startsWith(prefix)
      ? workflowRef.slice(prefix.length).split("@")[0]
      : "";
    if (!/^\.github\/workflows\/[^/]+\.ya?ml$/.test(workflow))
      throw new Error(
        "Cannot determine the caller workflow for publication dispatch.",
      );
    await this.github.rest.actions.createWorkflowDispatch({
      ...repo,
      workflow_id: workflow,
      ref: result.tag,
    });
    return { ...result, status: "dispatched" };
  }
}

module.exports = { ReleaseProject };

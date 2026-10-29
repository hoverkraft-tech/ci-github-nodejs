const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { ReleaseArtifacts } = require("./ReleaseArtifacts.js");

class ReleaseProject {
  constructor({
    workspace,
    workingDirectory = ".",
    versioning,
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
    if (!["lerna", "release-please"].includes(versioning)) {
      throw new Error("versioning must be lerna or release-please.");
    }
    this.versioning = versioning;
    this.github = github;
    this.context = context;
    const manifest = this.readJson("package.json");
    if (
      versioning === "release-please" &&
      (manifest.workspaces || manifest.private)
    ) {
      throw new Error(
        "release-please mode requires one public package; use lerna for fixed-version workspaces.",
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
    if (tag !== `v${version}`)
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

  async releaseRequests(state = "all") {
    const issues = await this.github.paginate(
      this.github.rest.issues.listForRepo,
      {
        ...this.context.repo,
        labels: "autorelease: pending",
        state,
        per_page: 100,
      },
    );
    const requests = [];
    for (const issue of issues.filter((item) => item.pull_request)) {
      const { data } = await this.github.rest.pulls.get({
        ...this.context.repo,
        pull_number: issue.number,
      });
      if (data.base.ref === this.context.payload.repository.default_branch)
        requests.push(data);
    }
    return requests.sort((a, b) =>
      (a.merged_at || "").localeCompare(b.merged_at || ""),
    );
  }

  async prepareReleasePlease() {
    const requests = await this.releaseRequests();
    const merged = requests.find((request) => request.merged_at);
    if (!merged) {
      const open = requests.find((request) => request.state === "open");
      return {
        status: open ? "awaiting-review" : "no-changes",
        url: open?.html_url || "",
      };
    }
    this.git(
      "merge-base",
      "--is-ancestor",
      merged.merge_commit_sha,
      this.context.sha,
    );
    this.git("checkout", "--detach", merged.merge_commit_sha);
    const tag = `v${this.version()}`;
    const existing = this.tagCommit(tag);
    if (existing && existing !== merged.merge_commit_sha)
      throw new Error(`Existing tag ${tag} points to another commit.`);
    if (!existing) this.git("tag", tag, merged.merge_commit_sha);
    this.git("push", "origin", `refs/tags/${tag}`);
    return { tag };
  }

  prepareLerna() {
    const branch = this.context.payload.repository.default_branch;
    this.git("switch", "--force-create", branch, this.context.sha);
    this.git("config", "user.name", "github-actions[bot]");
    this.git(
      "config",
      "user.email",
      "41898282+github-actions[bot]@users.noreply.github.com",
    );
    let tag = `v${this.version()}`;
    if (this.tagCommit(tag) !== this.git("rev-parse", "HEAD")) {
      this.run("npm", [
        "exec",
        "--no",
        "--",
        "lerna",
        "version",
        "--conventional-commits",
        "--no-push",
        "--yes",
        "--message",
        "chore(release): %s",
      ]);
      if (this.git("rev-parse", "HEAD") === this.context.sha)
        return { status: "no-changes" };
      tag = `v${this.version()}`;
    }
    if (this.tagCommit(tag) !== this.git("rev-parse", "HEAD"))
      throw new Error("Release tag does not match the prepared commit.");
    this.git(
      "push",
      "--atomic",
      "origin",
      `HEAD:refs/heads/${branch}`,
      `refs/tags/${tag}`,
    );
    return { tag };
  }

  async prepare({ workflowRef, findRelease }) {
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
    const result =
      this.versioning === "lerna"
        ? this.prepareLerna()
        : await this.prepareReleasePlease();
    if (!result.tag) return result;
    const release = await findRelease(this.github, repo, result.tag);
    if (release && !release.draft) {
      if (this.versioning === "release-please") {
        await new ReleaseArtifacts().markReleaseRequests({
          github: this.github,
          context: { ...this.context, sha: this.git("rev-parse", "HEAD") },
        });
      }
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

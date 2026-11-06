const fs = require("node:fs");
const path = require("node:path");
const { versionFromTag, validateVersion } = require("./index.js");

class ReleaseProject {
  constructor({
    workspace,
    workingDirectory = ".",
    packageDirectory = ".",
    versioning = "npm",
    force = false,
    context,
    exec,
  }) {
    this.exec = exec;
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
    this.packageDirectory = fs.realpathSync(
      path.resolve(this.directory, packageDirectory),
    );
    this.relativePackageDirectory = path.relative(
      this.directory,
      this.packageDirectory,
    );
    if (
      this.relativePackageDirectory.startsWith("..") ||
      path.isAbsolute(this.relativePackageDirectory)
    )
      throw new Error(
        "Package directory must be inside the release working directory.",
      );
    if (versioning === "lerna" && this.relativePackageDirectory)
      throw new Error(
        "package-directory selects one npm package; Lerna selects its public workspaces.",
      );
    this.context = context;
    this.force =
      force &&
      context.eventName === "workflow_dispatch" &&
      context.ref === `refs/heads/${context.payload.repository.default_branch}`;
    const manifest = this.readJson(
      path.join(this.relativePackageDirectory, "package.json"),
    );
    if (versioning === "npm" && (manifest.workspaces || manifest.private)) {
      throw new Error(
        "npm mode requires one public package; select package-directory or use lerna for workspaces.",
      );
    }
    if (
      versioning === "npm" &&
      !this.relativePackageDirectory &&
      (!["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml"].some(
        (file) => fs.existsSync(path.join(this.directory, file)),
      ) ||
        (manifest.packageManager &&
          !/^(npm|pnpm)@/.test(manifest.packageManager)))
    )
      throw new Error(
        "A standalone release package requires its own npm or pnpm lockfile.",
      );
    this.version();
  }

  get independent() {
    return (
      this.versioning === "lerna" &&
      this.readJson("lerna.json").version === "independent"
    );
  }

  readJson(file) {
    return JSON.parse(fs.readFileSync(path.join(this.directory, file), "utf8"));
  }

  async run(command, args) {
    const { stdout, stderr, exitCode } = await this.exec.getExecOutput(
      command,
      args,
      {
        cwd: this.directory,
        silent: true,
        ignoreReturnCode: true,
        env: { ...process.env, CI: "true" },
      },
    );
    if (exitCode !== 0)
      throw new Error(
        stderr.trim() || `${command} failed with exit code ${exitCode}.`,
      );
    return stdout.trim();
  }

  git(...args) {
    return this.run("git", args);
  }

  version() {
    const { version } = this.readJson(
      this.versioning === "lerna"
        ? "lerna.json"
        : path.join(this.relativePackageDirectory, "package.json"),
    );
    if (this.independent) return version;
    if (
      typeof version !== "string" ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
    ) {
      throw new Error(
        "Releases require a stable version; prereleases are not supported.",
      );
    }
    return version;
  }

  async listPackages() {
    return (
      this.versioning === "lerna"
        ? JSON.parse(
            await this.run("npm", [
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
        : [
            {
              ...this.readJson(
                path.join(this.relativePackageDirectory, "package.json"),
              ),
              location: this.packageDirectory,
            },
          ]
    ).filter((item) => !item.private);
  }

  async packages(tag) {
    const version = this.version();
    if (!this.independent && this.versionFromTag(tag) !== version)
      throw new Error("Release tag must match the committed package version.");
    const tags = (
      await this.git(
        "tag",
        "--points-at",
        (await this.tagCommit(tag)) || this.context.sha,
      )
    ).split("\n");
    const packages = (await this.listPackages())
      .filter((item) =>
        this.independent
          ? tags.includes(`${item.name}@${item.version}`)
          : item.version === version,
      )
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
          version: item.version,
          tag: this.independent ? `${item.name}@${item.version}` : tag,
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
    if (!packages.some((item) => item.tag === tag))
      throw new Error(
        "Release tag must identify a public package at the committed version.",
      );
    return packages;
  }

  async tagCommit(tag) {
    try {
      return await this.git("rev-parse", "--verify", `${tag}^{commit}`);
    } catch {
      return undefined;
    }
  }

  versionFromTag(tag) {
    return versionFromTag(tag, this.directory, this.relativeDirectory);
  }

  async currentTag() {
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
    if (this.force) return undefined;
    const tags = (await this.git("tag", "--points-at", this.context.sha))
      .split("\n")
      .filter((tag) => {
        try {
          return this.independent
            ? /^(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*@\d+\.\d+\.\d+$/.test(tag)
            : this.versionFromTag(tag) === this.version();
        } catch {
          return false;
        }
      });
    if (tags.length > 1 && !this.independent)
      throw new Error(
        "Several release tags match this commit; resume the intended tag explicitly.",
      );
    return tags[0];
  }

  async prepareVersion({ tag }) {
    let version = this.versionFromTag(tag);
    const current = this.version();
    validateVersion(version, current);
    if (this.force && version === current) {
      const [major, minor, patch] = current.split(".");
      version = `${major}.${minor}.${BigInt(patch) + 1n}`;
      tag = `${tag.slice(0, -current.length)}${version}`;
    }
    if (await this.tagCommit(tag))
      throw new Error(`Existing tag ${tag} must not be overwritten.`);
    if (this.versioning === "lerna" && version === current) {
      return { tag, tags: [tag] };
    }
    if (this.versioning === "lerna") {
      await this.versionLerna([
        version,
        "--tag-version-prefix",
        tag.slice(0, -version.length),
        ...(this.force ? ["--no-private"] : []),
      ]);
      if (this.version() === current) return { status: "no-changes" };
    } else {
      const args = [
        "version",
        version,
        "--allow-same-version",
        "--no-git-tag-version",
        "--ignore-scripts",
      ];
      if (this.relativePackageDirectory)
        args.push("--workspace", this.relativePackageDirectory);
      const pnpm = fs.existsSync(path.join(this.directory, "pnpm-lock.yaml"));
      if (pnpm) args.push("--no-workspaces-update");
      await this.run("npm", args);
      if (pnpm)
        await this.run("pnpm", [
          "install",
          "--lockfile-only",
          "--no-frozen-lockfile",
          "--ignore-scripts",
        ]);
    }
    if (this.version() !== version)
      throw new Error("Version preparation did not apply the planned version.");
    return { tag, tags: [tag] };
  }

  async versionLerna(args = []) {
    await this.run("npm", [
      "exec",
      "--no",
      "--",
      "lerna",
      "version",
      ...args,
      ...(this.force ? ["--force-publish"] : []),
      "--conventional-commits",
      "--no-changelog",
      "--no-git-tag-version",
      "--no-push",
      "--yes",
      "--ignore-scripts",
    ]);
  }

  async prepareIndependent() {
    const previous = new Map(
      (await this.listPackages()).map((item) => [item.name, item.version]),
    );
    if (
      [...previous.values()].some(
        (version) =>
          !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version),
      )
    )
      throw new Error("Independent releases require stable package versions.");
    await this.versionLerna(["--no-private"]);
    const changed = (await this.listPackages()).filter(
      (item) => item.version !== previous.get(item.name),
    );
    if (!changed.length) return { status: "no-changes" };
    const tags = [];
    for (const item of changed) {
      if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(item.version))
        throw new Error(
          "Independent releases require stable package versions.",
        );
      const tag = `${item.name}@${item.version}`;
      if (await this.tagCommit(tag))
        throw new Error(`Existing tag ${tag} must not be overwritten.`);
      tags.push(tag);
    }
    return { tag: tags[0], tags };
  }
}

module.exports = { ReleaseProject };

const path = require("node:path");

class PackageArtifacts {
  constructor({ github, context }) {
    this.github = github;
    this.context = context;
  }

  parse(input) {
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
    return packages;
  }

  matches(artifact, item) {
    const prefix = `npm-${item.slug}-${this.context.runId}-`;
    return (
      artifact.name.startsWith(prefix) &&
      /^[1-9]\d*\.tgz$/.test(artifact.name.slice(prefix.length))
    );
  }

  validateArtifact(artifact, item) {
    if (
      !this.matches(artifact, item) ||
      artifact.expired ||
      artifact.workflow_run?.id !== this.context.runId
    )
      throw new Error(
        `Package ${item.name} must use an unexpired CI artifact from this run.`,
      );
  }

  async collect(input) {
    const packages = this.parse(input);
    const artifacts = await this.github.paginate(
      this.github.rest.actions.listWorkflowRunArtifacts,
      {
        ...this.context.repo,
        run_id: this.context.runId,
        per_page: 100,
      },
    );
    return packages.map((item) => {
      // Successful matrix jobs from earlier attempts remain valid on a failed-job rerun.
      const artifact = artifacts
        .filter((candidate) => this.matches(candidate, item))
        .sort((a, b) => b.id - a.id)[0];
      if (!artifact) throw new Error(`No CI tarball found for ${item.name}.`);
      this.validateArtifact(artifact, item);
      return {
        ...item,
        "artifact-id": artifact.id,
        "artifact-name": artifact.name,
      };
    });
  }

  async verify(input, version) {
    const packages = this.parse(input);
    for (const item of packages) {
      if (item.version !== version)
        throw new Error(
          "CI package version must match the prepared release tag.",
        );
      if (!Number.isSafeInteger(item["artifact-id"]) || item["artifact-id"] < 1)
        throw new Error("Expected a positive CI artifact ID.");
      const { data: artifact } = await this.github.rest.actions.getArtifact({
        ...this.context.repo,
        artifact_id: item["artifact-id"],
      });
      this.validateArtifact(artifact, item);
      if (artifact.workflow_run.head_sha !== this.context.sha)
        throw new Error("CI artifact must come from this prepared commit.");
      if (item["artifact-name"] !== artifact.name)
        throw new Error("CI artifact filename does not match its ID.");
    }
    return packages;
  }
}

module.exports = { PackageArtifacts };

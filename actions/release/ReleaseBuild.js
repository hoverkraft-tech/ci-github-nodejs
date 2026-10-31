const { randomUUID } = require("node:crypto");
const path = require("node:path");

class ReleaseBuild {
  constructor(workingDirectory) {
    this.workingDirectory = workingDirectory;
  }

  configure(input) {
    const build = JSON.parse(input);
    if (!build || Array.isArray(build) || typeof build !== "object") {
      throw new Error("build must be a JSON object.");
    }
    const commands = ReleaseBuild.strings(
      build.commands ?? ["build"],
      "commands",
    );
    const env = build.env ?? {};
    if (Array.isArray(env) || typeof env !== "object") {
      throw new Error("build.env must be an object.");
    }
    const artifactPaths = build.artifact?.paths ?? build.artifact;
    const paths = ReleaseBuild.strings(
      typeof artifactPaths === "string"
        ? artifactPaths.split("\n")
        : artifactPaths,
      "artifact paths",
    ).map((artifact) => {
      // Keep the complete path when upload-artifact strips the glob prefix.
      // Package and documentation jobs restore this artifact to /.
      return path
        .resolve(this.workingDirectory, artifact)
        .replace(/^\/([^/]+)/, "/*$1");
    });
    return {
      commands: commands.join("\n"),
      env: JSON.stringify(env),
      artifact: JSON.stringify({
        name: `release-build-${randomUUID()}`,
        paths: paths.join("\n"),
      }),
    };
  }

  static strings(value, name) {
    if (
      !Array.isArray(value) ||
      !value.length ||
      value.some((item) => typeof item !== "string" || !item.trim())
    ) {
      throw new Error(`build.${name} must contain nonempty strings.`);
    }
    return value.map((item) => item.trim());
  }
}

module.exports = { ReleaseBuild };

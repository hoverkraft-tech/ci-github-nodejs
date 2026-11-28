const fs = require("node:fs");
const path = require("node:path");

/** Build the producer contract before any project check executes. */
const ReportDefinition = {
  paths(value) {
    const paths = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!paths.length)
      throw new Error("Required report paths must not be empty.");
    return paths;
  },

  create({
    kind,
    workspace,
    directory,
    runtime,
    sourceSha,
    sourcePrefix,
    mapping,
    results,
    coverage,
    coveragePaths,
    shards,
  }) {
    const relative = path
      .relative(workspace, directory)
      .split(path.sep)
      .join("/");
    const outside =
      relative === ".." ||
      relative.startsWith("../") ||
      path.isAbsolute(relative);
    if (outside && (!sourceSha || !sourcePrefix)) {
      throw new Error(
        "A prebuilt container requires source-sha and source-prefix, and a checkout of that source in GITHUB_WORKSPACE.",
      );
    }
    const project = outside ? sourcePrefix : relative || ".";
    const mappings = mapping ? JSON.parse(mapping) : {};
    if (!mappings || typeof mappings !== "object" || Array.isArray(mappings))
      throw new Error("path-mapping must be a JSON object.");
    if (outside) mappings[directory.replace(/\/$/, "")] = project;
    const reports = ReportDefinition.paths(results).map((pattern) => ({
      kind,
      pattern,
    }));
    if (kind === "test" && coverage === "true") {
      const language = fs.existsSync(path.join(directory, "tsconfig.json"))
        ? "TypeScript"
        : "JavaScript";
      const count = shards ? Number(shards) : 0;
      if (count && (!Number.isSafeInteger(count) || count < 2 || count > 256))
        throw new Error("Invalid merged shard count.");
      reports.push(
        ...ReportDefinition.paths(coveragePaths).map((pattern) => ({
          kind: "coverage",
          pattern,
          language,
          ...(count
            ? {
                shards: {
                  expected: Array.from({ length: count }, (_, index) =>
                    String(index + 1),
                  ),
                  included: Array.from({ length: count }, (_, index) =>
                    String(index + 1),
                  ),
                },
              }
            : {}),
        })),
      );
    }
    return {
      name: kind === "test" ? "Node.js tests" : "Node.js lint",
      project,
      variant: { runtime },
      reports,
      "path-mapping": mappings,
      ...(sourceSha ? { source: { sha: sourceSha } } : {}),
    };
  },
};
module.exports = { ReportDefinition };

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["fixtures/vitest/*.fixture.js"],
    reporters: ["default", "json"],
    outputFile: {
      json: `${process.env.CI_REPORTS_DIR || "coverage/sharding"}/results.json`,
    },
    coverage: {
      enabled: process.env.CI_TEST_COVERAGE !== "false",
      provider: "v8",
      include: ["fixtures/vitest/source.js"],
      reporter:
        process.env.CI_TEST_MERGE === "true" ? ["text", "lcovonly"] : ["text"],
      reportsDirectory: process.env.CI_REPORTS_DIR
        ? `${process.env.CI_REPORTS_DIR}/coverage`
        : "coverage/sharding",
      reportOnFailure: true,
      thresholds: process.env.CI_TEST_SHARD
        ? undefined
        : {
            lines: Number(process.env.TEST_COVERAGE_THRESHOLD || "100"),
            branches: 100,
            functions: 100,
            statements: 100,
          },
    },
  },
});

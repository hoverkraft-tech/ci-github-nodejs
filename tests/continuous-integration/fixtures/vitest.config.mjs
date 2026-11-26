import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["fixtures/vitest/*.fixture.js"],
    reporters: ["default", "junit"],
    outputFile: { junit: "coverage/sharding/junit.xml" },
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["fixtures/vitest/source.js"],
      reporter: ["lcov", "json-summary", "cobertura"],
      reportsDirectory: "coverage/sharding",
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

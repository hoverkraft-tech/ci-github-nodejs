#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const readline = require("node:readline/promises");
const { stdin, stdout, stderr } = require("node:process");

const packageFilePath = process.argv[2];

if (!packageFilePath) {
  stderr.write("Usage: update-yarn-resolutions.js <package.json path>\n");
  process.exit(1);
}

const absolutePackageFilePath = path.resolve(packageFilePath);
const packageDir = path.dirname(absolutePackageFilePath);
const packageJson = JSON.parse(
  fs.readFileSync(absolutePackageFilePath, "utf8"),
);
const resolutions = packageJson.resolutions;

if (
  !resolutions ||
  typeof resolutions !== "object" ||
  Array.isArray(resolutions) ||
  Object.keys(resolutions).length === 0
) {
  stdout.write("No Yarn resolutions found\n");
  process.exit(0);
}

function inferPackageName(resolutionKey) {
  const segments = resolutionKey.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);
  const previousSegment = segments.at(-2);

  if (!lastSegment) {
    return resolutionKey;
  }

  if (previousSegment?.startsWith("@")) {
    return `${previousSegment}/${lastSegment}`;
  }

  return lastSegment;
}

function normalizeVersionRange(currentRange, latestVersion) {
  const prefixMatch = currentRange.match(/^[~^]/);
  const prefix = prefixMatch ? prefixMatch[0] : "";
  return `${prefix}${latestVersion}`;
}

function getLatestVersion(packageName) {
  const output = execFileSync(
    "npm",
    ["view", packageName, "version", "--json"],
    {
      cwd: packageDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  return JSON.parse(output);
}

function parseSelection(selection, maxIndex) {
  const normalizedSelection = selection.trim().toLowerCase();

  if (normalizedSelection === "") {
    return [];
  }

  if (normalizedSelection === "a") {
    return Array.from({ length: maxIndex }, (_, index) => index);
  }

  const indexes = normalizedSelection
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((value) => Number.parseInt(value, 10) - 1);

  if (
    indexes.length === 0 ||
    indexes.some(
      (index) => Number.isNaN(index) || index < 0 || index >= maxIndex,
    )
  ) {
    return null;
  }

  return [...new Set(indexes)];
}

async function askForSelection(updates) {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    while (true) {
      stdout.write("Outdated Yarn resolutions:\n");
      updates.forEach((update, index) => {
        stdout.write(
          `${index + 1}. ${update.resolutionKey}: ${update.currentRange} -> ${update.nextRange}\n`,
        );
      });

      const answer = await rl.question(
        "Select resolutions to update (comma-separated numbers, 'a' for all, Enter to skip): ",
      );
      const selectedIndexes = parseSelection(answer, updates.length);

      if (selectedIndexes !== null) {
        return selectedIndexes;
      }

      stdout.write("Invalid selection.\n");
    }
  } finally {
    rl.close();
  }
}

async function main() {
  const updates = Object.entries(resolutions)
    .map(([resolutionKey, currentRange]) => {
      if (typeof currentRange !== "string") {
        return null;
      }

      const packageName = inferPackageName(resolutionKey);
      const latestVersion = getLatestVersion(packageName);
      const nextRange = normalizeVersionRange(currentRange, latestVersion);

      if (nextRange === currentRange) {
        return null;
      }

      return {
        resolutionKey,
        currentRange,
        nextRange,
      };
    })
    .filter(Boolean);

  if (updates.length === 0) {
    stdout.write("All Yarn resolutions are already up to date\n");
    return;
  }

  const selectedIndexes = await askForSelection(updates);

  if (selectedIndexes.length === 0) {
    stdout.write("No Yarn resolutions selected\n");
    return;
  }

  selectedIndexes.forEach((index) => {
    const update = updates[index];
    packageJson.resolutions[update.resolutionKey] = update.nextRange;
  });

  fs.writeFileSync(
    absolutePackageFilePath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
  stdout.write(
    `Updated ${selectedIndexes.length} Yarn resolution${selectedIndexes.length === 1 ? "" : "s"}\n`,
  );
}

main().catch((error) => {
  stderr.write(`${error.message}\n`);
  process.exit(1);
});

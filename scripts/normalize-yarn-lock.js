#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { stderr, stdout } = require("node:process");

const lockFilePath = process.argv[2];

if (!lockFilePath) {
  stderr.write("Usage: normalize-yarn-lock.js <yarn.lock path>\n");
  process.exit(1);
}

const absoluteLockFilePath = path.resolve(lockFilePath);

if (!fs.existsSync(absoluteLockFilePath)) {
  stdout.write(`No lockfile found at ${lockFilePath}\n`);
  process.exit(0);
}

// Mirrors Yarn Classic's own `shouldWrapKey` so we quote exactly the keys that
// Yarn's lockfile tokenizer would otherwise misread. Yarn treats any bare token
// starting with `true`/`false` as a boolean literal, so keys such as
// `true-case-path` must be quoted. Tools like yarn-audit-fix (via synp) emit
// these dependency keys unquoted, producing a lockfile Yarn cannot parse.
function shouldWrapKey(key) {
  return (
    key.indexOf("true") === 0 ||
    key.indexOf("false") === 0 ||
    /[:\s\n\\",[\]]/.test(key) ||
    /^[0-9]/.test(key) ||
    !/^[a-zA-Z]/.test(key)
  );
}

const original = fs.readFileSync(absoluteLockFilePath, "utf8");

// Dependency reference lines look like `    <name> "<range>"`. Only unquoted
// keys (no leading quote) can be malformed, so leave already-quoted keys alone.
const dependencyLine = /^(\s+)([^\s"][^\s]*)(\s+"[^"]*")\s*$/;

let fixedCount = 0;
const normalized = original
  .split("\n")
  .map((line) => {
    const match = line.match(dependencyLine);

    if (!match) {
      return line;
    }

    const [, indent, key, rest] = match;

    if (!shouldWrapKey(key)) {
      return line;
    }

    fixedCount += 1;
    return `${indent}"${key}"${rest}`;
  })
  .join("\n");

if (fixedCount === 0) {
  stdout.write("Yarn lockfile already normalized\n");
  process.exit(0);
}

fs.writeFileSync(absoluteLockFilePath, normalized);
stdout.write(
  `Normalized ${fixedCount} Yarn lockfile key${fixedCount === 1 ? "" : "s"}\n`,
);

const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

class TestShards {
  constructor({
    workingDirectory,
    temporaryDirectory,
    group,
    shard,
    mergeShards,
    identity,
  }) {
    this.project = path.resolve(workingDirectory);
    this.group = group;
    this.identity = identity;
    this.index = 0;
    this.total = 0;
    if (shard && mergeShards)
      throw new Error("Cannot execute and merge shards together.");
    if (shard) {
      if (!/^[1-9]\d*\/[1-9]\d*$/.test(shard))
        throw new Error("shard must be index/total.");
      [this.index, this.total] = shard.split("/").map(Number);
    } else if (mergeShards) {
      if (!/^[1-9]\d*$/.test(mergeShards))
        throw new Error("merge-shards must be a shard count.");
      this.total = Number(mergeShards);
    }
    if (!this.total) return;
    if (this.total < 2 || this.total > 256 || this.index > this.total) {
      throw new Error("Sharding requires 2 to 256 shards and a valid index.");
    }
    if (!/^[\w-]+$/.test(group || ""))
      throw new Error(
        "shard-group must contain only letters, numbers, underscores and hyphens.",
      );
    if (!identity.runId || !identity.attempt || !identity.sha)
      throw new Error("Missing workflow run identity.");
    this.directory = path.join(temporaryDirectory, "ci-test-shards", group);
    this.payload = path.join(this.directory, `payload-${this.index}`);
    this.incoming = path.join(this.directory, "incoming");
    this.blobs = path.join(this.directory, "blobs");
  }

  static arguments(value) {
    const args = JSON.parse(value || "[]");
    if (
      !Array.isArray(args) ||
      args.some((arg) => typeof arg !== "string" || arg.includes("\0"))
    ) {
      throw new Error(
        "arguments must be a JSON array of strings without null bytes.",
      );
    }
    return args;
  }

  static scriptArguments(runCommand, script, args) {
    return [
      script,
      ...(runCommand === "npm run" && args.length ? ["--"] : []),
      ...args,
    ];
  }

  prepare(args) {
    if (!this.total) return args;
    if (
      args.some((arg) =>
        /^--(?:shard|merge-reports|outputFile\.blob)(?:=|$)/.test(arg),
      )
    ) {
      throw new Error(
        "Sharding owns --shard, --merge-reports and --outputFile.blob.",
      );
    }
    const target = this.index ? this.payload : this.incoming;
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(target, { recursive: true });
    if (!this.index) return [...args, `--merge-reports=${this.blobs}`];
    return [
      ...args,
      `--shard=${this.index}/${this.total}`,
      "--reporter=blob",
      `--outputFile.blob=${path.join(this.payload, "blob.json")}`,
    ];
  }

  readFile(file) {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || !stat.size)
      throw new Error(`Expected a nonempty regular file: ${file}`);
    return fs.readFileSync(file);
  }

  checksum(blob) {
    return createHash("sha256").update(blob).digest("hex");
  }

  record(exitCode) {
    if (!this.index)
      throw new Error("Only an executing shard can record a payload.");
    if (
      !/^\d+$/.test(exitCode) ||
      !Number.isInteger(Number(exitCode)) ||
      Number(exitCode) < 0 ||
      Number(exitCode) > 255
    ) {
      throw new Error("Missing or invalid shard exit code.");
    }
    const blob = this.readFile(path.join(this.payload, "blob.json"));
    const manifest = {
      version: 1,
      ...this.identity,
      project: this.project,
      group: this.group,
      index: this.index,
      total: this.total,
      exitCode: Number(exitCode),
      checksum: this.checksum(blob),
    };
    fs.writeFileSync(
      path.join(this.payload, "manifest.json"),
      JSON.stringify(manifest),
    );
  }

  validate() {
    if (this.index || !this.total)
      throw new Error("Only a merge can validate shard payloads.");
    const expected = Array.from(
      { length: this.total },
      (_, i) => `${this.group}-${i + 1}`,
    );
    const actual = fs.readdirSync(this.incoming);
    if (
      actual.length !== expected.length ||
      actual.some((name) => !expected.includes(name))
    ) {
      throw new Error(
        "Missing or unexpected shard artifacts. Rerun the complete workflow, not individual jobs.",
      );
    }
    const payloads = expected.map((name, index) =>
      this.readPayload(name, index + 1),
    );
    fs.rmSync(this.blobs, { recursive: true, force: true });
    fs.mkdirSync(this.blobs, { recursive: true });
    for (const { manifest, blob } of payloads) {
      fs.writeFileSync(path.join(this.blobs, `${manifest.index}.json`), blob);
    }
    return payloads.some(({ manifest }) => manifest.exitCode !== 0);
  }

  readPayload(name, index) {
    const directory = path.join(this.incoming, name);
    if (!fs.lstatSync(directory).isDirectory())
      throw new Error("Shard artifacts must be directories.");
    const files = fs.readdirSync(directory).sort();
    if (
      JSON.stringify(files) !== JSON.stringify(["blob.json", "manifest.json"])
    ) {
      throw new Error(
        "Each shard artifact must contain exactly one blob and manifest.",
      );
    }
    const manifest = JSON.parse(
      this.readFile(path.join(directory, "manifest.json")),
    );
    const expected = {
      version: 1,
      ...this.identity,
      project: this.project,
      group: this.group,
      index,
      total: this.total,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (manifest[key] !== value)
        throw new Error(`Shard ${index} has a mismatched ${key}.`);
    }
    if (
      !Number.isInteger(manifest.exitCode) ||
      manifest.exitCode < 0 ||
      manifest.exitCode > 255
    ) {
      throw new Error(`Shard ${index} has an invalid exit code.`);
    }
    const blob = this.readFile(path.join(directory, "blob.json"));
    if (this.checksum(blob) !== manifest.checksum)
      throw new Error(`Shard ${index} checksum does not match.`);
    return { manifest, blob };
  }
}

module.exports = { TestShards };

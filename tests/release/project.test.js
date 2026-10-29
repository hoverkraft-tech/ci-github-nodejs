const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { ReleaseProject } = require("../../actions/release/ReleaseProject.js");
const {
  ReleaseArtifacts,
} = require("../../actions/release/ReleaseArtifacts.js");

Object.assign(process.env, {
  CI: "true",
  NX_DAEMON: "false",
  NX_ISOLATE_PLUGINS: "false",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  npm_config_offline: "true",
  npm_config_audit: "false",
  npm_config_fund: "false",
});

function fixture(t, versioning = "release-please") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nodejs-release-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, "project");
  const remote = path.join(root, "remote.git");
  fs.mkdirSync(directory);
  const run = (command, args, cwd = directory) =>
    execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  const git = (...args) => run("git", args);
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    fs.writeFileSync(path.join(directory, file), content);
  };
  const json = (file, value) =>
    write(file, `${JSON.stringify(value, null, 2)}\n`);
  const commit = (message) => {
    git("add", ".");
    git("commit", "-m", message);
    return git("rev-parse", "HEAD");
  };
  git("init", "--bare", remote);
  git("init", "-b", "main");
  git("config", "user.name", "Release test");
  git("config", "user.email", "test@example.invalid");
  git("remote", "add", "origin", remote);
  write(".gitignore", "node_modules/\n.nx/\ndist/\n*.tgz\n");
  if (versioning === "lerna") {
    json("package.json", {
      name: "workspaces-test",
      private: true,
      workspaces: ["packages/*"],
    });
    json("lerna.json", { version: "1.0.0", npmClient: "npm" });
    json("packages/core/package.json", {
      name: "@example/core",
      version: "1.0.0",
    });
    json("packages/ui/package.json", {
      name: "@example/ui",
      version: "1.0.0",
      dependencies: { "@example/core": "^1.0.0" },
    });
    json("packages/private/package.json", {
      name: "@example/private",
      version: "1.0.0",
      private: true,
    });
    write("packages/core/index.js", "module.exports = 1;\n");
    run("npm", ["install", "--package-lock-only", "--ignore-scripts"]);
    fs.symlinkSync(
      path.join(__dirname, "node_modules"),
      path.join(directory, "node_modules"),
      "dir",
    );
  } else {
    json("package.json", {
      name: "@example/cli",
      version: "1.0.0",
      type: "module",
      main: "dist/index.js",
      bin: { "example-cli": "bin/example-cli" },
      files: ["dist", "bin", "CHANGELOG.md"],
      scripts: { build: "node build.js" },
    });
    write(
      "bin/example-cli",
      "#!/usr/bin/env node\nimport { version } from '../dist/index.js';\nconsole.log(version);\n",
    );
    fs.chmodSync(path.join(directory, "bin/example-cli"), 0o755);
    write(
      "build.js",
      "import fs from 'node:fs';\nconst { version } = JSON.parse(fs.readFileSync('package.json'));\nfs.mkdirSync('dist', { recursive: true });\nfs.writeFileSync('dist/index.js', 'export const version = ' + JSON.stringify(version) + ';');\n",
    );
    run("npm", ["install", "--package-lock-only", "--ignore-scripts"]);
  }
  commit("chore: initial");
  git("tag", "-a", "v1.0.0", "-m", "v1.0.0");
  git("push", "origin", "main", "--tags");
  const requests = [];
  const dispatches = [];
  const labels = [];
  const github = {
    rest: {
      issues: {
        listForRepo: () => {},
        addLabels: async (args) => labels.push(args),
        removeLabel: async (args) => labels.push(args),
      },
      pulls: {
        get: async ({ pull_number }) => ({
          data: requests.find((request) => request.number === pull_number),
        }),
      },
      actions: {
        createWorkflowDispatch: async (args) => dispatches.push(args),
      },
    },
    paginate: async () =>
      requests.map((request) => ({ number: request.number, pull_request: {} })),
  };
  const context = {
    repo: { owner: "example", repo: "project" },
    payload: { repository: { default_branch: "main" } },
    ref: "refs/heads/main",
    sha: git("rev-parse", "HEAD"),
  };
  const project = new ReleaseProject({
    workspace: directory,
    versioning,
    github,
    context,
  });
  const prepare = () =>
    project.prepare({
      workflowRef:
        "example/project/.github/workflows/release.yml@refs/heads/main",
      findRelease: async () => undefined,
    });
  return {
    root,
    directory,
    remote,
    run,
    git,
    write,
    json,
    commit,
    requests,
    dispatches,
    labels,
    github,
    context,
    project,
    prepare,
  };
}

function releaseRequest(f, properties = {}) {
  const request = {
    number: 1,
    state: "open",
    html_url: "https://example.invalid/pull/1",
    base: { ref: "main" },
    ...properties,
  };
  f.requests.push(request);
  return request;
}

test("single package waits for its release PR without dispatching publication", async (t) => {
  const f = fixture(t);
  assert.equal((await f.prepare()).status, "no-changes");
  const request = releaseRequest(f);
  assert.deepEqual(await f.prepare(), {
    status: "awaiting-review",
    url: request.html_url,
  });
  assert.equal(f.dispatches.length, 0);
});

test("single package publishes the merged release commit and packs an executable CLI", async (t) => {
  const f = fixture(t);
  f.run("npm", [
    "version",
    "1.1.0",
    "--no-git-tag-version",
    "--ignore-scripts",
  ]);
  f.write("CHANGELOG.md", "# 1.1.0\n\n* Add a command.\n");
  const releaseSha = f.commit("chore(main): release 1.1.0");
  releaseRequest(f, {
    state: "closed",
    merged_at: "2026-01-01T00:00:00Z",
    merge_commit_sha: releaseSha,
  });
  f.write("later.txt", "Later changes must not enter the release.");
  f.context.sha = f.commit("feat: later change");
  f.git("push", "origin", "main");
  assert.deepEqual(await f.prepare(), { tag: "v1.1.0", status: "dispatched" });
  assert.equal(f.project.tagCommit("v1.1.0"), releaseSha);
  assert.deepEqual(f.dispatches, [
    {
      owner: "example",
      repo: "project",
      workflow_id: ".github/workflows/release.yml",
      ref: "v1.1.0",
    },
  ]);
  assert.equal(fs.existsSync(path.join(f.directory, "later.txt")), false);
  f.context.ref = "refs/tags/v1.1.0";
  f.context.sha = releaseSha;
  const ready = await f.prepare();
  assert.equal(ready.status, "ready");
  assert.deepEqual(ready.packages, [
    {
      name: "@example/cli",
      version: "1.1.0",
      directory: ".",
      slug: "example-cli",
    },
  ]);
  f.run("npm", ["run", "build"]);
  const [packed] = JSON.parse(
    f.run("npm", ["pack", "--json", "--pack-destination", f.root]),
  );
  const files = packed.files.map((file) => file.path);
  for (const file of [
    "bin/example-cli",
    "dist/index.js",
    "CHANGELOG.md",
    "package.json",
  ])
    assert.ok(files.includes(file));
  const installed = path.join(f.root, "installed");
  fs.mkdirSync(installed);
  f.run(
    "npm",
    ["install", path.join(f.root, packed.filename), "--ignore-scripts"],
    installed,
  );
  assert.equal(
    f.run("node", [
      path.join(installed, "node_modules/@example/cli/bin/example-cli"),
    ]),
    "1.1.0",
  );
  await new ReleaseArtifacts().markReleaseRequests({
    github: f.github,
    context: f.context,
  });
  assert.deepEqual(
    f.labels.map((item) => item.labels || item.name),
    [["autorelease: tagged"], "autorelease: pending"],
  );
});

test("a single-package tag collision preserves the remote tag", async (t) => {
  const f = fixture(t);
  f.write("CHANGELOG.md", "a merged PR with an already-used version");
  f.context.sha = f.commit("chore(main): release 1.0.0");
  releaseRequest(f, {
    state: "closed",
    merged_at: "2026-01-01T00:00:00Z",
    merge_commit_sha: f.context.sha,
  });
  const original = f.project.tagCommit("v1.0.0");
  await assert.rejects(f.prepare(), /another commit/);
  assert.equal(f.project.tagCommit("v1.0.0"), original);
  assert.equal(f.dispatches.length, 0);
});

test("unmerged or unrelated release PRs cannot mark a release as complete", async (t) => {
  const f = fixture(t);
  releaseRequest(f, { merge_commit_sha: f.context.sha });
  releaseRequest(f, {
    number: 2,
    state: "closed",
    merged_at: "2026-01-01",
    merge_commit_sha: "other",
  });
  releaseRequest(f, {
    number: 3,
    state: "closed",
    merged_at: "2026-01-01",
    merge_commit_sha: f.context.sha,
    base: { ref: "other" },
  });
  await new ReleaseArtifacts().markReleaseRequests({
    github: f.github,
    context: f.context,
  });
  assert.equal(f.labels.length, 0);
});

test("branch recovery completes PR labels after publication succeeded", async (t) => {
  const f = fixture(t);
  f.run("npm", [
    "version",
    "1.0.1",
    "--no-git-tag-version",
    "--ignore-scripts",
  ]);
  f.context.sha = f.commit("chore(main): release 1.0.1");
  releaseRequest(f, {
    state: "closed",
    merged_at: "2026-01-01",
    merge_commit_sha: f.context.sha,
  });
  const result = await f.project.prepare({
    findRelease: async () => ({
      draft: false,
      html_url: "https://example.invalid/release",
    }),
  });
  assert.equal(result.status, "released");
  assert.equal(f.labels.length, 2);
  assert.equal(f.dispatches.length, 0);
});

for (const [message, version] of [
  ["fix: correct output", "1.0.1"],
  ["feat: add output", "1.1.0"],
  ["feat: change output\n\nBREAKING CHANGE: output is now structured", "2.0.0"],
]) {
  test(`Lerna infers ${version}, updates dependent packages and resumes the tag`, async (t) => {
    const f = fixture(t, "lerna");
    f.write("packages/core/index.js", "module.exports = 2;\n");
    f.context.sha = f.commit(message);
    f.git("push", "origin", "main");
    assert.deepEqual(await f.prepare(), {
      tag: `v${version}`,
      status: "dispatched",
    });
    assert.equal(f.project.readJson("lerna.json").version, version);
    assert.equal(
      f.project.readJson("packages/ui/package.json").dependencies[
        "@example/core"
      ],
      `^${version}`,
    );
    assert.equal(
      f.project.readJson("package-lock.json").packages["packages/core"].version,
      version,
    );
    assert.match(
      fs.readFileSync(
        path.join(f.directory, "packages/core/CHANGELOG.md"),
        "utf8",
      ),
      new RegExp(version.replaceAll(".", "\\.")),
    );
    f.context.sha = f.git("rev-parse", "HEAD");
    f.context.ref = `refs/tags/v${version}`;
    const ready = await f.prepare();
    assert.equal(ready.status, "ready");
    assert.deepEqual(ready.packages.map((item) => item.name).sort(), [
      "@example/core",
      "@example/ui",
    ]);
    assert.equal(f.git("rev-parse", "HEAD"), f.context.sha);
  });
}

test("Lerna skips a commit that changes no packages", async (t) => {
  const f = fixture(t, "lerna");
  f.write("README.md", "Documentation only.");
  f.context.sha = f.commit("docs: describe setup");
  f.git("push", "origin", "main");
  assert.equal((await f.prepare()).status, "no-changes");
  assert.equal(f.dispatches.length, 0);
});

test("Lerna does not overwrite an existing version tag", async (t) => {
  const f = fixture(t, "lerna");
  f.git("tag", "v1.1.0");
  f.git("push", "origin", "refs/tags/v1.1.0");
  const original = f.project.tagCommit("v1.1.0");
  f.write("packages/core/index.js", "module.exports = 2;\n");
  f.context.sha = f.commit("feat: add output");
  f.git("push", "origin", "main");
  await assert.rejects(f.prepare());
  assert.equal(f.project.tagCommit("v1.1.0"), original);
  assert.equal(
    f.run("git", ["rev-parse", "refs/heads/main"], f.remote),
    f.context.sha,
  );
});

test("an advancing default branch rejects both the Lerna commit and tag push", async (t) => {
  const f = fixture(t, "lerna");
  f.write("packages/core/index.js", "module.exports = 2;\n");
  f.context.sha = f.commit("feat: add output");
  f.git("push", "origin", "main");
  f.write("later.txt", "concurrent main commit");
  const advanced = f.commit("docs: update main");
  f.git("push", "origin", "main");
  await assert.rejects(f.prepare());
  assert.equal(
    f.run("git", ["rev-parse", "refs/heads/main"], f.remote),
    advanced,
  );
  assert.throws(() =>
    f.run("git", ["rev-parse", "refs/tags/v1.1.0"], f.remote),
  );
});

test("published releases skip dispatch and tag recovery preserves their notes", async (t) => {
  const f = fixture(t, "lerna");
  const release = { draft: false, html_url: "https://example.invalid/release" };
  const result = await f.project.prepare({
    workflowRef: "",
    findRelease: async () => release,
  });
  assert.equal(result.status, "released");
  assert.equal(f.dispatches.length, 0);
  f.context.ref = "refs/tags/v1.0.0";
  assert.equal(
    (await f.project.prepare({ findRelease: async () => release })).published,
    true,
  );
});

test("rejects unsupported layouts, versions, refs and mismatched tags", async (t) => {
  const f = fixture(t);
  assert.throws(
    () => new ReleaseProject({ workspace: f.directory, versioning: "unknown" }),
    /versioning/,
  );
  assert.throws(
    () =>
      new ReleaseProject({
        workspace: f.directory,
        workingDirectory: "..",
        versioning: "release-please",
      }),
    /inside/,
  );
  f.context.ref = "refs/heads/feature";
  await assert.rejects(f.prepare(), /default branch/);
  f.context.ref = "refs/tags/v9.0.0";
  await assert.rejects(f.prepare(), /committed package version/);
  f.json("package.json", { name: "private", private: true, version: "1.0.0" });
  assert.throws(
    () =>
      new ReleaseProject({
        workspace: f.directory,
        versioning: "release-please",
      }),
    /one public package/,
  );
  f.json("lerna.json", { version: "independent" });
  assert.throws(
    () => new ReleaseProject({ workspace: f.directory, versioning: "lerna" }),
    /stable version/,
  );
});

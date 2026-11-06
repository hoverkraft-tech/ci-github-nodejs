const assert = require("node:assert/strict");
const exec = require("@actions/exec");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { ReleaseProject } = require("./ReleaseProject.js");

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

function fixture(t, versioning = "npm", initialTag = true, force = false) {
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
      files: ["dist", "bin"],
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
  if (initialTag) git("tag", "-a", "v1.0.0", "-m", "v1.0.0");
  git("push", "origin", "main", "--tags");
  const context = {
    eventName: "workflow_dispatch",
    ref: "refs/heads/main",
    sha: git("rev-parse", "HEAD"),
    payload: { repository: { default_branch: "main" } },
  };
  const project = new ReleaseProject({
    exec,
    workspace: directory,
    versioning,
    force,
    context,
  });
  const change = (file, content, message = "feat: update package") => {
    write(file, content);
    context.sha = commit(message);
  };
  return {
    root,
    directory,
    remote,
    run,
    git,
    write,
    json,
    commit,
    context,
    project,
    change,
  };
}

test("npm applies an exact planned version to the manifest and lockfile without Git writes or changelogs", async (t) => {
  const f = fixture(t);
  const history = "# Existing history\r\n";
  f.write("CHANGELOG.md", history);
  const manifest = f.project.readJson("package.json");
  manifest.scripts.preversion = "exit 91";
  manifest.scripts.postversion = "exit 91";
  f.json("package.json", manifest);
  f.change("feature.txt", "feature");
  const head = f.git("rev-parse", "HEAD");
  assert.deepEqual(await f.project.prepareVersion({ tag: "v3.2.1" }), {
    tag: "v3.2.1",
    tags: ["v3.2.1"],
  });
  assert.equal(f.project.version(), "3.2.1");
  assert.equal(
    f.project.readJson("package-lock.json").packages[""].version,
    "3.2.1",
  );
  assert.equal(f.git("rev-parse", "HEAD"), head);
  assert.equal(await f.project.tagCommit("v3.2.1"), undefined);
  assert.equal(
    fs.readFileSync(path.join(f.directory, "CHANGELOG.md"), "utf8"),
    history,
  );
});

test("planned version validation preserves source and existing tags", async (t) => {
  const f = fixture(t);
  f.git("tag", "v1.1.0");
  f.change("feature.txt", "feature");
  for (const tag of ["v0.9.0", "v1.0.0", "v1.0.1-rc.1", "latest", "v1.1.0"]) {
    await assert.rejects(
      () => f.project.prepareVersion({ tag }),
      /older|stable version tag|Existing tag/,
    );
    assert.equal(f.project.version(), "1.0.0");
    assert.equal(f.git("status", "--porcelain"), "");
  }
});

test("forced npm releases increment an unchanged version and preserve the tag prefix", async (t) => {
  for (const prefix of ["", "v", "project-"]) {
    const f = fixture(t, "npm", true, true);
    if (prefix === "project-") {
      f.project = new ReleaseProject({
        exec,
        workspace: f.root,
        workingDirectory: "project",
        context: f.context,
        force: true,
      });
    }
    const head = f.context.sha;
    assert.equal(await f.project.currentTag(), undefined);
    assert.deepEqual(
      await f.project.prepareVersion({ tag: `${prefix}1.0.0` }),
      {
        tag: `${prefix}1.0.1`,
        tags: [`${prefix}1.0.1`],
      },
    );
    assert.equal(f.project.version(), "1.0.1");
    assert.equal(
      f.project.readJson("package-lock.json").packages[""].version,
      "1.0.1",
    );
    assert.equal(f.git("rev-parse", "HEAD"), head);
    assert.equal(await f.project.tagCommit("v1.0.0"), head);
    assert.equal(await f.project.tagCommit(`${prefix}1.0.1`), undefined);
  }
});

test("forced preparation preserves higher plans and rejects older versions and tag collisions", async (t) => {
  const f = fixture(t, "npm", true, true);
  f.git("tag", "v1.0.1");
  f.git("tag", "v1.1.0");
  for (const tag of ["v0.9.0", "v1.0.0", "v1.0.1", "v1.1.0"]) {
    await assert.rejects(
      () => f.project.prepareVersion({ tag }),
      /older|Existing tag/,
    );
    assert.equal(f.project.version(), "1.0.0");
    assert.equal(f.git("status", "--porcelain"), "");
  }
  await f.project.prepareVersion({ tag: "v2.0.0" });
  assert.equal(f.project.version(), "2.0.0");
});

test("force only applies to manual default-branch preparation and preserves tag recovery", async (t) => {
  const f = fixture(t);
  for (const eventName of ["schedule", "push", "workflow_dispatch"]) {
    for (const ref of [
      "refs/heads/main",
      "refs/heads/feature",
      "refs/tags/v1.0.0",
    ]) {
      const project = new ReleaseProject({
        exec,
        workspace: f.directory,
        context: { ...f.context, eventName, ref },
        force: true,
      });
      const forced =
        eventName === "workflow_dispatch" && ref === "refs/heads/main";
      assert.equal(project.force, forced);
      if (ref === "refs/heads/feature") {
        await assert.rejects(() => project.currentTag(), /default branch/);
      } else {
        assert.equal(await project.currentTag(), forced ? undefined : "v1.0.0");
        if (ref.startsWith("refs/tags/")) {
          assert.equal((await project.packages("v1.0.0"))[0].version, "1.0.0");
        }
      }
    }
  }
  assert.equal(await f.project.currentTag(), "v1.0.0");
  assert.equal(f.git("status", "--porcelain"), "");
});

test("already-versioned npm and fixed Lerna projects reuse their source without new commits", async (t) => {
  for (const versioning of ["npm", "lerna"]) {
    const f = fixture(t, versioning, false);
    const head = f.git("rev-parse", "HEAD");
    assert.deepEqual(await f.project.prepareVersion({ tag: "v1.0.0" }), {
      tag: "v1.0.0",
      tags: ["v1.0.0"],
    });
    assert.equal(f.project.version(), "1.0.0");
    assert.equal(f.git("rev-parse", "HEAD"), head);
    assert.equal(await f.project.tagCommit("v1.0.0"), undefined);
  }
});

test("selected npm workspace updates its lockfile without versioning private siblings", async (t) => {
  const f = fixture(t, "lerna");
  const project = new ReleaseProject({
    exec,
    workspace: f.directory,
    packageDirectory: "packages/core",
    context: f.context,
  });
  await project.prepareVersion({ tag: "v1.1.0" });
  assert.equal(project.version(), "1.1.0");
  assert.equal(
    project.readJson("package-lock.json").packages["packages/core"].version,
    "1.1.0",
  );
  assert.equal(
    project.readJson("packages/private/package.json").version,
    "1.0.0",
  );
  assert.equal(project.readJson("lerna.json").version, "1.0.0");
  assert.equal(
    (await project.packages("v1.1.0"))[0].directory,
    "packages/core",
  );
});

test("fixed Lerna applies the plan and propagates dependencies without generating changelogs", async (t) => {
  const f = fixture(t, "lerna");
  const history = "# Existing history\n";
  f.write("packages/core/CHANGELOG.md", history);
  f.change("packages/core/index.js", "module.exports = 2;\n");
  const result = await f.project.prepareVersion({ tag: "v1.1.0" });
  assert.deepEqual(result.tags, ["v1.1.0"]);
  assert.equal(f.project.version(), "1.1.0");
  assert.equal(
    f.project.readJson("packages/ui/package.json").dependencies[
      "@example/core"
    ],
    "^1.1.0",
  );
  assert.equal(
    f.project.readJson("package-lock.json").packages["packages/core"].version,
    "1.1.0",
  );
  assert.deepEqual(
    (await f.project.packages(result.tag)).map((item) => item.name).sort(),
    ["@example/core", "@example/ui"],
  );
  assert.equal(f.git("rev-parse", "HEAD"), f.context.sha);
  assert.equal(await f.project.tagCommit(result.tag), undefined);
  assert.equal(
    fs.readFileSync(
      path.join(f.directory, "packages/core/CHANGELOG.md"),
      "utf8",
    ),
    history,
  );
  assert.equal(
    fs.existsSync(path.join(f.directory, "packages/ui/CHANGELOG.md")),
    false,
  );
});

test("independent Lerna returns changed public package tags and discovers the full committed batch", async (t) => {
  const f = fixture(t, "lerna");
  f.json("lerna.json", { version: "independent", npmClient: "npm" });
  f.json("packages/ui/package.json", {
    name: "@example/ui",
    version: "2.3.0",
    dependencies: { "@example/core": "^1.0.0" },
  });
  f.run("npm", ["install", "--package-lock-only", "--ignore-scripts"]);
  const history = "# Existing history\r\n";
  f.write("CHANGELOG.md", history);
  f.write("packages/core/CHANGELOG.md", history);
  f.commit("chore: configure independent packages");
  f.git("tag", "@example/core@1.0.0");
  f.git("tag", "@example/ui@2.3.0");
  f.change(
    "packages/core/index.js",
    "module.exports = 2;\n",
    "feat(core): expose API",
  );
  const result = await f.project.prepareIndependent();
  const tags = ["@example/core@1.1.0", "@example/ui@2.3.1"];
  assert.deepEqual(result.tags.sort(), tags);
  assert.equal(
    f.project.readJson("packages/ui/package.json").dependencies[
      "@example/core"
    ],
    "^1.1.0",
  );
  assert.equal(f.git("rev-parse", "HEAD"), f.context.sha);
  for (const tag of tags)
    assert.equal(await f.project.tagCommit(tag), undefined);
  for (const directory of [".", "packages/core"])
    assert.equal(
      fs.readFileSync(
        path.join(f.directory, directory, "CHANGELOG.md"),
        "utf8",
      ),
      history,
    );
  assert.equal(
    fs.existsSync(path.join(f.directory, "packages/ui/CHANGELOG.md")),
    false,
  );
  f.context.sha = f.commit("chore(release): prepare fixture batch");
  for (const tag of tags) f.git("tag", tag);
  for (const tag of tags) {
    f.context.ref = `refs/tags/${tag}`;
    assert.deepEqual(
      (await f.project.packages(tag)).map((item) => item.tag).sort(),
      tags,
    );
  }
});

test("fixed Lerna returns no changes without versioning or tagging unchanged packages", async (t) => {
  const f = fixture(t, "lerna");
  f.change("README.md", "Documentation only.\n", "docs: describe setup");
  const source = f.context.sha;
  assert.deepEqual(await f.project.prepareVersion({ tag: "v1.0.1" }), {
    status: "no-changes",
  });
  assert.equal(f.project.version(), "1.0.0");
  assert.equal(f.git("rev-parse", "HEAD"), source);
  assert.equal(f.git("status", "--porcelain"), "");
  assert.equal(await f.project.tagCommit("v1.0.1"), undefined);
});

test("forced fixed Lerna versions every public package even at the last release commit", async (t) => {
  for (const tag of ["v1.0.0", "v1.1.0"]) {
    const f = fixture(t, "lerna", true, true);
    const expected = tag === "v1.0.0" ? "1.0.1" : "1.1.0";
    const result = await f.project.prepareVersion({ tag });
    assert.equal(f.project.version(), expected);
    assert.deepEqual(result.tags, [`v${expected}`]);
    assert.deepEqual(
      (await f.project.listPackages()).map((item) => item.version),
      [expected, expected],
    );
    assert.equal(
      f.project.readJson("packages/private/package.json").version,
      "1.0.0",
    );
    assert.equal(
      f.project.readJson("packages/ui/package.json").dependencies[
        "@example/core"
      ],
      `^${expected}`,
    );
    assert.equal(
      f.project.readJson("package-lock.json").packages["packages/core"].version,
      expected,
    );
    assert.equal(f.git("rev-parse", "HEAD"), f.context.sha);
    assert.equal(await f.project.tagCommit(result.tag), undefined);
  }
});

test("forced independent Lerna uses Conventional Commits and patch bumps unchanged public packages", async (t) => {
  for (const changed of [false, true]) {
    const f = fixture(t, "lerna", true, true);
    f.json("lerna.json", { version: "independent", npmClient: "npm" });
    f.context.sha = f.commit("chore: configure independent packages");
    f.git("tag", "@example/core@1.0.0");
    f.git("tag", "@example/ui@1.0.0");
    if (changed)
      f.change(
        "packages/core/index.js",
        "module.exports = 2;\n",
        "feat(core): expose API",
      );
    const result = await f.project.prepareIndependent();
    const coreVersion = changed ? "1.1.0" : "1.0.1";
    assert.deepEqual(result.tags.sort(), [
      `@example/core@${coreVersion}`,
      "@example/ui@1.0.1",
    ]);
    assert.equal(
      f.project.readJson("packages/private/package.json").version,
      "1.0.0",
    );
    assert.equal(
      f.project.readJson("packages/ui/package.json").dependencies[
        "@example/core"
      ],
      `^${coreVersion}`,
    );
    assert.equal(
      f.project.readJson("package-lock.json").packages["packages/core"].version,
      coreVersion,
    );
    assert.equal(f.git("rev-parse", "HEAD"), f.context.sha);
    for (const tag of result.tags)
      assert.equal(await f.project.tagCommit(tag), undefined);
  }
});

test("independent Lerna leaves packages unchanged for documentation-only commits", async (t) => {
  const f = fixture(t, "lerna");
  f.json("lerna.json", { version: "independent", npmClient: "npm" });
  f.commit("chore: configure independent packages");
  f.git("tag", "@example/core@1.0.0");
  f.git("tag", "@example/ui@1.0.0");
  f.change("README.md", "Documentation only.", "docs: describe setup");
  assert.deepEqual(await f.project.prepareIndependent(), {
    status: "no-changes",
  });
  assert.equal(f.git("status", "--porcelain"), "");
});

test("selected pnpm workspace retains workspace ranges and updates its own lockfile", async (t) => {
  const f = fixture(t, "lerna");
  fs.unlinkSync(path.join(f.directory, "package-lock.json"));
  f.write("pnpm-workspace.yaml", "packages:\n  - packages/*\n");
  f.json("packages/ui/package.json", {
    name: "@example/ui",
    version: "1.0.0",
    dependencies: { "@example/core": "workspace:^" },
  });
  f.run("pnpm", ["install", "--lockfile-only", "--ignore-scripts"]);
  f.context.sha = f.commit("feat: configure workspace CLI");
  const project = new ReleaseProject({
    exec,
    workspace: f.directory,
    packageDirectory: "packages/ui",
    context: f.context,
  });
  await project.prepareVersion({ tag: "v1.1.0" });
  assert.equal(project.version(), "1.1.0");
  assert.equal(
    project.readJson("packages/ui/package.json").dependencies["@example/core"],
    "workspace:^",
  );
  assert.equal(
    fs.existsSync(path.join(f.directory, "package-lock.json")),
    false,
  );
  assert.equal(
    f
      .run("pnpm", [
        "install",
        "--lockfile-only",
        "--frozen-lockfile",
        "--ignore-scripts",
      ])
      .includes("ERR_PNPM"),
    false,
  );
});

test("project discovery rejects unsupported directories, layouts, refs and ambiguous tags", async (t) => {
  const f = fixture(t);
  assert.throws(
    () =>
      new ReleaseProject({
        exec,
        workspace: f.directory,
        workingDirectory: "..",
      }),
    /inside/,
  );
  assert.throws(
    () =>
      new ReleaseProject({
        exec,
        workspace: f.directory,
        packageDirectory: "..",
      }),
    /inside/,
  );
  assert.throws(
    () =>
      new ReleaseProject({
        exec,
        workspace: f.directory,
        versioning: "unknown",
      }),
    /versioning/,
  );
  f.context.ref = "refs/heads/feature";
  await assert.rejects(() => f.project.currentTag(), /default branch/);
  f.context.ref = "refs/heads/main";
  f.git("tag", "1.0.0");
  await assert.rejects(() => f.project.currentTag(), /Several release tags/);
  f.context.ref = "refs/tags/v1.0.0";
  assert.equal(await f.project.currentTag(), "v1.0.0");
  await assert.rejects(
    () => f.project.packages("v9.0.0"),
    /committed package version/,
  );
  fs.unlinkSync(path.join(f.directory, "package-lock.json"));
  assert.throws(
    () => new ReleaseProject({ exec, workspace: f.directory }),
    /own npm or pnpm lockfile/,
  );
  f.json("package.json", { name: "private", private: true, version: "1.0.0" });
  assert.throws(
    () => new ReleaseProject({ exec, workspace: f.directory }),
    /one public package/,
  );
});

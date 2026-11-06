const assert = require("node:assert/strict");
const exec = require("@actions/exec");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const releasePreparation = require("./index.js");
const { validateVersion, pushRelease } = releasePreparation;

function fixture(
  t,
  {
    changed = true,
    verified = true,
    concurrent = false,
    conflict = false,
  } = {},
) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "release-push-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const remote = path.join(directory, "origin.git");
  const source = path.join(directory, "source");
  fs.mkdirSync(source);
  const git = (cwd, args, options = {}) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "Test",
        GIT_AUTHOR_EMAIL: "test@example.com",
        GIT_COMMITTER_NAME: "Test",
        GIT_COMMITTER_EMAIL: "test@example.com",
      },
      ...options,
    }).trim();
  git(directory, ["init", "--bare", remote]);
  git(source, ["init", "-b", "main"]);
  for (const repository of [remote, source]) {
    git(repository, ["config", "tag.gpgsign", "false"]);
    git(repository, ["config", "core.hooksPath", "/dev/null"]);
  }
  fs.writeFileSync(
    path.join(source, "package.json"),
    '{"name":"example","version":"1.0.0"}\n',
  );
  git(source, ["add", "."]);
  git(source, ["-c", "commit.gpgsign=false", "commit", "-m", "feat: initial"]);
  const sha = git(source, ["rev-parse", "HEAD"]);
  git(source, ["remote", "add", "origin", remote]);
  git(source, ["push", "origin", "main"]);
  if (changed) {
    fs.writeFileSync(
      path.join(source, "package.json"),
      '{"name":"example","version":"1.1.0"}\n',
    );
    git(source, ["add", "."]);
  }
  const requests = [];
  const api = {
    createBlob: async ({ content, encoding }) => {
      assert.equal(encoding, "base64");
      return {
        data: {
          sha: git(remote, ["hash-object", "-w", "--stdin"], {
            input: Buffer.from(content, encoding),
          }),
        },
      };
    },
    createTree: async ({ base_tree, tree }) => {
      git(remote, ["read-tree", base_tree]);
      for (const entry of tree)
        git(remote, [
          "update-index",
          "--add",
          "--cacheinfo",
          `${entry.mode},${entry.sha},${entry.path}`,
        ]);
      return { data: { sha: git(remote, ["write-tree"]) } };
    },
    createCommit: async (request) => {
      requests.push(request);
      const commit = git(remote, [
        "-c",
        "commit.gpgsign=false",
        "commit-tree",
        request.tree,
        "-p",
        sha,
        "-m",
        request.message,
      ]);
      if (concurrent)
        git(remote, [
          "update-ref",
          "refs/heads/main",
          git(remote, [
            "-c",
            "commit.gpgsign=false",
            "commit-tree",
            request.tree,
            "-p",
            sha,
            "-m",
            "fix: concurrent update",
          ]),
        ]);
      return { data: { sha: commit, verification: { verified } } };
    },
  };
  if (conflict) git(remote, ["tag", "v1.1.0", sha]);
  return {
    run: () =>
      pushRelease({
        exec,
        github: { rest: { git: api } },
        context: {
          repo: { owner: "example", repo: "project" },
          sha,
          payload: { repository: { default_branch: "main" } },
        },
        directory: source,
        tags: ["v1.1.0"],
      }),
    ref: (ref) => git(remote, ["rev-parse", "--verify", ref]),
    sha,
    source,
    git,
    api,
    requests,
  };
}

test("allows planned newer and already-committed versions, but never downgrades", () => {
  validateVersion("1.1.0", "1.0.9");
  validateVersion("1.3.0", "1.3.0");
  assert.throws(() => validateVersion("1.2.9", "1.3.0"), /older/);
});

test("pushes the API-signed staged tree and tag together without overriding bot identity", async (t) => {
  const state = fixture(t);
  const commit = await state.run();
  assert.notEqual(commit, state.sha);
  assert.equal(state.ref("refs/heads/main"), commit);
  assert.equal(state.ref("refs/tags/v1.1.0"), commit);
  assert.deepEqual(Object.keys(state.requests[0]).sort(), [
    "message",
    "owner",
    "parents",
    "repo",
    "tree",
  ]);
  assert.deepEqual(state.requests[0].parents, [state.sha]);
  assert.equal(
    state.git(state.source, ["show", `${commit}:package.json`]),
    '{"name":"example","version":"1.1.0"}',
  );
});

test("tags an already-versioned commit without creating an empty commit", async (t) => {
  const state = fixture(t, { changed: false });
  assert.equal(await state.run(), state.sha);
  assert.equal(state.ref("refs/tags/v1.1.0"), state.sha);
  assert.equal(state.requests.length, 0);
});

test("an unverified signature stops before changing remote refs", async (t) => {
  const state = fixture(t, { verified: false });
  await assert.rejects(state.run(), /signature/);
  assert.equal(state.ref("refs/heads/main"), state.sha);
  assert.throws(() => state.ref("refs/tags/v1.1.0"));
});

test("concurrent branch updates reject the entire push and preserve the new branch head", async (t) => {
  const state = fixture(t, { concurrent: true });
  await assert.rejects(state.run(), /stale info|atomic push failed/);
  assert.notEqual(state.ref("refs/heads/main"), state.sha);
  assert.throws(() => state.ref("refs/tags/v1.1.0"));
});

test("existing remote tags reject the entire push without moving branch or tag", async (t) => {
  const state = fixture(t, { conflict: true });
  await assert.rejects(state.run(), /already exists|atomic push failed/);
  assert.equal(state.ref("refs/heads/main"), state.sha);
  assert.equal(state.ref("refs/tags/v1.1.0"), state.sha);
});

test("GitHub failures leave remote branch and tags untouched", async (t) => {
  const state = fixture(t);
  state.api.createCommit = async () => {
    throw new Error("GitHub unavailable");
  };
  await assert.rejects(state.run(), /GitHub unavailable/);
  assert.equal(state.ref("refs/heads/main"), state.sha);
  assert.throws(() => state.ref("refs/tags/v1.1.0"));
});

test("preserves binary staged bytes and paths containing spaces when creating signed commits", async (t) => {
  const state = fixture(t);
  const file = "release data.bin";
  const data = Buffer.from([0, 255, 254, 128, 13, 10, 0, 97]);
  fs.writeFileSync(path.join(state.source, file), data);
  state.git(state.source, ["add", "--", file]);
  const commit = await state.run();
  assert.deepEqual(
    execFileSync("git", ["show", `${commit}:${file}`], { cwd: state.source }),
    data,
  );
});

const packageItem = {
  name: "@example/cli",
  slug: "example-cli",
  version: "1.2.3",
  directory: ".",
  tag: "v1.2.3",
};
test("release accepts prepared single-package and workspace lists without CI packaging metadata", () => {
  const packages = [
    packageItem,
    {
      ...packageItem,
      name: "other",
      slug: "other",
      directory: "packages/other",
    },
  ];
  assert.deepEqual(
    releasePreparation.parsePackages(
      JSON.stringify([packageItem]),
      packageItem.version,
    ),
    [packageItem],
  );
  assert.deepEqual(
    releasePreparation.parsePackages(
      JSON.stringify(packages),
      packageItem.version,
    ),
    packages,
  );
});

test("rejects ambiguous names, unsafe paths, mismatched versions and invalid package lists", () => {
  for (const packages of [
    [],
    {},
    [null],
    [packageItem, packageItem],
    [{ ...packageItem, slug: "wrong" }],
    [{ ...packageItem, name: "../bad" }],
    [{ ...packageItem, directory: "../outside" }],
    [{ ...packageItem, directory: "/tmp" }],
    [{ ...packageItem, version: "1.2.3-beta" }],
    [{ ...packageItem, version: "1.2.2" }],
  ]) {
    assert.throws(
      () =>
        releasePreparation.parsePackages(
          JSON.stringify(packages),
          packageItem.version,
        ),
      /Expected|unique|versions/,
    );
  }
});

test("finds drafts when the release-by-tag endpoint does not return them", async () => {
  const draft = { id: 1, tag_name: "v1.2.0", draft: true };
  const github = {
    rest: {
      repos: {
        getReleaseByTag: async () => {
          throw Object.assign(new Error("Not found"), { status: 404 });
        },
      },
    },
    paginate: async () => [draft],
  };
  assert.equal(
    await releasePreparation.findRelease(github, {}, "v1.2.0"),
    draft,
  );
  assert.equal(
    await releasePreparation.findRelease(github, {}, "v1.3.0"),
    undefined,
  );
  github.rest.repos.getReleaseByTag = async () => {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  };
  await assert.rejects(
    releasePreparation.findRelease(github, {}, "v1.2.0"),
    /Forbidden/,
  );
});

test("nested project tags normalize directory punctuation and preserve stable versions", () => {
  const relativeDirectory = " ---My Package--- ";
  const directory = `/project/${relativeDirectory}`;
  for (const tag of ["1.2.3", "v1.2.3", "my-package-1.2.3"]) {
    assert.equal(
      releasePreparation.versionFromTag(tag, directory, relativeDirectory),
      "1.2.3",
    );
  }
  for (const tag of [
    "my-package-01.2.3",
    "my-package-1.2.3-beta",
    "wrong-1.2.3",
  ]) {
    assert.throws(
      () =>
        releasePreparation.versionFromTag(tag, directory, relativeDirectory),
      /stable version tag/,
    );
  }
});

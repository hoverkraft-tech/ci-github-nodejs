const assert = require("node:assert/strict");
const { test } = require("node:test");
const releaseVerification = require("./index.js");

const context = {
  repo: { owner: "example", repo: "project" },
  runId: 42,
  sha: "prepared-commit",
};
const item = {
  name: "@example/cli",
  slug: "example-cli",
  version: "1.2.3",
  directory: ".",
  tag: "v1.2.3",
};
const artifact = {
  id: 10,
  expired: false,
  workflow_run: { id: 42, head_sha: context.sha },
};
const verifyArtifact = (data = artifact, artifactId = "10") =>
  releaseVerification.verifyArtifact({
    context,
    artifactId,
    github: {
      rest: {
        actions: {
          getArtifact: async ({ artifact_id }) => {
            assert.equal(artifact_id, 10);
            return { data };
          },
        },
      },
    },
  });

test("release verifies the source tag, committed version and publication state", async () => {
  const github = {
    rest: {
      repos: {
        getCommit: async () => ({ data: { sha: context.sha } }),
        getReleaseByTag: async () => ({ data: { draft: false } }),
      },
    },
  };
  const verify = (
    changes = {},
    ref = `refs/tags/${item.tag}`,
    workingDirectory = ".",
  ) =>
    releaseVerification.verifyReleases({
      github,
      context: { ...context, workspace: "/tmp/project", ref },
      packages: [{ ...item, ...changes }],
      workingDirectory,
    });
  assert.deepEqual(await verify(), [{ tag: item.tag, published: true }]);
  github.rest.repos.getReleaseByTag = async () => ({ data: { draft: true } });
  assert.equal((await verify())[0].published, false);
  github.rest.repos.getReleaseByTag = async () => {
    throw Object.assign(new Error("Not found"), { status: 404 });
  };
  github.paginate = async () => [{ tag_name: item.tag, draft: true }];
  assert.equal((await verify())[0].published, false);
  github.paginate = async () => [];
  assert.equal((await verify())[0].published, false);
  github.rest.repos.getReleaseByTag = async () => {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  };
  await assert.rejects(verify(), /Forbidden/);

  await assert.rejects(verify({}, "refs/heads/main"), /prepared release tag/);
  await assert.rejects(verify({ tag: "v2.0.0" }), /source tag/);
  await assert.rejects(verify({ version: "1.2.4" }), /match the release tag/);
  await assert.rejects(
    verify({}, `refs/tags/${item.tag}`, ".."),
    /inside the repository/,
  );
  github.rest.repos.getCommit = async () => ({ data: { sha: "other-commit" } });
  await assert.rejects(verify(), /prepared source commit/);
});

test("release accepts a package tarball artifact from this run and prepared commit, including reruns", async () => {
  await assert.doesNotReject(verifyArtifact());
});

test("rejects expired artifacts, other runs, older commits and unavailable source identity", async () => {
  for (const data of [
    { ...artifact, expired: true },
    { ...artifact, workflow_run: { id: 41, head_sha: context.sha } },
    { ...artifact, workflow_run: { id: 42, head_sha: "old" } },
    { ...artifact, workflow_run: undefined },
  ]) {
    await assert.rejects(verifyArtifact(data), /this run and prepared commit/);
  }
});

test("rejects missing, multiple or invalid package tarball artifact IDs before downloading", async () => {
  for (const id of ["", "0", "1,2", "NaN", "-1", "9007199254740992"]) {
    await assert.rejects(
      verifyArtifact(artifact, id),
      /positive package tarball artifact ID/,
    );
  }
});

test("missing or inaccessible package tarball artifacts stop release", async () => {
  const github = {
    rest: {
      actions: {
        getArtifact: async () => {
          throw new Error("Artifact not found");
        },
      },
    },
  };
  await assert.rejects(
    releaseVerification.verifyArtifact({ github, context, artifactId: "10" }),
    /Artifact not found/,
  );
});

test("release accepts one prepared npm package with its prepared identity", () => {
  assert.deepEqual(
    releaseVerification.parsePackages(JSON.stringify([item]), item.version),
    [item],
  );
});

test("rejects ambiguous names, unsafe paths, mismatched versions and invalid package lists", () => {
  for (const packages of [
    [],
    {},
    [null],
    [item, item],
    [{ ...item, directory: "packages/cli" }],
    [{ ...item, slug: "wrong" }],
    [{ ...item, name: "../bad" }],
    [{ ...item, directory: "../outside" }],
    [{ ...item, directory: "/tmp" }],
    [{ ...item, version: "1.2.3-beta" }],
    [{ ...item, version: "1.2.2" }],
  ]) {
    assert.throws(
      () =>
        releaseVerification.parsePackages(
          JSON.stringify(packages),
          item.version,
        ),
      /Expected|unique|versions/,
    );
  }
});

test("verifies tags derived from nested project directories containing punctuation", async () => {
  const tag = "my-package-1.2.3";
  const releases = await releaseVerification.verifyReleases({
    context: { ...context, workspace: "/tmp/project", ref: `refs/tags/${tag}` },
    packages: [{ ...item, tag }],
    workingDirectory: " ---My Package--- ",
    github: {
      rest: {
        repos: {
          getCommit: async () => ({ data: { sha: context.sha } }),
          getReleaseByTag: async () => ({ data: { draft: true } }),
        },
      },
    },
  });
  assert.equal(releases[0].tag, tag);
  assert.equal(releases[0].published, false);
});

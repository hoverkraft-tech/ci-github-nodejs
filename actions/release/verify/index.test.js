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
test("prepares independent release scopes and requires the workflow source tag", () => {
  const packages = [
    { ...item, tag: "@example/cli@1.2.3", directory: "packages/cli" },
    {
      name: "@example/core",
      slug: "example-core",
      version: "2.0.1",
      tag: "@example/core@2.0.1",
      directory: "packages/core",
    },
  ];
  const prepare = (values = packages) =>
    releaseVerification.prepareReleases({
      context: {
        ...context,
        workspace: "/tmp/project",
        ref: `refs/tags/${packages[0].tag}`,
      },
      packages: values,
    });
  const releases = prepare();
  assert.equal(releases.length, 2);
  assert.equal(releases[1].workingDirectory, "packages/core");
  assert.equal(releases[1].artifactPattern, "release-assets-example-core");
  assert.throws(() => prepare([packages[1]]), /source tag/);
  assert.throws(
    () => prepare([{ ...packages[0], tag: "@other/name@1.2.3" }]),
    /stable version tag/,
  );
});

test("release accepts prepared single-package and workspace lists with their prepared identities", () => {
  const packages = [
    item,
    { ...item, name: "other", slug: "other", directory: "packages/other" },
  ];
  assert.deepEqual(
    releaseVerification.parsePackages(JSON.stringify([item]), item.version),
    [item],
  );
  assert.deepEqual(
    releaseVerification.parsePackages(JSON.stringify(packages), item.version),
    packages,
  );
});

test("rejects ambiguous names, unsafe paths, mismatched versions and invalid package lists", () => {
  for (const packages of [
    [],
    {},
    [null],
    [item, item],
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

test("prepares tags derived from nested project directories containing punctuation", () => {
  const tag = "my-package-1.2.3";
  const releases = releaseVerification.prepareReleases({
    context: { ...context, workspace: "/tmp/project", ref: `refs/tags/${tag}` },
    packages: [{ ...item, tag }],
    workingDirectory: " ---My Package--- ",
  });
  assert.equal(releases[0].tag, tag);
});

test("binds validated CI tarballs to selected packages and rejects ambiguous artifacts", () => {
  const packages = [
    item,
    { ...item, name: "other", slug: "other", directory: "packages/other" },
  ];
  assert.equal(
    releaseVerification.bindArtifacts([item], "10")[0].artifactId,
    "10",
  );
  assert.deepEqual(
    releaseVerification
      .bindArtifacts(
        packages,
        "",
        JSON.stringify({ ".": "10", "packages/other": "11", unchanged: "12" }),
      )
      .map((p) => p.artifactId),
    ["10", "11"],
  );
  for (const [selected, single, map] of [
    [packages, "10", ""],
    [[item], "10", '{".":"10"}'],
    [[item], "", ""],
    [packages, "", '{".":"10"}'],
    [packages, "", '{".":"10","packages/other":"10"}'],
    [[item], "", "[]"],
    [[item], "", '{".":"0"}'],
    [[item], "", '{".":"9007199254740992"}'],
  ])
    assert.throws(
      () => releaseVerification.bindArtifacts(selected, single, map),
      /artifact|map/,
    );
});

test("rejects unprepared refs, escaped scopes and mixed release modes", () => {
  const prepare = (overrides = {}) =>
    releaseVerification.prepareReleases({
      context: {
        ...context,
        workspace: "/tmp/project",
        ref: "refs/tags/v1.2.3",
      },
      packages: [item],
      ...overrides,
    });
  assert.throws(
    () => prepare({ context: { ...context, ref: "refs/heads/main" } }),
    /prepared release tag/,
  );
  assert.throws(
    () => prepare({ workingDirectory: "../outside" }),
    /inside the repository/,
  );
  assert.throws(
    () => prepare({ packages: [item, { ...item, tag: "@example/cli@1.2.3" }] }),
    /independent package tags/,
  );
});

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { ReleaseBuild } = require("../../actions/release/ReleaseBuild.js");

const configure = (build, directory = "/home/runner/work/project/project") =>
  new ReleaseBuild(directory).configure(JSON.stringify(build));

test("builds package and documentation scripts with their environment", () => {
  const options = configure({
    commands: [" build ", "build:doc"],
    env: { NODE_ENV: "production" },
    artifact: ["dist", "build/docs"],
  });
  assert.equal(options.commands, "build\nbuild:doc");
  assert.deepEqual(JSON.parse(options.env), { NODE_ENV: "production" });
  assert.equal(
    JSON.parse(options.artifact).paths,
    "/*home/runner/work/project/project/dist\n/*home/runner/work/project/project/build/docs",
  );
});

test("preserves nested workspace output paths when restoring artifacts to root", () => {
  const options = configure(
    { artifact: { paths: ["packages/**/lib", "build"] } },
    "/home/runner/work/project/project/node",
  );
  assert.equal(options.commands, "build");
  assert.equal(options.env, "{}");
  assert.equal(
    JSON.parse(options.artifact).paths,
    "/*home/runner/work/project/project/node/packages/**/lib\n/*home/runner/work/project/project/node/build",
  );
});

test("accepts multiline and absolute artifact paths and gives retries unique names", () => {
  const input = { artifact: "dist\n/home/runner/work/project/project/build" };
  const first = JSON.parse(configure(input).artifact);
  const second = JSON.parse(configure(input).artifact);
  assert.equal(
    first.paths,
    "/*home/runner/work/project/project/dist\n/*home/runner/work/project/project/build",
  );
  assert.notEqual(first.name, second.name);
});

test("rejects invalid build configuration before executing scripts", () => {
  assert.throws(() => new ReleaseBuild("/tmp").configure("{"), SyntaxError);
  for (const input of [null, [], "build", true]) {
    assert.throws(() => configure(input), /JSON object/);
  }
  for (const commands of [[], "build", [1], [" "]]) {
    assert.throws(() => configure({ commands, artifact: "dist" }), /commands/);
  }
  for (const env of [[], "production", 1]) {
    assert.throws(() => configure({ env, artifact: "dist" }), /env/);
  }
  for (const artifact of [undefined, {}, [], "", [false], { paths: 1 }]) {
    assert.throws(() => configure({ artifact }), /artifact paths/);
  }
});

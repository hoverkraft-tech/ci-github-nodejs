import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { data, Evaluator, Lexer, Parser } from "@actions/expressions";
import { parse } from "yaml";

const repository = new URL("../../", import.meta.url);
const readYaml = (file) =>
  parse(readFileSync(new URL(file, repository), "utf8"));
const workflow = readYaml(".github/workflows/continuous-integration.yml");
const defaults = Object.fromEntries(
  Object.entries(workflow.on.workflow_call.inputs).map(([name, input]) => [
    name,
    input.default,
  ]),
);
const require = createRequire(import.meta.url);

async function runScript(job, stepId, env = {}) {
  const step = workflow.jobs[job].steps.find((item) => item.id === stepId);
  const outputs = {};
  const errors = [];
  await runInNewContext(`(async () => { ${step.with.script} })()`, {
    process: {
      env: {
        GITHUB_WORKSPACE: "/host/work/repository",
        GITHUB_JOB: job,
        GITHUB_RUN_ID: "123",
        WORKING_DIRECTORY: ".",
        BUILD_INPUT: defaults.build,
        CONTAINER_INPUT: "",
        CONTAINER_PASSWORD: "",
        PACKAGE_INPUT: defaults.package,
        ...env,
      },
    },
    require: (name) => {
      assert.equal(name, "node:path", "metadata must not inspect a filesystem");
      return require(name);
    },
    core: {
      debug: () => {},
      setOutput: (name, value) => {
        outputs[name] = value;
      },
      setFailed: (message) => errors.push(message),
    },
  });
  return { outputs, errors };
}

function evaluate(expression, context, statuses = {}) {
  const functions = new Map(
    Object.entries(statuses).map(([name, value]) => [
      name,
      { name, minArgs: 0, maxArgs: 0, call: () => new data.BooleanData(value) },
    ]),
  );
  const source = expression.replace(/^\s*\$\{\{|\}\}\s*$/g, "");
  const { tokens } = new Lexer(source).lex();
  const parsed = new Parser(tokens, Object.keys(context), [
    ...functions.values(),
  ]).parse();
  return new Evaluator(
    parsed,
    JSON.parse(JSON.stringify(context), data.reviver),
    functions,
  ).evaluate();
}

function canRun(
  jobId,
  {
    inputs = {},
    prepare = "success",
    build = "success",
    commands = "build",
    cancelled = false,
    packageEnabled = true,
    discovery = "success",
    packageResult = "success",
  } = {},
) {
  const job = workflow.jobs[jobId];
  const available = {
    prepare: {
      result: prepare,
      outputs: {
        "build-commands": commands,
        "package-enabled": String(packageEnabled),
      },
    },
    build: { result: build, outputs: {} },
    "discover-packages": {
      result: discovery,
      outputs: { directories: '["."]' },
    },
    package: { result: packageResult, outputs: {} },
  };
  const dependencies = [job.needs ?? []].flat();
  const needs = Object.fromEntries(
    dependencies.map((id) => [id, available[id]]),
  );
  const success =
    !cancelled && dependencies.every((id) => needs[id].result === "success");
  // GitHub adds success() unless the condition contains a status function.
  const expression = /\b(?:always|success|failure|cancelled)\s*\(/.test(job.if)
    ? job.if
    : `success() && (${job.if})`;
  const condition = expression.replace(/^\s*\$\{\{|\}\}\s*$/g, "");
  return evaluate(
    `!!(${condition})`,
    { inputs: { ...defaults, ...inputs }, needs },
    {
      success,
      cancelled,
    },
  ).value;
}

for (const [input, commands] of [
  [defaults.build, "build"],
  [" build \n generate \n", "build\ngenerate"],
  ['["build", " generate "]', "build\ngenerate"],
  ['{"artifact":"dist"}', "build"],
  ["", ""],
  [" \n ", ""],
]) {
  test(`normalizes supported build input ${JSON.stringify(input)}`, async () => {
    const result = await runScript("prepare", "build-variables", {
      BUILD_INPUT: input,
    });
    assert.deepEqual(result.errors, []);
    assert.equal(result.outputs.commands, commands);
    assert.equal(result.outputs.env, "{}");
  });
}

for (const input of [
  "{bad json",
  '["build", 1]',
  '{"commands":"build"}',
  '{"commands":[]}',
  '{"env":[]}',
  '{"artifact":true}',
  '{"artifact":{"paths":123}}',
  '{"artifact":["dist",false]}',
  '{"artifact":" \n "}',
]) {
  test(`rejects malformed build input ${JSON.stringify(input)}`, async () => {
    const result = await runScript("prepare", "build-variables", {
      BUILD_INPUT: input,
    });
    assert.equal(result.errors.length, 1);
    assert.equal(result.outputs.commands, undefined);
  });
}

test("preserves environment values and artifact options", async () => {
  const result = await runScript("prepare", "build-variables", {
    BUILD_INPUT: JSON.stringify({
      commands: ["compile"],
      env: { NODE_ENV: "test", LABEL: "a=b" },
      artifact: { paths: [" dist/ ", "build/result.json"], custom: "retained" },
    }),
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(JSON.parse(result.outputs.env), {
    NODE_ENV: "test",
    LABEL: "a=b",
  });
  const artifact = JSON.parse(result.outputs.artifact);
  assert.equal(artifact.paths, "dist/\nbuild/result.json");
  assert.equal(artifact.custom, "retained");
  assert.match(artifact.name, /^prepare-build-123-\w+$/);
});

for (const directory of [
  "apps/frontend",
  "/usr/src/app",
  "/missing/unmounted/app",
]) {
  test(`prepares ${directory} without inspecting the host filesystem`, async () => {
    const result = await runScript("prepare", "build-variables", {
      WORKING_DIRECTORY: directory,
    });
    assert.deepEqual(result.errors, []);
    assert.equal(result.outputs["working-directory"], directory);
  });
}

for (const [workspace, directory, expected] of [
  [
    "/home/runner/work/repository",
    "apps/web",
    "/*home/runner/work/repository/apps/web/dist",
  ],
  [
    "/__w/repository/repository",
    "apps/web",
    "/*__w/repository/repository/apps/web/dist",
  ],
  ["/__w/repository/repository", "/usr/src/app", "/*usr/src/app/dist"],
]) {
  test(`resolves artifacts in the application job at ${workspace}, ${directory}`, async () => {
    const result = await runScript("build", "build-artifact", {
      GITHUB_WORKSPACE: workspace,
      WORKING_DIRECTORY: directory,
      BUILD_ARTIFACT: JSON.stringify({
        name: "artifact",
        paths: "dist\n/absolute/file",
      }),
    });
    assert.deepEqual(JSON.parse(result.outputs.artifact), {
      name: "artifact",
      paths: `${expected}\n/*absolute/file`,
    });
  });
}

test("preserves container options, credentials and report path mappings", async () => {
  const result = await runScript("prepare", "parse", {
    CONTAINER_INPUT: JSON.stringify({
      image: "registry.example/app@sha256:abc",
      options: "--cpus 2",
      env: { CI: "true" },
      credentials: { username: "user" },
      pathMapping: { "/usr/src/app": "application/frontend" },
    }),
    CONTAINER_PASSWORD: "test-password",
  });
  assert.deepEqual(result.errors, []);
  assert.equal(
    result.outputs["container-image"],
    "registry.example/app@sha256:abc",
  );
  assert.equal(
    result.outputs["container-options"],
    "--user root:root --cpus 2",
  );
  assert.equal(result.outputs["container-username"], "user");
  assert.equal(
    result.outputs["path-mapping"],
    "/usr/src/app:application/frontend",
  );
  assert.equal(JSON.stringify(result.outputs).includes("test-password"), false);
});

for (const env of [
  { CONTAINER_INPUT: "{" },
  { CONTAINER_INPUT: '{"options":"--cpus 2"}' },
  { CONTAINER_INPUT: '{"image":"app","credentials":{"username":"user"}}' },
  { CONTAINER_INPUT: "app", CONTAINER_PASSWORD: "test-password" },
]) {
  test(`rejects invalid preparation options ${JSON.stringify(env)}`, async () => {
    const result = await runScript("prepare", "parse", env);
    assert.equal(result.errors.length, 1);
  });
}

for (const job of ["test", "package"]) {
  for (const [name, options, expected] of [
    ["successful build", {}, true],
    ["intentionally omitted build", { build: "skipped", commands: "" }, true],
    ["failed build", { build: "failure" }, false],
    ["cancelled build", { build: "cancelled" }, false],
    ["unexpected skipped build", { build: "skipped" }, false],
    [
      "failed preparation",
      { prepare: "failure", build: "skipped", commands: "" },
      false,
    ],
    [
      "cancelled preparation",
      { prepare: "cancelled", build: "skipped", commands: "" },
      false,
    ],
    [
      "skipped preparation",
      { prepare: "skipped", build: "skipped", commands: "" },
      false,
    ],
    [
      "cancelled workflow",
      { cancelled: true, build: "skipped", commands: "" },
      false,
    ],
    ["disabled checks", { inputs: { checks: false } }, false],
    ["disabled job", { inputs: { test: "" }, packageEnabled: false }, false],
  ]) {
    test(`${job} scheduling after ${name}`, () => {
      assert.equal(
        canRun(job, {
          ...options,
          inputs: options.inputs,
        }),
        expected,
      );
    });
  }
}

test("package discovery is optional and independent of compilation", () => {
  assert.equal(canRun("discover-packages", { packageEnabled: false }), false);
  assert.equal(
    canRun("discover-packages", { inputs: { checks: false } }),
    false,
  );
  assert.equal(canRun("discover-packages", { prepare: "failure" }), false);
  assert.equal(
    canRun("discover-packages", { build: "skipped", commands: "" }),
    true,
  );
  assert.equal(canRun("discover-packages", { build: "failure" }), true);
});

for (const discovery of ["failure", "cancelled", "skipped"]) {
  test(`package validation requires successful discovery: ${discovery}`, () => {
    assert.equal(canRun("package", { discovery }), false);
    assert.equal(canRun("test", { discovery }), true);
    assert.equal(canRun("package-results", { discovery }), false);
  });
}

test("package results require completed validation even when compilation is omitted", () => {
  assert.equal(
    canRun("package-results", { build: "skipped", commands: "" }),
    true,
  );
  for (const packageResult of ["failure", "cancelled", "skipped"]) {
    assert.equal(canRun("package-results", { packageResult }), false);
  }
  assert.equal(canRun("package-results", { packageEnabled: false }), false);
  assert.equal(canRun("package-results", { cancelled: true }), false);
  assert.equal(canRun("package-results", { prepare: "failure" }), false);
});

test("package configuration retains source packaging without a build", async () => {
  const disabled = await runScript("prepare", "package-config");
  assert.equal(disabled.outputs.enabled, false);
  const enabled = await runScript("prepare", "package-config", {
    PACKAGE_INPUT: '{"directories":["."],"tests":"test -f package.json"}',
  });
  assert.equal(enabled.outputs.enabled, true);
  assert.equal(JSON.stringify(enabled.outputs.directories), '["."]');
  await assert.rejects(
    runScript("prepare", "package-config", {
      PACKAGE_INPUT: "true",
      CONTAINER_INPUT: "app",
    }),
    /requires non-container CI/,
  );
});

test("empty builds skip their job and lint stays independent of build failures", () => {
  assert.equal(canRun("build", { commands: "" }), false);
  assert.equal(canRun("build"), true);
  assert.equal(canRun("build", { prepare: "failure" }), false);
  assert.equal(canRun("lint", { build: "failure" }), true);
  assert.equal(canRun("lint", { prepare: "failure" }), false);
  assert.equal(canRun("lint", { inputs: { lint: "" } }), false);
});

for (const action of ["build", "lint", "test"]) {
  test(`${action} enforces workspace boundaries outside container mode`, () => {
    const definition = readYaml(`actions/${action}/action.yml`);
    const guard = definition.runs.steps.find(
      (step) => step.id === "working-directory",
    );
    for (const [container, expected] of [
      ["false", "true"],
      ["true", "false"],
    ]) {
      assert.equal(
        evaluate(guard.with["enforce-path-in-workspace"], {
          inputs: { container },
        }).value,
        expected,
      );
    }
  });
}

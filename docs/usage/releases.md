# Release Node.js packages

Use the [Release workflow](../../.github/workflows/release.md) to release one public
npm package or fixed-version Lerna workspaces. The calling repository supplies
triggers and build settings. HoverKraft prepares versions, builds the tagged
source, packages the build output, publishes to npm and creates the GitHub release.
No custom release scripts are needed in the calling repository.

Complete caller examples, including documentation deployment:

- [Single-package CLI](examples/reactionable-cli.yml)
- [Lerna monorepo](examples/reactionable.yml)

## Configure the repository

1. Set each public package's `name`, `repository.url`, and package contents (`files`
   or `.npmignore`). Include compiled output and any CLI entry points.
2. Configure [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
   for each package. Use the **calling repository and workflow filename**, such
   as `release.yml`, and the environment passed below. Allow direct `npm publish`.
   Publish the first version of a new npm package before configuring its publisher.
3. Allow the default branch and the tags produced by your release configuration
   in the GitHub environment (for example, `*.*.*` for stable version tags). Its name
   defaults to `release`; an existing environment can be passed explicitly.
4. Store `OPENAI_API_KEY` as a repository or environment secret when enabling AI
   summaries, and pass it explicitly as shown below.
5. Replace `<sha>` with an immutable `ci-github-nodejs` commit containing this
   reusable workflow. Keep `workflow_dispatch` with no required inputs: preparation
   uses it to start publication at the generated tag.

GitHub-hosted Linux runners and public packages on npmjs.org are supported.
Private packages, custom registries, prereleases and independent Lerna versions
require a [custom pipeline](custom-releases.md).

## Keep CI separate

Run linting, tests, coverage and security analysis in the caller's independent
[CI workflow](../../.github/workflows/continuous-integration.md). Configure required
checks on pull requests and branch rules before allowing releases from that branch.
The Release workflow neither runs those checks nor queries or waits for CI results.

Release builds run from the version tag because package contents can embed the
version. Their artifacts are used for npm packaging and optional documentation
deployment. They are not evidence that CI passed on that tag. In particular, Lerna
and npm both create version commits directly; if they need additional validation,
arrange it in the caller and gate publication through the release environment.

## Single package

This configuration fits a TypeScript CLI such as `reactionable-cli`. HoverKraft
plans the version from Conventional Commits and renders the changelog. npm applies
that exact version to `package.json` and npm lockfiles. The workflow commits those
files with `CHANGELOG.md`, pushes the commit and tag atomically, and dispatches
publication at the tag.

```yaml
name: Release

on:
  workflow_dispatch:
  schedule:
    - cron: "25 8 * * 1"

permissions: {}

jobs:
  release:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@<sha>
    permissions:
      actions: write
      contents: write
      pull-requests: read
      packages: read
      id-token: write
    with:
      environment: github-pages
      build: |
        {
          "commands": ["build", "build:doc"],
          "artifact": ["dist", "build"]
        }
      ai-summary: true
    secrets:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

The defaults use `versioning: npm` and `npm run build` with `dist` as the build
artifact. Omit `versioning` and `build` when those defaults match your project.
The `build` input is a JSON object with `commands`, `artifact` paths and an optional
`env` object. Commands are package scripts, not shell commands. The Build action
installs dependencies and executes those scripts.

## Release planning and branch rules

Both package modes use `ci-github-publish/actions/release/plan` as their version
planner. Its generated rules use Conventional Commits: breaking changes select
major, features select minor, and other changes select patch. Repository release
configuration takes precedence. See the
[HoverKraft release actions](https://github.com/hoverkraft-tech/ci-github-publish/blob/1.0.3/.github/workflows/release.md)
for configuration, history filtering and change detection.

The workflow preserves the planned tag. It accepts stable `1.2.3` and `v1.2.3`
tags, plus `<directory-slug>-1.2.3` for a project in `working-directory`.
Keep the tag convention and release history aligned with existing packages.
A plan older than or equal to the committed version is rejected. If the first
planned release is behind an existing package version, reconcile the GitHub
release baseline and release configuration before running it.

Branch and tag rules must allow the preparation identity to push the release
commit and tag. The default is `GITHUB_TOKEN`; pass an appropriate token through
`github-token` when required by your rules or when release commits must trigger
normal push CI. It needs contents and actions write and pull requests read access.
The workflow does not create or auto-merge a release PR, and does not bypass rules.

## Fixed-version Lerna workspaces

Keep the same triggers, permissions and secrets. Change the inputs to match a
repository such as `reactionable`:

```yaml
with:
  versioning: lerna
  environment: github-pages
  build: |
    {
      "commands": ["build:ci", "storybook:build", "docs:build"],
      "artifact": ["packages/**/lib", "build", "packages/**/docs"]
    }
  ai-summary: true
```

Install Lerna in the project and use a stable fixed version in `lerna.json`.
The workflow passes the exact HoverKraft-planned version to the installed Lerna.
Lerna updates package versions, internal dependency ranges and lockfiles;
`--conventional-commits` generates package changelogs. It does not choose a second
version. The root `CHANGELOG.md` receives HoverKraft's rendered notes.
Lerna can report no changed packages even when the release plan contains changes;
in that case no release commit, tag or publication run is created.

This mode commits directly to the default branch and pushes the commit and tag
atomically. Repository rules must permit that push. If the branch advances during
preparation, the push fails without pushing the new tag. Existing tags are never
overwritten. Only public workspaces at the new release version are published;
unchanged packages can retain their previous versions.

## Run and resume releases

Run the calling workflow from the default branch or wait for its schedule.
Preparation reports one of these outcomes in the job summary:

| Status       | Meaning                                                       |
| ------------ | ------------------------------------------------------------- |
| `no-changes` | Nothing needs releasing; no build or publishing starts.       |
| `dispatched` | The version tag exists; follow the new run for that tag.      |
| `released`   | This version already has a published GitHub release.          |
| `published`  | The tag run published all packages and finalized the release. |

Both preparation and publication share a concurrency group inside the reusable
workflow. Do not use that same group in the caller. A successful preparation run
does not imply publication succeeded: its tag run builds artifacts and publishes.

AI generation runs before npm publication. A draft becomes public only after
every package and release asset succeeds. AI summaries accompany the full release
notes and should be checked for accuracy. A published release keeps its notes on retry.

To resume a release after its tag was pushed, dispatch the **calling** workflow
at the original tag:

```sh
gh workflow run release.yml --ref v1.2.3
```

The tag must contain the caller workflow and match the committed version. A tag
run never computes another version. The release build uses that source. Already published npm
versions are skipped and their original tarballs are downloaded with SHA-512
verification. Existing GitHub assets are reused only when SHA-256 digests match;
conflicting or missing digests fail instead of replacing assets.

Asset uploads and final publication use HoverKraft `release/update`. On retry,
only missing assets are passed to it after the existing digests are verified.

npm workspace publication cannot be atomic, so partial publication is possible.
An npm registry error stops recovery; only an absent version permits publishing.
If the release build fails because source code needs changing, make a new commit
and release.
Do not move an existing release tag.

The `release-url`, `tag`, `status` and `build-artifact-id` workflow outputs support
follow-up jobs. For documentation deployment, require `status == 'published'`
and consume `build-artifact-id` from that tag run. Documentation deployment remains
an independent consumer job.

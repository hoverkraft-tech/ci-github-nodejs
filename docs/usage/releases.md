# Release a single package or Lerna workspaces

Connect three reusable workflows: **prepare → CI → publish**. The caller owns the
manual and scheduled triggers. Consumers need no versioning or publication scripts.

- [Prepare release](../../.github/workflows/prepare-release.md) uses HoverKraft's
  Conventional Commit release plan, commits versions and changelogs, and atomically
  pushes the version commit and tag. It dispatches the caller at that tag.
- [Continuous integration](../../.github/workflows/continuous-integration.md) builds,
  tests and packages the prepared commit. Use the same CI configuration as pull requests.
- [Release](../../.github/workflows/release.md) consumes those CI tarballs, generates
  release notes and an optional AI summary, publishes npm packages, and finalizes the
  GitHub release. It does not build or pack the project.

The tag run is essential: artifacts built before version preparation can contain the
old version. All three workflows run against the prepared commit during publication.

## Set up

1. Keep the package's stable version and existing GitHub release history aligned.
   HoverKraft selects the next version from that history and Conventional Commits.
   A plan older than or equal to the committed version fails instead of guessing a
   replacement. Configure `.github/release-config.yml` when needed; repository
   configuration takes precedence over generated defaults.
2. Configure [npm trusted publishing](../../actions/publish/README.md#npm-trusted-publishing)
   for your repository, caller workflow filename and environment. Publish a new
   package's first version before configuring its trusted publisher. Publication
   uses GitHub-hosted runners with `id-token: write`.
3. Permit the preparation identity to push release commits and tags under your branch
   and tag rules. Preparation defaults to `GITHUB_TOKEN`; optionally pass
   `github-token` to `prepare-release.yml`. The token does not bypass repository rules.
4. Allow the chosen environment on the default branch and release tags. Set
   `OPENAI_API_KEY` and pass it to publication when enabling `ai-summary`.
5. Copy a caller example and replace `<sha>` with the same supported
   `ci-github-nodejs` commit throughout:
   - [Single npm package with documentation deployment](examples/reactionable-cli.yml)
   - [Fixed-version Lerna workspaces with documentation deployment](examples/reactionable.yml)

The minimal connection between the jobs is:

```yaml
jobs:
  prepare:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/prepare-release.yml@<sha>
    permissions:
      actions: write
      contents: write
      pull-requests: read

  ci:
    needs: prepare
    if: needs.prepare.outputs.status == 'ready'
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@<sha>
    permissions:
      actions: read
      contents: read
      packages: read
      pull-requests: write
      security-events: write
      id-token: write
    with:
      packages: ${{ needs.prepare.outputs.packages }}
      build: '{"commands":["build"],"artifact":["dist"]}'

  release:
    needs: ci
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/release.yml@<sha>
    permissions:
      actions: read
      contents: write
      pull-requests: read
      id-token: write
    with:
      package-artifacts: ${{ needs.ci.outputs.package-artifacts }}
```

Add `workflow_dispatch`, your schedule, `permissions: {}` and a caller concurrency
group such as `release-${{ github.repository }}` with `cancel-in-progress: false`.
Use a different group from either reusable workflow. This serializes the whole
pipeline, including CI. If your repository already has a shared CI wrapper, forward
its optional `packages` input and `package-artifacts` output instead of copying build
and test settings into the release caller. Ordinary CI leaves `packages` empty.

## Versioning and packaging

Preparation defaults to `versioning: npm` for a single public package. npm applies
the exact planned version to the manifest and lockfile without running version scripts.
For fixed-version workspaces, set `versioning: lerna` on **prepare** and install
Lerna in the project. Lerna applies the exact planned version, updates internal
dependency ranges and lockfiles, and uses `--conventional-commits` for package
changelogs. It does not select another version. Independent versions and prereleases
are unsupported. The root `CHANGELOG.md` receives HoverKraft's rendered notes.

Only public workspaces at the new version are packaged; unchanged packages can keep
their previous versions. If Lerna reports no changed packages, preparation creates no
commit, tag or publication run. If the default branch advances during preparation,
the atomic push fails without publishing the new tag. Existing tags are never overwritten.

Set matching `working-directory` values on all three workflows for nested projects.
The planner supports bare stable tags, `v`-prefixed tags and directory-slug prefixes
for nested projects. The committed version must match the selected tag.

CI packaging requires `checks: true`, a build artifact, the default
`runs-on: '["ubuntu-latest"]'`, and no container. Configure the build artifact to
include the compiled package files and any documentation you deploy. Packaging runs
after all enabled checks succeed, restores the build output and runs `npm pack`.
Package lifecycle scripts therefore run in CI. Publication never installs project
dependencies or invokes its build or packaging scripts.

CI returns immutable tarball IDs. Publication verifies that each artifact belongs to
this run and commit, then checks the tarball's package name and version before npm
publication. Cross-run artifact reuse is unsupported. A caller must keep `release`
dependent on successful CI; artifact metadata alone is not proof that checks passed.

## Run and resume releases

Run the caller from the default branch or wait for its schedule. Preparation reports:

| Status       | Meaning                                             |
| ------------ | --------------------------------------------------- |
| `no-changes` | No release needed; CI and publication are skipped.  |
| `dispatched` | Follow the new caller run at the prepared tag.      |
| `released`   | This version already has a public GitHub release.   |
| `ready`      | This tag run can start CI, followed by publication. |

Publication reports `published` only after all npm packages and release assets
succeed. Preparation success alone does not mean publication succeeded.

AI generation runs before npm publication. The draft becomes public only after every
package and asset succeeds. Review AI summaries for accuracy; published releases
keep their notes on retries. Asset upload and final publication use HoverKraft
`release/update`.

For a failed publication job, rerun failed jobs: successful CI tarballs from earlier
attempts of the same run are reused without rebuilding. Expired or deleted artifacts
fail rather than falling back to another run. To run CI again and resume the same
release, dispatch the **caller** at its original tag:

```sh
gh workflow run release.yml --ref v1.2.3
```

A tag run never plans another version. Already published npm versions are skipped,
and their original tarballs are restored with SHA-512 verification for GitHub assets.
Existing assets are reused only when SHA-256 digests match. Conflicts or unavailable
digests fail instead of replacing assets. Partial npm publication remains possible;
registry errors stop recovery, and only an absent version permits publication.
If source needs changing, make a new commit and release. Do not move a release tag.

For documentation deployment, require `release.outputs.status == 'published'` and
consume **CI's** `build-artifact-id`. The publication workflow returns `status`,
`tag` and `release-url`; documentation remains an independent caller job.

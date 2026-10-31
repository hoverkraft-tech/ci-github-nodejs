# Compose a custom release pipeline

Use [the shared release workflows](releases.md) for single npm packages and
fixed-version Lerna workspaces. For custom registries or packaging rules, compose
the existing actions while keeping preparation, CI and publication separate.

## Preparation

Use HoverKraft [`release/plan`](https://github.com/hoverkraft-tech/ci-github-publish/tree/1.0.3/actions/release/plan)
for version selection. Commit version, lockfile and changelog updates before CI
builds the source, especially when compiled files embed the version. Keep the planned
tag fixed throughout the pipeline. The [Node.js preparation action](../../actions/release/prepare/README.md)
handles this for npm and fixed-version Lerna projects and dispatches the caller at the tag.

## CI artifacts

Run the [CI workflow](../../.github/workflows/continuous-integration.md) against the
prepared commit. Its optional `packages` input delegates packaging to the
[Package action](../../actions/package/README.md) after checks pass. It returns
`package-artifacts` for publication and `build-artifact-id` for documentation deployment.

If you own the packaging jobs, the Package action accepts a build artifact ID and
package directory. It checks out the workflow's source ref, installs dependencies,
restores build output, and runs `npm pack`. Start that workflow at the prepared tag;
an earlier step checking out a different ref does not change Package's own checkout.
Leave its `version` input empty when versions are already committed. Run any tarball
smoke tests in CI before making artifacts available to publication.

## Publication

Keep publication dependent on successful CI. The [Publish action](../../actions/publish/README.md)
consumes one CI tarball artifact ID and never packages the project. A dry run validates
`npm publish` inputs, but does not prove registry authentication or trusted publishing.
See its [authentication guide](../../actions/publish/README.md#registry-tokens-and-github-packages)
for registries beyond npmjs.org.

Use HoverKraft [`release/create`](https://github.com/hoverkraft-tech/ci-github-publish/tree/1.0.3/actions/release/create)
to draft notes and optional AI summaries before npm publication. Pass the prepared
tag and source SHA. Set `publish: "false"` until all packages and assets succeed.
Use [`release/update`](https://github.com/hoverkraft-tech/ci-github-publish/tree/1.0.3/actions/release/update)
to attach assets and publish the draft. Those actions expect ZIP artifacts for release
assets; the Package action's raw `.tgz` must be wrapped with `upload-artifact` using
its default archive mode.

The [shared publication workflow](../../.github/workflows/release.md) already performs
these steps for npmjs.org, including exact artifact identity checks, AI summaries and
safe retries. It accepts only artifacts from CI in the same run and at the same tag.

## Recovery

npm publication across several packages cannot be atomic. Check exact package
versions before retrying; published versions cannot be overwritten. Restore original
published bytes for release assets, verify integrity and existing asset digests, and
upload only missing assets. Do not delete a draft to undo an npm publication.

The [release recovery guide](releases.md#run-and-resume-releases) describes this behavior
for the shared workflow. Custom pipelines own equivalent recovery rules. Keep the
original tag and source identity when finishing a partial release.

# Validate release automation

Install the test dependencies and run the release suite:

```sh
npm ci --prefix tests/release
npm test --prefix tests/release
```

Artifact handoff tests check exact run and commit identity, package versions,
missing and expired artifacts, partial matrix reruns, and tarball manifests.
The suite uses temporary local Git repositories and offline npm commands. It
executes npm and the installed Lerna with planned versions, checks dependent
package and lockfile changes, and
tests no-change behavior, tag collisions and concurrent branch pushes. A single
package fixture applies a release plan, builds a CLI, packs it, installs
the tarball and executes its entry point.

Registry and GitHub responses are mocked for partial publication, integrity
failures, draft lookup and staging missing assets for HoverKraft upload. Release
plans and rendered notes are supplied as upstream action outputs; this suite does
not duplicate HoverKraft's version calculation tests. Tests do not call
OpenAI, publish packages or create remote releases. The suite runs in the shared
CI workflow. The continuous-integration workflow test also enables packaging,
downloads the returned raw artifact ID and compares its compiled file with the
original CI build output. It does not publish a package.

Run `make lint` for repository linting. Generate changed action and workflow
readmes with the existing CI Dokumentor tool used by `release-actions.yml`; edit
metadata rather than generated files. The user guide lives in `docs/usage/`.

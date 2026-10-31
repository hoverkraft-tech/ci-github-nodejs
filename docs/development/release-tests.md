# Validate release automation

Install the test dependencies and run the release suite:

```sh
npm ci --prefix tests/release
npm test --prefix tests/release
```

Build configuration tests check script/environment forwarding, artifact paths
for single packages and nested workspaces, retry names, and invalid inputs.
The suite uses temporary local Git repositories and offline npm commands. It
executes the installed Lerna, checks dependent package and lockfile changes, and
tests no-change behavior, tag collisions and concurrent branch pushes. A single
package fixture models a merged Release Please PR, builds a CLI, packs it, installs
the tarball and executes its entry point.

Registry and GitHub responses are mocked for partial publication, integrity
failures, draft lookup, asset recovery and release PR labels. Tests do not call
OpenAI, publish packages or create remote releases. The suite runs in the shared
CI workflow.

Run `make lint` for repository linting. Generate changed action and workflow
readmes with the existing CI Dokumentor tool used by `release-actions.yml`; edit
metadata rather than generated files. The user guide lives in `docs/usage/`.

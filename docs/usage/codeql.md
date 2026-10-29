# Configure CodeQL analysis

Pass `code-ql-config-file` to the reusable continuous integration workflow to
select a CodeQL configuration file. CodeQL owns file loading, configuration
validation, query selection, and path filtering. Omitting the input or passing
an empty string keeps its default configuration behavior.

Local paths are relative to the caller repository root, even when
`working-directory` selects a nested package. For example, create
`.github/codeql/config.yml` in the caller repository:

```yaml
name: Application source

paths-ignore:
  - generated/**
```

Then supply its path to the workflow. Replace `<commit-sha>` with a full commit
SHA from a release that supports `code-ql-config-file`:

```yaml
jobs:
  ci:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@<commit-sha>
    permissions:
      contents: read
      id-token: write
      packages: read
      pull-requests: write
      security-events: write
    with:
      working-directory: packages/application
      code-ql-config-file: .github/codeql/config.yml
```

Choose exclusions that match the repository's generated files. The workflow
does not add exclusions or change the query suite. Excluded files, including
bundled dependencies, are outside that CodeQL analysis; dependency review is a
separate check. See GitHub's [CodeQL configuration reference](https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options).

CodeQL runs when `checks` is `true` and `code-ql` is nonempty. Providing a
configuration file does not enable a disabled scan. An invalid or missing
configuration file fails the CodeQL job instead of silently using defaults.

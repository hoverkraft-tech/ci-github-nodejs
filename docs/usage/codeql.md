# Configure CodeQL analysis

The reusable continuous integration workflow accepts a language string or a
JSON object through `code-ql`. Omitting the input selects `typescript`.
Passing an empty string disables CodeQL; `checks: false` also disables it.

For a language string, use the existing form:

```yaml
with:
  code-ql: javascript-typescript
```

For JSON, `languages` is a required nonempty string and `config-file` is an
optional string. Omitting `config-file` or leaving it empty keeps CodeQL's
default configuration behavior. Unknown properties, invalid property types,
and malformed JSON objects fail before initialization. CodeQL owns language
validation, file loading, query selection, and path filtering.

Local paths are relative to the caller repository root, even when
`working-directory` selects a nested package. For example, create
`.github/codeql/config.yml` in the caller repository:

```yaml
name: Application source

paths-ignore:
  - generated/**
```

Then supply its path in the JSON object. Replace `<commit-sha>` with a full
commit SHA from a release that supports JSON in `code-ql`:

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
      code-ql: |
        {
          "languages": "javascript-typescript",
          "config-file": ".github/codeql/config.yml"
        }
```

Choose exclusions that match the repository's generated files. The workflow
does not add exclusions or change the query suite. Excluded files, including
bundled dependencies, are outside that CodeQL analysis; dependency review is a
separate check. See GitHub's [CodeQL configuration reference](https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options).

An invalid or missing configuration file fails the CodeQL job instead of
silently using defaults.

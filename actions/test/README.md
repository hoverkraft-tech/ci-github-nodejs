# Test Action

Composite action to test Node.js projects with support for coverage reporting, pull request annotations, and multiple coverage reporters.

## Features

- Runs project test scripts
- Supports Codecov and LCOV coverage reporters
- Provides PR feedback with coverage reports
- Can be configured to fail or warn on test failures
- Handles both container and non-container modes

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
  with:
    # Working directory where test commands are executed
    # Default: "."
    working-directory: "."

    # Whether running in container mode (skips checkout and node setup)
    # Default: "false"
    container: "false"

    # Code coverage reporter: "codecov", "lcov", or ""
    # Default: ""
    coverage: "codecov"

    # Path to LCOV file (only for "lcov" coverage)
    # Default: "coverage/lcov.info"
    lcov-file: "coverage/lcov.info"

    # Codecov token (only for private repositories)
    # Default: ""
    codecov-token: ${{ secrets.CODECOV_TOKEN }}

    # GitHub token (required for "lcov" coverage PR comments)
    # Default: ""
    github-token: ${{ github.token }}

    # Whether to fail the action if tests fail
    # Default: "true"
    fail-on-error: "true"
```

## Inputs

| Name                | Description                                                          | Required | Default              |
| ------------------- | -------------------------------------------------------------------- | -------- | -------------------- |
| `working-directory` | Working directory where test commands are executed                   | No       | `.`                  |
| `container`         | Whether running in container mode (skips checkout and node setup)    | No       | `false`              |
| `coverage`          | Code coverage reporter: "Codecov", "lcov", or ""                     | No       | `""`                 |
| `lcov-file`         | Path to LCOV file for coverage reporting (used with "lcov" coverage) | No       | `coverage/lcov.info` |
| `codecov-token`     | Codecov token for private repositories                               | No       | `""`                 |
| `github-token`      | GitHub token for LCOV reporter PR comments                           | No       | `""`                 |
| `fail-on-error`     | Whether to fail the action if tests fail                             | No       | `true`               |

## Outputs

| Name             | Description                 |
| ---------------- | --------------------------- |
| `test-exit-code` | Exit code from the test run |

## Coverage Reporters

### Codecov

Upload coverage to [Codecov](https://codecov.io/):

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
  with:
    coverage: "codecov"
    # For private repositories:
    codecov-token: ${{ secrets.CODECOV_TOKEN }}
```

### LCOV Reporter

Use [LCOV Reporter Action](https://github.com/zgosalvez/github-actions-report-lcov) for PR comments:

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
  with:
    coverage: "lcov"
    lcov-file: "coverage/lcov.info"
```

This will post coverage reports as PR comments.

## Examples

### Basic test without coverage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
```

### Test with Codecov

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
  with:
    coverage: "codecov"
```

### Test with LCOV reporter for PR comments

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
  with:
    coverage: "lcov"
    lcov-file: "coverage/lcov.info"
    github-token: ${{ github.token }}
```

### Test in a specific directory

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
  with:
    working-directory: "packages/api"
    coverage: "codecov"
```

### Test without failing on errors (warnings only)

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/test@main
  with:
    fail-on-error: "false"
```

## Test Script Requirements

The action expects a `test:ci` script to be defined in your `package.json`:

```json
{
  "scripts": {
    "test:ci": "jest --coverage --ci"
  }
}
```

## Coverage File Generation

For LCOV coverage, ensure your test framework generates an LCOV file:

### Jest

```json
{
  "jest": {
    "coverageReporters": ["lcov", "text"]
  }
}
```

### Vitest

```typescript
export default defineConfig({
  test: {
    coverage: {
      reporter: ["lcov", "text"],
    },
  },
});
```

## Notes

- The action runs in CI mode (`CI=true`) for consistent behavior
- Coverage reports are generated after tests complete, regardless of success/failure
- For pull requests with LCOV reporter, coverage reports appear as PR comments
- Codecov uses OIDC by default for public repositories (no token needed)

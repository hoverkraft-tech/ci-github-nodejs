# Lint Action

Composite action to lint Node.js projects with support for pull request reporting and GitHub annotations.

## Features

- Runs project lint scripts
- Processes lint report files and converts them to GitHub annotations
- Supports multiple report formats (JSON, XML/Checkstyle)
- Provides PR feedback with inline comments on violations
- Can be configured to fail or warn on errors

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@main
  with:
    # Working directory where lint commands are executed
    # Default: "."
    working-directory: "."

    # Whether running in container mode (skips checkout and node setup)
    # Default: "false"
    container: "false"

    # Path to lint report file for annotation processing
    # Default: ""
    report-file: "lint-report.json"

    # Whether to fail the action if linting errors are found
    # Default: "true"
    fail-on-error: "true"
```

## Inputs

| Name                  | Description                                                                      | Required | Default |
| --------------------- | -------------------------------------------------------------------------------- | -------- | ------- |
| `working-directory`   | Working directory where lint commands are executed                               | No       | `.`     |
| `container`           | Whether running in container mode (skips checkout and node setup)                | No       | `false` |
| `report-file`         | Path to lint report file to process as GitHub annotations                        | No       | `""`    |
| `fail-on-error`       | Whether to fail the action if linting errors are found                           | No       | `true`  |

## Supported Report Formats

### ESLint JSON

Configure your ESLint to output JSON:

```json
{
  "scripts": {
    "lint": "eslint . --format json --output-file lint-report.json || true"
  }
}
```

Then use the action:

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@main
  with:
    report-file: "lint-report.json"
```

### Checkstyle XML

Configure your linter to output Checkstyle XML format:

```json
{
  "scripts": {
    "lint": "eslint . --format checkstyle --output-file lint-report.xml || true"
  }
}
```

Then use the action:

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@main
  with:
    report-file: "lint-report.xml"
```

## Examples

### Basic lint

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@main
```

### Lint with report processing

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@main
  with:
    report-file: "eslint-report.json"
```

### Lint without failing on errors (warnings only)

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@main
  with:
    fail-on-error: "false"
```

### Lint in a specific directory

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/lint@main
  with:
    working-directory: "packages/frontend"
    report-file: "packages/frontend/lint-report.json"
```

## Notes

- The action expects a `lint` script to be defined in your `package.json`
- Report files are processed after linting completes, regardless of success/failure
- For pull requests, annotations will appear as inline comments on the Files Changed tab
- Supports both ESLint JSON and Checkstyle XML formats out of the box

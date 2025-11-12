# Build Action

Composite action to build Node.js projects with support for custom commands, environment variables, and artifact handling.

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/build@main
  with:
    # Working directory where build commands are executed
    # Default: "."
    working-directory: "."

    # List of build commands to execute (npm/pnpm/yarn script names)
    # Required
    build-commands: |
      build
      compile

    # JSON object of environment variables for the build
    # Default: "{}"
    build-env: |
      {
        "NODE_ENV": "production",
        "API_URL": "https://api.example.com"
      }

    # Multi-line string of secrets in env format
    # Default: ""
    build-secrets: |
      SECRET_KEY=${{ secrets.SECRET_KEY }}
      API_TOKEN=${{ secrets.API_TOKEN }}

    # JSON object for artifact upload configuration
    # Default: ""
    build-artifact: |
      {
        "name": "build-artifacts",
        "paths": "dist/\nbuild/"
      }

    # Whether running in container mode (skips checkout and node setup)
    # Default: "false"
    container: "false"
```

## Inputs

| Name                | Description                                                                  | Required | Default |
| ------------------- | ---------------------------------------------------------------------------- | -------- | ------- |
| `working-directory` | Working directory where build commands are executed                          | No       | `.`     |
| `build-commands`    | List of build commands to execute (npm/pnpm/Yarn script names), one per line | Yes      | -       |
| `build-env`         | JSON object of environment variables to set during the build                 | No       | `{}`    |
| `build-secrets`     | Multi-line string of secrets in env format (KEY=VALUE)                       | No       | `""`    |
| `build-artifact`    | JSON object specifying artifact upload configuration                         | No       | `""`    |
| `container`         | Whether running in container mode (skips checkout and node setup)            | No       | `false` |

## Outputs

| Name          | Description                                             |
| ------------- | ------------------------------------------------------- |
| `artifact-id` | ID of the uploaded artifact (if artifact was specified) |

## Examples

### Basic build

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/build@main
  with:
    build-commands: "build"
```

### Build with artifact upload

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/build@main
  with:
    build-commands: |
      build
      package
    build-artifact: |
      {
        "name": "build-output",
        "paths": "dist/"
      }
```

### Build with environment variables and secrets

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/build@main
  with:
    build-commands: "build"
    build-env: |
      {
        "NODE_ENV": "production",
        "API_URL": "https://api.example.com"
      }
    build-secrets: |
      SECRET_KEY=${{ secrets.SECRET_KEY }}
```

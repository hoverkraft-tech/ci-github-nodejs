<!-- start title -->

# GitHub Reusable Workflow: NodeJS Continuous Integration

<!-- end title -->
<!-- start description -->

Workflow to performs continuous integration steps agains a NodeJs project:

- CodeQL analysis
- Linting
- Build
- Test

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
name: Nodejs Continuous Integration

on:
  merge_group:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  continuous-integration:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@0.2.2
    permissions:
      id-token: write
      security-events: write
      contents: read
```

<!-- end usage -->
<!-- start secrets -->
<!-- end secrets -->
<!-- start inputs -->

## Inputs

| **Input**                 | **Description**                                                                                                    | **Type**             | **Default**               | **Required** |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------- | ------------ |
| **<code>build</code>**    | Build parameters. Must be a string or a json array of strings or object.                                           | <code>string</code>  | <code>build</code>        | **false**    |
| **<code>checks</code>**   | Optional flag to enable check steps.                                                                               | <code>boolean</code> | <code>true</code>         | **false**    |
| **<code>code-ql</code>**  | Code QL analysis language. See [https://github.com/github/codeql-action](https://github.com/github/codeql-action). | <code>string</code>  | <code>`typescript`</code> | **false**    |
| **<code>lint</code>**     | Optional flag to enable linting.                                                                                   | <code>boolean</code> | <code>true</code>         | **false**    |
| **<code>test</code>**     | Optional flag to enable test.                                                                                      | <code>boolean</code> | <code>true</code>         | **false**    |
| **<code>coverage</code>** | Specifify code coverage reporter. Supported values: `codecov`.                                                     | <code>string</code>  | <code>`codecov`</code>    | **false**    |

### `build` input parameters

When `build` is a json object, the following parameters are supported:

| **Input**  | **Description**                                                                                          | **Type**           | **Default** | **Required** |
| ---------- | -------------------------------------------------------------------------------------------------------- | ------------------ | ----------- | ------------ |
| `commands` | Build command(s).                                                                                        | string[]           | `["build"]` | **false**    |
| `artifact` | Build artifact (name will be `build`) to be uploaded. (See <https://github.com/actions/upload-artifact>) | string or string[] | ``          | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->

## Examples

### Continuous Integration, build and publish

```yaml

name: Continuous Integration - Build and Publish

name: Nodejs Continuous Integration

on:
  push:
    branches: [main]

jobs:
  continuous-integration:
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@0.2.2
    permissions:
      id-token: write
      security-events: write
      contents: read
    with:
      build: |
        {
          "commands": ["build"],
          "artifact": "dist"
        }

  publish:
    needs: continuous-integration
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup NodeJS
        uses: hoverkraft-tech/ci-github-nodejs/actions/setup-node@0.2.2

      - name: Download build artifact
        uses: actions/download-artifact@v2
        with:
          name: build
          path: dist

      - name: Publish
        run: |
          npm publish dist
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

<!-- end [.github/ghadocs/examples/] -->

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
    uses: hoverkraft-tech/ci-github-nodejs/.github/workflows/continuous-integration.yml@0.1.0
```

<!-- end usage -->
<!-- start secrets -->
<!-- end secrets -->
<!-- start inputs -->

| **Input**                 | **Description**                                                                                                    | **Type**             | **Default**               | **Required** |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------- | ------------ |
| **<code>build</code>**    | Build parameters. Must be a string or a json object.                                                               | <code>string</code>  | <code>build</code>        | **false**    |
| **<code>checks</code>**   | Optional flag to enable check steps.                                                                               | <code>boolean</code> | <code>true</code>         | **false**    |
| **<code>code-ql</code>**  | Code QL analysis language. See [https://github.com/github/codeql-action](https://github.com/github/codeql-action). | <code>string</code>  | <code>`typescript`</code> | **false**    |
| **<code>lint</code>**     | Optional flag to enable linting.                                                                                   | <code>boolean</code> | <code>true</code>         | **false**    |
| **<code>test</code>**     | Optional flag to enable test.                                                                                      | <code>boolean</code> | <code>true</code>         | **false**    |
| **<code>coverage</code>** | Specifify code coverage reporter. Supported values: `codecov`.                                                     | <code>string</code>  | <code>`codecov`</code>    | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

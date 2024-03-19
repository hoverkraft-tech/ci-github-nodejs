<!-- start title -->

# GitHub Action: Has installed dependencies

<!-- end title -->
<!-- start description -->

Action to check if dependencies have been installed according to the package manager used.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/has-installed-dependencies@v0.1.0
  with:
    # The dependencies to check.
    dependencies: ""
```

<!-- end usage -->
<!-- start inputs -->

## Inputs

| **Input**                     | **Description**            | **Default** | **Required** |
| ----------------------------- | -------------------------- | ----------- | ------------ |
| **<code>dependencies</code>** | The dependencies to check. |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->

## Outputs

| **Output**                          | **Description**                                                               | **Default** | **Required** |
| ----------------------------------- | ----------------------------------------------------------------------------- | ----------- | ------------ |
| <code>installed-dependencies</code> | A map of dependencies and the status weither they have been installed or not. | undefined   | undefined    |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

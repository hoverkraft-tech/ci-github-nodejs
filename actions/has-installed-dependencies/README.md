<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:settings color:gray-dark>" /> GitHub Action: Has installed dependencies

<!-- end title -->
<!-- start description -->

Action to check if dependencies have been installed according to the package manager used.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-nodejs@0.6.0
  with:
    # Description: The dependencies to check.
    #
    dependencies: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                 | **Description**            | **Default** | **Required** |
| ------------------------- | -------------------------- | ----------- | ------------ |
| <code>dependencies</code> | The dependencies to check. |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->

| **Output**                          | **Description**                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| <code>installed-dependencies</code> | A map of dependencies and the status weither they have been installed or not. |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

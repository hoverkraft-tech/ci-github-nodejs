<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:archive color:gray-dark>" /> GitHub Action: Dependencies cache

<!-- end title -->
<!-- start description -->

Action to setup dependencies cache managment.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-nodejs@0.11.0
  with:
    # Description: List of dependencies for which the cache should be managed.
    #
    dependencies: ""

    # Description: Working directory where the dependencies are installed.
    #
    # Default: .
    working-directory: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                      | **Description**                                             | **Default**    | **Required** |
| ------------------------------ | ----------------------------------------------------------- | -------------- | ------------ |
| <code>dependencies</code>      | List of dependencies for which the cache should be managed. |                | **true**     |
| <code>working-directory</code> | Working directory where the dependencies are installed.     | <code>.</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

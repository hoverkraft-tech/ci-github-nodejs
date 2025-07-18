<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:package color:gray-dark>" /> GitHub Action: Get package manager

<!-- end title -->
<!-- start description -->

Action to detect the package manager used. Supports Yarn and npm

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-nodejs@0.13.0
  with:
    # Description: Working directory where the dependencies are installed.
    #
    # Default: .
    working-directory: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                      | **Description**                                         | **Default**    | **Required** |
| ------------------------------ | ------------------------------------------------------- | -------------- | ------------ |
| <code>working-directory</code> | Working directory where the dependencies are installed. | <code>.</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| **Output**                         | **Description**                                       |
| ---------------------------------- | ----------------------------------------------------- |
| <code>package-manager</code>       | The package manager used.                             |
| <code>cache-dependency-path</code> | The path to the dependency file for cache management. |
| <code>install-command</code>       | The command to install dependencies.                  |
| <code>run-script-command</code>    | The command to run a script in the package.json file. |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

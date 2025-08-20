<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:settings color:gray-dark>" /> GitHub Action: Setup Node.js

<!-- end title -->
<!-- start description -->

Action to setup Node.js and install dependencies according to the package manager used.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-nodejs@0.14.1
  with:
    # Description: List of dependencies for which the cache should be managed
    #
    # Default:
    dependencies-cache: ""

    # Description: Working directory where the dependencies are installed.
    #
    # Default: .
    working-directory: ""
```

<!-- end usage -->
<!-- start inputs -->

| **Input**                       | **Description**                                            | **Default**    | **Required** |
| ------------------------------- | ---------------------------------------------------------- | -------------- | ------------ |
| <code>dependencies-cache</code> | List of dependencies for which the cache should be managed |                | **false**    |
| <code>working-directory</code>  | Working directory where the dependencies are installed.    | <code>.</code> | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| **Output**                      | **Description**                                      |
| ------------------------------- | ---------------------------------------------------- |
| <code>run-script-command</code> | The command to run a script in the package.json file |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

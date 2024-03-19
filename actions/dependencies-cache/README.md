<!-- start title -->

# GitHub Action: Dependencies cache

<!-- end title -->
<!-- start description -->

Action to setup dependencies cache managment.

<!-- end description -->
<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/dependencies-cache@0.3.0
  with:
    dependencies: |
      nx
      jest
```

<!-- end usage -->
<!-- start inputs -->

## Inputs

| **Input**                     | **Description**                                             | **Default** | **Required** |
| ----------------------------- | ----------------------------------------------------------- | ----------- | ------------ |
| **<code>dependencies</code>** | List of dependencies for which the cache should be managed. |             | **true**     |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

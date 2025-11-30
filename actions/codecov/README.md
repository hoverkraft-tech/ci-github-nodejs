# Codecov Action

Action to upload coverage to Codecov with support for container mode.

## Overview

This action handles uploading code coverage to Codecov. When running in container mode, it automatically installs required dependencies (Git, cURL, gnupg) via pkgxdev, fixes configuration issues with unexpanded environment variables, uploads coverage, and then cleans up the installed dependencies.

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-nodejs/actions/codecov@main
  with:
    # Working directory where coverage files are located.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # Whether running in container mode (installs dependencies if needed)
    # Default: `false`
    container: "false"
```

## Inputs

| **Input**               | **Description**                                                     | **Required** | **Default** |
| ----------------------- | ------------------------------------------------------------------- | ------------ | ----------- |
| **`working-directory`** | Working directory where coverage files are located.                 | **false**    | `.`         |
| **`container`**         | Whether running in container mode (installs dependencies if needed) | **false**    | `false`     |

## Features

- **Automatic dependency management**: In container mode, automatically detects and installs missing dependencies (Git, cURL, gnupg) using pkgxdev
- **Configuration fixes**: Automatically fixes pkgxdev configuration issues with unexpanded environment variables in gpgconf.ctl and .curlrc files
- **Cleanup**: Uninstalls dependencies after Codecov upload is complete
- **OIDC support**: Uses OIDC authentication with Codecov for secure uploads

# Maintain dependency updates

[Dependabot](../../.github/dependabot.yml) remains the primary updater for npm,
GitHub Actions, Dockerfiles and development containers.
[Renovate](../../.github/renovate.json) handles the root
[`.node-version`](../../.node-version) and `docker://` action references. Other
dependencies stay disabled in Renovate to avoid duplicate update pull requests.
Fixture Node version files link to the root file and are not updated separately.

The [Renovate workflow](../../.github/workflows/__renovate.yml) runs every Friday
at 04:23 UTC. After it is merged into the default branch, maintainers can also
select **Internal - Renovate dependency updates** in Actions and choose
**Run workflow**. It reads the checked-in configuration without an onboarding PR.

The workflow uses the existing CI GitHub App. Make `CI_BOT_APP_CLIENT_ID` available
as an Actions variable and `CI_BOT_APP_PRIVATE_KEY` as an Actions secret. The App
must be installed on this repository with checks read access and contents, issues,
pull requests, statuses and workflows write access. The generated token is scoped
to this repository. Renovate creates commits through GitHub's API using the App's
bot identity, allowing normal PR checks to run.

Renovate waits seven days for releases with a known publication timestamp. It
proposes Node updates for review without automerging them. Review compatibility
and the package-manager integration checks before merging a runtime
upgrade; a newer major version may exceed a fixture dependency's supported range.

When changing the configuration, validate it with the Renovate CLI:

```sh
renovate-config-validator --strict --no-global .github/renovate.json
```

Run `make lint` to validate the repository configuration and workflow.

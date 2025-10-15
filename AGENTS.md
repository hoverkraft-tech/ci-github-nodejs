# AGENTS.md — agent instructions and operational contract

This file is written for automated coding agents (for example: Copilot coding agents). It exists to provide a concise operational contract and guardrails for agents working in this repository. It is not the canonical source for design or style rules. Those live in the developer documentation linked below.

## Organization-wide guidelines (required)

- Follow the prioritized shared instructions in [hoverkraft-tech/.github/AGENTS.md](https://github.com/hoverkraft-tech/.github/blob/main/AGENTS.md) before working in this repository.

## Quick Start

This project is a collection of **opinionated GitHub Actions** and **reusable workflows** tailored for Node.js continuous integration pipelines. For comprehensive documentation, see the main [README.md](README.md).

### Key Sections to Reference

- **[Overview](README.md#overview)** – Project purpose and scope
- **[Actions](README.md#actions)** – Catalog of available actions by category
- **[Reusable Workflows](README.md#reusable-workflows)** – Orchestration workflows for Node.js CI
- **[Development Workflow](README.md#development-workflow)** – Commands and conventions for local development
- **[Contributing](README.md#contributing)** – Guidelines for contributing to the project

## Agent-Specific Development Patterns

### Critical Workflow Knowledge

```bash
# Essential commands for development
make lint        # Run Super Linter (dockerized)
make lint-fix    # Auto-fix linting issues
gh act -W .github/workflows/__test-workflow-continuous-integration.yml  # Optional: exercise reusable workflows locally
```

For detailed documentation on each action and workflow, refer to the individual readme files linked in the main [README.md](README.md).

# Project-Local AGENTS.md

> Template for a project or module root inside a multi-project solution. Copy into the project root as `AGENTS.md`, then replace placeholders with real values.

Project: TODO
Owned by: TODO

Parent: `../AGENTS.md`

## Purpose

- What this project or module does:
- Why it exists in the solution:

## Entry Points

- `...`
- `...`

## Boundaries

- In scope:
- Out of scope:
- Protected or high-risk areas:

## Project Commands

- `build`: `...`
- `test`: `...`
- `format`: `...`
- `analyze`: `...` (delete if not used)
- `aspire`: `aspire run ...` (required when this project owns integration tests, browser tests, or infrastructure-backed tests)

For .NET projects also document:

- the active test framework
- the runner model: `VSTest` or `Microsoft.Testing.Platform`
- whether analyzer severity lives in the repo-root `.editorconfig`

## Applicable Skills

- `...`
- `...`

For .NET projects, install the needed `.NET` skills from the [Managed Code Skills catalog](https://skills.managed-code.com/).
Aspire CLI is mandatory with MCAF/.NET setup when the repo has integration, browser, hosted, or infrastructure-backed tests. Install and validate it:

```bash
curl -sSL https://aspire.dev/install.sh | bash
aspire --version
```

The local skill list usually includes:

- `mcaf-testing`
- exactly one of `mcaf-dotnet-xunit`, `mcaf-dotnet-tunit`, or `mcaf-dotnet-mstest`
- `mcaf-dotnet-quality-ci`
- `mcaf-dotnet-complexity` when complexity gates are part of done

## Local Constraints

- Stricter maintainability limits, if any:
  - `file_max_loc`: `...`
  - `type_max_loc`: `...`
  - `function_max_loc`: `...`
  - `max_nesting_depth`: `...`
- Required local docs:
- Local exception policy:

## Local Rules

- Project-specific rules go here.
- Local rules may tighten root rules, but must not weaken them silently.
- Stub, Fake, and Mock doubles are forbidden by default; avoid them and use real implementations, Aspire-managed resources, public APIs, or user-visible flows.
- If a Stub, Fake, or Mock is unavoidable, document why in the nearest test or durable doc and include a removal plan.
- Integration tests and browser tests must run only through Aspire-managed AppHost orchestration.
- Keep infrastructure required by integration or browser coverage in Aspire projects/resources instead of ad hoc test startup code.

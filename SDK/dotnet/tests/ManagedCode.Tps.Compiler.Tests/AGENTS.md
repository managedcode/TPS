# AGENTS.md

Project: ManagedCode.Tps.Compiler.Tests
Owned by: ManagedCode.Tps .NET test maintainers

Parent: `../../../../AGENTS.md`

## Purpose

- Hold xUnit regression and verification coverage for `ManagedCode.Tps.Compiler`.
- Protect public contracts and future TPS behavior with repeatable tests.

## Entry Points

- `ManagedCode.Tps.Compiler.Tests.csproj`
- `TpsRuntimeTests.cs`
- `TpsInternalTests.cs`

## Boundaries

- In scope:
  - xUnit tests
  - coverage-related test setup
  - test-only helpers and fixtures
- Out of scope:
  - production library implementation
  - Node/site build logic
- Protected or high-risk areas:
  - xUnit runner configuration
  - coverage collector configuration
  - any shared fixture data used by future TPS compiler tests

## Project Commands

- `build`: `dotnet build ManagedCode.Tps.Compiler.Tests.csproj`
- `test`: `dotnet test ManagedCode.Tps.Compiler.Tests.csproj`
- `format`: `dotnet format ../../ManagedCode.Tps.slnx --verify-no-changes`
- `analyze`: `dotnet build ManagedCode.Tps.Compiler.Tests.csproj -warnaserror`

For this .NET project:

- Active test framework: xUnit
- Runner model: VSTest
- Analyzer severity lives in the repo-root `.editorconfig`

## Applicable Skills

- `mcaf-testing`
- `dotnet-xunit`
- `dotnet-quality-ci`
- `mcaf-code-review`

## Local Constraints

- Stricter maintainability limits:
  - `file_max_loc`: `300`
  - `type_max_loc`: `150`
  - `function_max_loc`: `40`
  - `max_nesting_depth`: `3`
- Required local docs: note new shared fixtures or non-trivial test harness rules in `docs/Architecture.md` and `SDK/docs/`.
- Local exception policy: any large fixture or long-form test helper needs an explicit reason and cleanup plan.

## Local Rules

- Keep test project namespaces under `ManagedCode.Tps.Compiler.Tests`.
- Do not move production logic into test helpers.
- Prefer behavior-oriented tests over implementation-detail assertions.

# AGENTS.md

Project: ManagedCode.Tps
Owned by: ManagedCode.Tps .NET core library maintainers

Parent: `../../../../AGENTS.md`

## Purpose

- Implement the .NET TPS library surface for `ManagedCode.Tps`.
- Keep parser/compiler/player logic, contracts, and future runtime code inside this project.

## Entry Points

- `ManagedCode.Tps.csproj`
- `TpsSpec.cs`
- `TpsRuntime.cs`
- `TpsPlayer.cs`

## Boundaries

- In scope:
  - .NET library code
  - public contracts and namespaces under `ManagedCode.Tps`
  - library-only build settings
- Out of scope:
  - xUnit test code
  - repository-wide CI docs unless they directly affect this project
  - Node/site build behavior
- Protected or high-risk areas:
  - public namespaces and assembly identity
  - shared contracts that tests or other projects may consume later

## Project Commands

- `build`: `dotnet build ManagedCode.Tps.csproj`
- `test`: `dotnet test ../../tests/ManagedCode.Tps.Tests/ManagedCode.Tps.Tests.csproj`
- `format`: `dotnet format ../../ManagedCode.Tps.slnx --verify-no-changes`
- `analyze`: `dotnet build ManagedCode.Tps.csproj -warnaserror`

For this .NET project:

- Active test framework for the repo: xUnit
- Runner model: VSTest
- Analyzer severity lives in the repo-root `.editorconfig`

## Applicable Skills

- `mcaf-solid-maintainability`
- `mcaf-testing`
- `dotnet-xunit`
- `dotnet-quality-ci`

## Local Constraints

- Stricter maintainability limits:
  - `file_max_loc`: `300`
  - `type_max_loc`: `150`
  - `function_max_loc`: `40`
  - `max_nesting_depth`: `3`
- Required local docs: update `docs/Architecture.md` and `SDK/docs/` when library boundaries change.
- Local exception policy: document any namespace, API, or size-limit exception in this file or a future ADR before merging.

## Local Rules

- Keep the `ManagedCode.Tps` namespace prefix intact.
- Do not place test helpers or test-only code in this project.
- Prefer small, composable types over large utility buckets.
- Do not add new TPS catalog literals inline when the value is part of the public runtime contract; expose and reuse named constants instead.
- Treat the .NET runtime module layout as the canonical source structure that the other SDKs should mirror where practical.

## Exception Record

- No active size exceptions in `src/ManagedCode.Tps`.

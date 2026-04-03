# AGENTS.md

Project: SDK dotnet workspace
Owned by: ManagedCode.Tps SDK maintainers

Parent: `../../AGENTS.md`

## Purpose

- Hold the C# TPS runtime projects and their tests.
- Keep the .NET implementation aligned with the shared SDK fixtures and contracts.

## Entry Points

- `src/ManagedCode.Tps/`
- `tests/ManagedCode.Tps.Tests/`

## Project Commands

- `build`: `dotnet build ManagedCode.Tps.slnx`
- `test`: `dotnet test ManagedCode.Tps.slnx`
- `coverage`: `dotnet test ManagedCode.Tps.slnx /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`
- `format`: `dotnet format ManagedCode.Tps.slnx --verify-no-changes`

## Local Rules

- Keep namespaces under `ManagedCode.Tps`.
- Prefer shared fixture-driven parity over handwritten duplicate expectations.

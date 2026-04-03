# ManagedCode.Tps .NET SDK

[![SDK CSharp](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml)
[![SDK CSharp Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml)

This folder contains the .NET TPS runtime under the `ManagedCode.Tps` namespace.

Package identity: `ManagedCode.Tps`

## What This Project Is

`SDK/dotnet` is the C# implementation of the TPS runtime. It provides the same functional surface as the active TypeScript/JavaScript SDKs, but as a native .NET library under the `ManagedCode.Tps` namespace.

This is the project to change when the .NET API, serialization behavior, or .NET runtime semantics need to evolve.

## Public API

- `TpsSpec`: TPS constants, tags, metadata keys, emotions, diagnostics, and palettes
- `TpsRuntime.Validate(source)`
- `TpsRuntime.Parse(source)`
- `TpsRuntime.Compile(source)`
- `TpsPlayer`

## Project Layout

- `src/ManagedCode.Tps/`: runtime implementation
- `tests/ManagedCode.Tps.Tests/`: xUnit coverage and parity tests

## Technical Scope

- validation returns actionable `TpsDiagnostic` entries with exact ranges
- parse returns the TPS document model with segments and blocks
- compile returns the fully timed state machine with compiled words, phrases, blocks, and segments
- player resolves the current presentation model for any elapsed timestamp

## How To Work With This Project

1. Update `src/ManagedCode.Tps/` for runtime or API changes.
2. Keep behavior aligned with the active TPS contract used by the TS/JS SDKs.
3. Run build, tests, and coverage checks after changes.

## Local Commands

- `dotnet build ManagedCode.Tps.slnx -warnaserror --no-restore`
- `dotnet test ManagedCode.Tps.slnx --no-build --no-restore`
- `dotnet test ManagedCode.Tps.slnx --no-build --no-restore /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`

## Target Runtime

- `TargetFramework`: `net10.0`
- `AssemblyName`: `ManagedCode.Tps`
- `RootNamespace`: `ManagedCode.Tps`

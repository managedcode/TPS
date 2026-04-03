# ManagedCode.Tps SDK

| Runtime | Status | Build/Test | Coverage |
|---------|--------|------------|----------|
| TypeScript | Active | [![SDK TypeScript](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript.yml) | — |
| JavaScript | Active | [![SDK JavaScript](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml) | [![SDK JavaScript Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml) |
| C# | Active | [![SDK CSharp](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml) | [![SDK CSharp Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml) |
| Flutter | Planned | ![Status](https://img.shields.io/badge/status-planned-c4a060) | — |
| Swift | Planned | ![Status](https://img.shields.io/badge/status-planned-c4a060) | — |
| Java | Planned | ![Status](https://img.shields.io/badge/status-planned-c4a060) | — |

`SDK/` is the multi-runtime workspace for `ManagedCode.Tps`.

## What This Workspace Contains

This folder is where TPS runtime implementations live. The goal is parity across active runtimes:

- constants catalog
- TPS validation with actionable diagnostics
- TPS parsing into a document model
- TPS compilation into a JSON-friendly state machine
- player/runtime APIs that resolve what to display at a specific elapsed time

The TypeScript runtime is the canonical implementation. The JavaScript runtime is the consumer-facing built artifact of that source. The .NET runtime is an independent implementation under the `ManagedCode.Tps` namespace.

## Workspace Layout

- `ts/`: canonical TypeScript implementation
- `js/`: generated JavaScript runtime, Node tests, and package metadata
- `dotnet/`: .NET runtime, solution, and xUnit tests
- `flutter/`: reserved Flutter runtime folder
- `swift/`: reserved Swift runtime folder
- `java/`: reserved Java runtime folder
- `fixtures/`: shared TPS fixtures and expected runtime behavior
- `docs/`: SDK ADRs and architecture notes
- `manifest.json`: internal runtime matrix source for CI and site generation

## Runtime Guide

| Folder | Purpose | Edit Here When | Main Commands |
|--------|---------|----------------|---------------|
| `SDK/ts` | canonical runtime source | changing TPS behavior or runtime contract | `npm --prefix SDK/js run build:tps`, `npm --prefix SDK/js run test:typescript` |
| `SDK/js` | JavaScript package and Node validation | changing JS packaging or JS-specific tests | `npm --prefix SDK/js run test:js`, `npm --prefix SDK/js run coverage:js` |
| `SDK/dotnet` | C# runtime and tests | changing .NET API or .NET behavior | `dotnet build SDK/dotnet/ManagedCode.Tps.slnx -warnaserror --no-restore`, `dotnet test SDK/dotnet/ManagedCode.Tps.slnx --no-build --no-restore` |
| `SDK/flutter` | placeholder | starting Flutter implementation | define runtime structure, tests, and workflow |
| `SDK/swift` | placeholder | starting Swift implementation | define runtime structure, tests, and workflow |
| `SDK/java` | placeholder | starting Java implementation | define runtime structure, tests, and workflow |

## Compiled Model

The compiled TPS state machine is organized as:

1. metadata
2. segments
3. blocks
4. phrases
5. words

Each compiled word carries timing and authoring-derived metadata such as emphasis, emotion, speed override, pronunciation, volume, delivery mode, and edit-point markers.

## How To Work In This SDK

1. Change the TPS contract in `SDK/ts` first unless the work is package-specific or .NET-specific.
2. Rebuild the JS runtime from the TS source.
3. Run the runtime-specific tests for the SDK you changed.
4. If behavior changes, keep parity across active runtimes and shared fixtures.
5. Regenerate example snapshots when the compiled output or player states intentionally change.

## Local Verification

- TypeScript: `npm --prefix SDK/js run test:typescript`
- JavaScript: `npm --prefix SDK/js run coverage:js`
- C#: `dotnet test SDK/dotnet/ManagedCode.Tps.slnx --no-build --no-restore /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`

## Shared Example Snapshots

`SDK/fixtures/examples/*.snapshot.json` are cross-runtime integration fixtures generated from the documented `examples/*.tps` files. Active runtimes must compile those examples into the same normalized state machine shape and produce the same checkpointed player states.

Regenerate them with:

- `npm --prefix SDK/js run generate:example-snapshots`

## GitHub Workflows

- `.github/workflows/ci.yml`: repo-wide build/test matrix
- `.github/workflows/coverage.yml`: repo-wide coverage matrix
- `.github/workflows/sdk-typescript.yml`: TypeScript build and typecheck badge target
- `.github/workflows/sdk-javascript.yml`: JavaScript build/test badge target
- `.github/workflows/sdk-javascript-coverage.yml`: JavaScript coverage badge target
- `.github/workflows/sdk-dotnet.yml`: C# build/test badge target
- `.github/workflows/sdk-dotnet-coverage.yml`: C# coverage badge target

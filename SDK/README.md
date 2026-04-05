# ManagedCode.Tps SDK

| Runtime | Status | Build/Test | Coverage |
|---------|--------|------------|----------|
| TypeScript | Active | [![SDK TypeScript](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript.yml) | [![SDK TypeScript Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript-coverage.yml) |
| JavaScript | Active | [![SDK JavaScript](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml) | [![SDK JavaScript Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml) |
| C# | Active | [![SDK CSharp](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml) | [![SDK CSharp Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml) |
| Flutter | Active | [![SDK Flutter](https://github.com/managedcode/TPS/actions/workflows/sdk-flutter.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-flutter.yml) | [![SDK Flutter Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-flutter-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-flutter-coverage.yml) |
| Swift | Active | [![SDK Swift](https://github.com/managedcode/TPS/actions/workflows/sdk-swift.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-swift.yml) | [![SDK Swift Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-swift-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-swift-coverage.yml) |
| Java | Active | [![SDK Java](https://github.com/managedcode/TPS/actions/workflows/sdk-java.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-java.yml) | [![SDK Java Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-java-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-java-coverage.yml) |

`SDK/` is the multi-runtime workspace for `ManagedCode.Tps`.

## What This Workspace Contains

This folder is where TPS runtime implementations live. The goal is parity across active runtimes:

- constants catalog
- TPS validation with actionable diagnostics
- TPS parsing into a document model
- TPS compilation into a JSON-friendly state machine
- player/runtime APIs for both deterministic sampling and live timed playback

The TypeScript runtime is the canonical implementation. The JavaScript runtime is the consumer-facing built artifact of that source. The .NET, Flutter, Swift, and Java runtimes are independent implementations that are kept aligned through shared fixtures and parity tests.

Compiled TPS output is meant to be portable. The active runtimes treat the compiled state machine as the shared transport format for `compile -> json -> restore -> play` flows.

The root [README.md](/Users/ksemenenko/Developer/TPS/README.md) is the canonical format specification. This SDK README documents the runtime contract that is implemented today.

## Workspace Layout

- `ts/`: canonical TypeScript implementation
- `js/`: generated JavaScript runtime, Node tests, and package metadata
- `dotnet/`: .NET runtime, solution, and xUnit tests
- `flutter/`: Dart runtime for Flutter hosts
- `swift/`: Swift runtime package
- `java/`: Java runtime package
- `fixtures/`: shared TPS fixtures and expected runtime behavior
- `docs/`: SDK ADRs and architecture notes
- `manifest.json`: internal runtime matrix source for CI and site generation

## Runtime Guide

| Folder | Purpose | Edit Here When | Main Commands |
|--------|---------|----------------|---------------|
| `SDK/ts` | canonical runtime source | changing TPS behavior or runtime contract | `npm --prefix SDK/js run build:tps`, `npm --prefix SDK/js run coverage:typescript` |
| `SDK/js` | JavaScript package and Node validation | changing JS packaging or JS-specific tests | `npm --prefix SDK/js run test:js`, `npm --prefix SDK/js run coverage:js` |
| `SDK/dotnet` | C# runtime and tests | changing .NET API or .NET behavior | `dotnet build SDK/dotnet/ManagedCode.Tps.slnx -warnaserror --no-restore`, `dotnet test SDK/dotnet/ManagedCode.Tps.slnx --no-restore` |
| `SDK/flutter` | Dart runtime for Flutter hosts | changing Flutter/Dart behavior or tests | `cd SDK/flutter && dart pub get && ./coverage.sh` |
| `SDK/swift` | Swift runtime package | changing Apple-platform runtime behavior or tests | `cd SDK/swift && ./coverage.sh` |
| `SDK/java` | Java runtime package | changing Java behavior or tests | `cd SDK/java && ./coverage.sh` |

## Source Input Conventions

The format spec allows these file naming conventions:

- `.tps`
- `.tps.md`
- `.md.tps`

The runtimes themselves compile TPS source text, not a specific extension. If a host already has the script content in memory, it can compile it directly without depending on the original file name.

## Current Runtime Contract

Across the active runtimes, the shared contract today includes:

- spec constants for metadata keys, keywords, emotions, archetypes, tags, and playback defaults
- actionable TPS diagnostics for malformed structure, invalid ranges, unknown tags, and unknown archetypes
- parsing into a document model with segment, block, phrase, and word scopes
- compilation into a normalized JSON-friendly state machine
- restore from compiled JSON or compiled object graphs
- deterministic playback via `TpsPlayer`
- timed playback via `TpsPlaybackSession`
- compile-and-play embedding via `TpsStandalonePlayer`

Archetype parsing, inheritance, and recommended-WPM defaults are part of the current parity contract.

The advisory archetype-profile mismatch warnings and rhythm-analysis warnings described in the root spec are format-level guidance and are not yet enforced uniformly across every runtime.

## Compiled Model

The compiled TPS state machine is organized as:

1. metadata
2. segments
3. blocks
4. phrases
5. words

Each compiled word carries timing and authoring-derived metadata such as emphasis, pause timing, highlight, breath, edit-point markers, emotion hints, articulation, energy, melody, volume, speed override or multiplier, pronunciation or phonetic guides, stress guides, speaker, and head-cue data.

## Playback Model

Active runtimes expose three playback layers:

- `TpsPlayer`: pure resolver for `GetState(elapsed)` and deterministic sampling
- `TpsPlaybackSession`: stateful controller with its own timer, transport controls, speed correction, transition events, and host-controllable time sources
- `TpsStandalonePlayer`: compile-and-play wrapper that starts from TPS source and exposes the embeddable runtime surface in one object, including direct commands and snapshot events
- active runtimes also expose `FromCompiledScript(...)` and `FromCompiledJson(...)` helpers so hosts can restore a precompiled TPS JSON state machine instead of recompiling source on every open

Use `TpsPlayer` when the host already owns the clock. Use `TpsPlaybackSession` when the SDK should drive playback itself from an already compiled state machine. Use `TpsStandalonePlayer` when the host wants one SDK-owned object that compiles TPS, plays it, and exposes bindable commands and snapshots.

## Embeddable Control Surface

The standalone player/session layer is UI-framework-neutral. The SDK does not render HTML, Razor, or native buttons for you; instead it exposes the command surface a host UI binds to:

- `play`, `pause`, `stop`, `seek`
- `advanceBy`
- `nextWord`, `previousWord`
- `nextBlock`, `previousBlock`
- `increaseSpeed`, `decreaseSpeed`, `setSpeedOffsetWpm`
- `snapshotChanged`
- `observeSnapshot` / `ObserveSnapshot` for immediate current-state replay plus future updates

Each snapshot exposes:

- current segment, block, phrase, and focused word
- visible words with read/active/upcoming state plus word effects
- current transport status and completion progress
- tempo state: base WPM, global offset, effective base WPM, playback rate
- control availability for enabling or disabling host buttons

Keep the root [README.md](/Users/ksemenenko/Developer/TPS/README.md) aligned with `examples/*.tps`, `SDK/fixtures/invalid/*.tps`, and the shared example snapshots whenever TPS syntax or playback semantics change.

On .NET, prefer wiring playback through `TpsPlaybackSessionOptions.TimeProvider` when a host needs deterministic or externally controlled time.
On .NET UI hosts, also wire `TpsPlaybackSessionOptions.EventSynchronizationContext` so snapshot and state events land on the dispatcher the host actually renders from.

## How To Work In This SDK

1. Change the TPS contract in `SDK/ts` first unless the work is package-specific or .NET-specific.
2. Rebuild the JS runtime from the TS source.
3. Run the runtime-specific tests for the SDK you changed.
4. If behavior changes, keep parity across active runtimes and shared fixtures.
5. Regenerate example snapshots when the compiled output or player states intentionally change.

## Local Verification

- TypeScript: `npm --prefix SDK/js run coverage:typescript`
- JavaScript: `npm --prefix SDK/js run coverage:js`
- C#: `dotnet test SDK/dotnet/ManagedCode.Tps.slnx --no-restore /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`
- Flutter: `cd SDK/flutter && ./coverage.sh`
- Swift: `cd SDK/swift && ./coverage.sh`
- Java: `cd SDK/java && ./coverage.sh`

## Shared Example Snapshots

`SDK/fixtures/examples/*.snapshot.json` are cross-runtime integration fixtures generated from the documented `examples/*.tps` files. Active runtimes must compile those examples into the same normalized state machine shape, produce the same checkpointed player states, and expose the same session/standalone playback snapshots for navigation and speed controls.

`SDK/fixtures/transport/*.json` are canonical compiled-wire fixtures. Active runtimes must serialize the same JSON transport shape and be able to restore playback from it.

Regenerate them with:

- `npm --prefix SDK/js run generate:example-snapshots`

## GitHub Workflows

- `.github/workflows/ci.yml`: repo-wide build/test matrix
- `.github/workflows/coverage.yml`: repo-wide coverage matrix
- `.github/workflows/sdk-typescript.yml`: TypeScript build and typecheck badge target
- `.github/workflows/sdk-typescript-coverage.yml`: TypeScript coverage badge target
- `.github/workflows/sdk-javascript.yml`: JavaScript build/test badge target
- `.github/workflows/sdk-javascript-coverage.yml`: JavaScript coverage badge target
- `.github/workflows/sdk-dotnet.yml`: C# build/test badge target
- `.github/workflows/sdk-dotnet-coverage.yml`: C# coverage badge target
- `.github/workflows/sdk-flutter.yml`: Flutter build/test badge target
- `.github/workflows/sdk-flutter-coverage.yml`: Flutter coverage badge target
- `.github/workflows/sdk-swift.yml`: Swift build/test badge target
- `.github/workflows/sdk-swift-coverage.yml`: Swift coverage badge target
- `.github/workflows/sdk-java.yml`: Java build/test badge target
- `.github/workflows/sdk-java-coverage.yml`: Java coverage badge target

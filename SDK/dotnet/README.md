# ManagedCode.Tps .NET SDK

[![SDK CSharp](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet.yml)
[![SDK CSharp Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-dotnet-coverage.yml)

This folder contains the .NET TPS runtime under the `ManagedCode.Tps` namespace.

Package identity: `ManagedCode.Tps`

## What This Project Is

`SDK/dotnet` is the canonical C# implementation of the TPS runtime. It defines the reference module layout and runtime behavior that the other SDKs mirror where practical, while still shipping as a native .NET library under the `ManagedCode.Tps` namespace.

This is the project to change when the .NET API, serialization behavior, or .NET runtime semantics need to evolve.

## Public API

- `TpsSpec`: TPS constants, tags, metadata keys, emotions, diagnostics, and palettes
- `TpsRuntime.Validate(source)`
- `TpsRuntime.Parse(source)`
- `TpsRuntime.Compile(source)`
- `TpsPlayer`: pure state resolver
- `TpsPlayer.EnumerateStates(stepMs)`: deterministic sampling helper
- `TpsPlaybackSession`: live playback controller with `Play/Pause/Stop/Seek/AdvanceBy`, `NextWord/PreviousWord`, `NextBlock/PreviousBlock`, and speed correction
- `TpsPlaybackSessionOptions.TimeProvider`: host-supplied clock for deterministic playback loops and tests
- `TpsPlaybackSessionOptions.EventSynchronizationContext`: event-dispatch target for UI hosts
- `TpsPlaybackSession.Snapshot`: embeddable runtime snapshot for host UIs
- `TpsPlaybackSession` events: `StateChanged`, `WordChanged`, `PhraseChanged`, `BlockChanged`, `SegmentChanged`, `StatusChanged`, `Completed`, `SnapshotChanged`, `ListenerException`
- `TpsPlaybackSession.ObserveSnapshot(observer, emitCurrent)`: UI-friendly subscription that replays the current snapshot before future updates
- `TpsStandalonePlayer.Compile(source, options)`: stand-alone compile-and-play wrapper
- `TpsStandalonePlayer.FromCompiledScript(script, options)`: stand-alone wrapper starting from a precompiled TPS state machine
- `TpsStandalonePlayer.FromCompiledJson(json, options)`: stand-alone wrapper starting from serialized compiled JSON
- `TpsStandalonePlayer`: direct wrapper surface for `Play/Pause/Stop/Seek/AdvanceBy`, `NextWord/PreviousWord`, `NextBlock/PreviousBlock`, `IncreaseSpeed/DecreaseSpeed/SetSpeedOffsetWpm`, `SnapshotChanged`, `ListenerException`, and `ObserveSnapshot`

## Project Layout

- `src/ManagedCode.Tps/`: runtime implementation
- `src/ManagedCode.Tps/TpsSpec*.cs`: public constants, tags, palettes, and archetype catalogs
- `src/ManagedCode.Tps/Models/*Contracts.cs`: public JSON/runtime models
- `src/ManagedCode.Tps/Internal/TpsParser*.cs`: parser pipeline split by responsibility
- `src/ManagedCode.Tps/Internal/TpsContentCompiler*.cs`: compiler pipeline split by responsibility
- `src/ManagedCode.Tps/Internal/TpsArchetypeAnalyzer*.cs`: advisory archetype diagnostics
- `src/ManagedCode.Tps/TpsRuntime*.cs`: compile pipeline and state-machine assembly
- `src/ManagedCode.Tps/TpsPlaybackSession*.cs`: playback transport, loop, and event dispatch
- `tests/ManagedCode.Tps.Tests/`: xUnit coverage and parity tests

## Technical Scope

- validation returns actionable `TpsDiagnostic` entries with exact ranges
- parse returns the TPS document model with segments and blocks
- compile returns the fully timed state machine with compiled words, phrases, blocks, and segments
- compile output serializes as a portable camelCase JSON contract, so hosts can persist it and restore it later
- player resolves the current presentation model for any elapsed timestamp
- playback session owns the timer loop for hosts that want event-driven runtime playback from an already compiled script, optionally through a custom `TimeProvider`
- standalone player wraps compile + playback for raw TPS source inputs and proxies the transport surface directly
- standalone player can also start from an already compiled `CompiledScript` or compiled JSON payload
- precompiled JSON restore validates the full compiled graph before playback and normalizes it into read-only runtime collections

## How To Work With This Project

1. Update `src/ManagedCode.Tps/` for runtime or API changes.
2. Treat this runtime as the canonical contract and keep the other SDKs aligned with behavior changes made here.
3. Run build, tests, and coverage checks after changes.
4. Keep example snapshot parity with the shared fixtures under `SDK/fixtures/examples`.
5. Keep the canonical compiled JSON transport fixture under `SDK/fixtures/transport` aligned with the runtime serializer.

Use `TpsPlaybackSession` when your host already owns the compiled TPS state machine. Use `TpsStandalonePlayer` when your host starts from raw TPS source and wants one SDK object with commands, events, and snapshots. Use `TpsStandalonePlayer.FromCompiledScript(...)` or `FromCompiledJson(...)` when your host receives a precompiled state machine from storage, a server, or another runtime. Keep `TpsPlayer` deterministic so tests, editors, and hosts with their own render loops can sample exact state by timestamp.

For embeddable controls, bind your own buttons to `Play`, `Pause`, `Stop`, `Seek`, `AdvanceBy`, `NextWord`, `PreviousWord`, `NextBlock`, `PreviousBlock`, `IncreaseSpeed`, and `DecreaseSpeed`, then render from `ObserveSnapshot(...)`, `SnapshotChanged`, or the current `Snapshot` property. The snapshot already contains control gating, focused word, visible words, timing, and authoring-derived styling metadata, so the host UI should not recompute those rules independently.

For WinUI/WPF/MAUI/Avalonia-style hosts, create the player on the UI thread or pass `EventSynchronizationContext` explicitly so the playback events arrive on the dispatcher you actually render from.

```csharp
using var player = TpsStandalonePlayer.Compile(tpsSource);
using var subscription = player.ObserveSnapshot(snapshot => Render(snapshot));

playButton.Click += (_, _) => player.Play();
pauseButton.Click += (_, _) => player.Pause();
nextWordButton.Click += (_, _) => player.NextWord();
slowerButton.Click += (_, _) => player.DecreaseSpeed();
```

```csharp
using System.Text.Json;

var compiled = TpsRuntime.Compile(tpsSource).Script;
var json = JsonSerializer.Serialize(compiled);

using var player = TpsStandalonePlayer.FromCompiledJson(json);
using var subscription = player.ObserveSnapshot(Render);

player.Play();
```

When the standalone player starts from a compiled script or JSON payload, `HasSourceCompilation` is `false` and `Document` becomes a projected structural document built from the compiled graph. That projected document is intended for labels, navigation, and host UI structure, not for reconstructing the original `.tps` authoring text.

The root [README.md](/Users/ksemenenko/Developer/TPS/README.md) is the authoritative TPS format reference. Keep this SDK README aligned with that spec and with the shared example fixtures under `examples/` and `SDK/fixtures/`.

## Local Commands

- `dotnet build ManagedCode.Tps.slnx -warnaserror --no-restore`
- `dotnet test ManagedCode.Tps.slnx --no-restore`
- `dotnet test ManagedCode.Tps.slnx --no-restore /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`

## Target Runtime

- `TargetFramework`: `net10.0`
- `AssemblyName`: `ManagedCode.Tps`
- `RootNamespace`: `ManagedCode.Tps`
- uses modern .NET playback primitives such as `TimeProvider`
- uses C# 14 field-backed property validation for playback options

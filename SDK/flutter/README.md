# ManagedCode.Tps Flutter SDK

[![SDK CI](https://github.com/managedcode/TPS/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/ci.yml)

This folder contains the Dart runtime intended for Flutter hosts.

Package identity: `managedcode_tps`

## What This Project Is

`SDK/flutter` is the Flutter-facing TPS runtime. It is implemented as a pure Dart package so it can be embedded into Flutter apps without owning the widget layer.

The package follows the same compile-and-play contract as the TypeScript, JavaScript, Swift, Java, and .NET runtimes.

## Public API

- `TpsSpec`
- `TpsKeywords`
- `validateTps(source)`
- `parseTps(source)`
- `compileTps(source)`
- `TpsPlayer`: pure deterministic resolver
- `TpsPlayer.enumerateStates(stepMs)`: deterministic sampling helper
- `TpsPlaybackSession`: timer-driven playback controller with `play`, `pause`, `stop`, `seek`, `advanceBy`, `nextWord`, `previousWord`, `nextBlock`, `previousBlock`, `increaseSpeed`, `decreaseSpeed`, and `setSpeedOffsetWpm`
- `TpsPlaybackSession.snapshot`: embeddable runtime snapshot for host widgets
- `TpsPlaybackSession.on(eventName, listener)`: runtime events including `snapshotChanged` and `completed`
- `TpsStandalonePlayer.compile(source, options)`: compile-and-play wrapper
- `TpsStandalonePlayer.fromCompiledScript(script, options)`: start from a compiled TPS state machine
- `TpsStandalonePlayer.fromCompiledJson(json, options)`: restore from serialized compiled JSON

## Project Layout

- `lib/src/managedcode_tps.dart`: runtime implementation
- `lib/managedcode_tps.dart`: package export surface
- `test/runtime_test.dart`: parity, integration, timer, and large-script coverage

## Integration Model

This SDK is intentionally UI-neutral. Flutter widgets should bind to runtime commands and rebuild from `snapshot` updates.

Recommended host flow:

1. Create `TpsStandalonePlayer.compile(source)` when the app starts from raw `.tps`.
2. Restore `TpsStandalonePlayer.fromCompiledJson(json)` when the app already has compiled TPS JSON.
3. Bind buttons and gestures to `play`, `pause`, `seek`, `nextWord`, `previousWord`, `nextBlock`, `previousBlock`, `increaseSpeed`, and `decreaseSpeed`.
4. Render from the snapshot view-model instead of recomputing active-word state in the widget tree.

## Local Commands

- `cd SDK/flutter && dart pub get`
- `cd SDK/flutter && dart analyze`
- `cd SDK/flutter && dart test`
- `cd SDK/flutter && ./coverage.sh`

## Verification Scope

The tests cover:

- constants and keyword catalog parity
- canonical compiled transport JSON parity
- shared example snapshots for compile, player, session, and standalone playback
- invalid TPS diagnostics
- public parse/validate API behavior for title headers, front matter, punctuation, and malformed authoring
- compiled JSON restore guards and playback session control flow
- timed playback completion
- large generated-script performance smoke
- line coverage gate at 90% or higher for SDK source

Keep this package aligned with the root [README.md](/Users/ksemenenko/Developer/TPS/README.md) specification and the shared fixtures under `SDK/fixtures/`.

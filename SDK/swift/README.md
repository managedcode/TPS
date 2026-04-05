# ManagedCode.Tps Swift SDK

[![SDK CI](https://github.com/managedcode/TPS/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/ci.yml)

This folder contains the Swift TPS runtime package.

Package identity: `ManagedCodeTps`

## What This Project Is

`SDK/swift` is the native Swift implementation of the TPS runtime. It is designed as a standalone Swift package that compiles TPS source, restores compiled TPS JSON, and drives playback for Apple-platform hosts.

## Public API

- `TpsSpec`
- `TpsKeywords`
- `TpsRuntime.validateTps(source)`
- `TpsRuntime.parseTps(source)`
- `TpsRuntime.compileTps(source)`
- `TpsPlayer`: deterministic state resolver
- `TpsPlayer.enumerateStates(stepMs:)`: deterministic sampling helper
- `TpsPlaybackSession`: timed playback controller with transport, navigation, and speed controls
- `TpsPlaybackSession.snapshot`: embeddable runtime snapshot for host UIs
- `TpsPlaybackSession.on(_:listener:)`: runtime event subscription
- `TpsStandalonePlayer.compile(source:options:)`: compile-and-play wrapper
- `TpsStandalonePlayer.fromCompiledScript(_:options:)`: start from a compiled state machine
- `TpsStandalonePlayer.fromCompiledJson(_:options:)`: restore from serialized compiled JSON

## Project Layout

- `Package.swift`: SwiftPM definition
- `Sources/ManagedCodeTps/ManagedCodeTps.swift`: runtime source
- `Tests/ManagedCodeTpsTests/ManagedCodeTpsTests.swift`: parity, playback, and integration tests

## Integration Model

This package does not own the UI layer. Native Apple hosts should:

1. compile or restore TPS into `TpsStandalonePlayer`
2. observe snapshots or runtime events
3. bind UI commands to `play`, `pause`, `stop`, `seek`, `nextWord`, `previousWord`, `nextBlock`, `previousBlock`, `increaseSpeed`, `decreaseSpeed`, and `setSpeedOffsetWpm`

`TpsPlayer` stays deterministic for editor previews and host-owned render loops. `TpsPlaybackSession` owns the internal timer for live playback.

## Local Commands

- `cd SDK/swift && swift build`
- `cd SDK/swift && swift test`
- `cd SDK/swift && ./coverage.sh`

## Verification Scope

The Swift suite checks:

- constants and keyword parity
- canonical transport JSON parity
- shared example snapshots
- invalid TPS diagnostics
- public parse/validate API behavior for title headers, front matter, punctuation, and malformed authoring
- compiled JSON restore guards and playback session lifecycle
- timed playback completion
- large generated-script compile/player smoke
- line coverage gate at 90% or higher for SDK source

Keep this package aligned with the root [README.md](/Users/ksemenenko/Developer/TPS/README.md) specification and the shared fixtures under `SDK/fixtures/`.

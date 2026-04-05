# ManagedCode.Tps Java SDK

[![SDK CI](https://github.com/managedcode/TPS/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/ci.yml)

This folder contains the Java TPS runtime.

Package namespace: `com.managedcode.tps`

## What This Project Is

`SDK/java` is the standalone Java implementation of the TPS runtime. It provides the same compile, validation, transport, and playback behavior as the other SDKs while staying dependency-light.

## Public API

The Java runtime is exposed through `ManagedCodeTps` and nested types:

- `ManagedCodeTps.TpsSpec`
- `ManagedCodeTps.TpsKeywords`
- `ManagedCodeTps.TpsRuntime.validateTps(source)`
- `ManagedCodeTps.TpsRuntime.parseTps(source)`
- `ManagedCodeTps.TpsRuntime.compileTps(source)`
- `ManagedCodeTps.TpsRuntime.toCompiledJson(script)`
- `ManagedCodeTps.TpsRuntime.fromCompiledJson(json)`
- `ManagedCodeTps.TpsPlayer`: deterministic state resolver
- `ManagedCodeTps.TpsPlaybackSession`: timed playback controller with transport, navigation, speed correction, and events
- `ManagedCodeTps.TpsStandalonePlayer`: compile-and-play wrapper with restore-from-JSON support

## Project Layout

- `src/main/java/com/managedcode/tps/ManagedCodeTps.java`: runtime implementation
- `src/test/java/com/managedcode/tps/ManagedCodeTpsTests.java`: integration-style parity tests
- `build.sh`: compile main runtime classes
- `test.sh`: compile tests and run the Java test harness

## Integration Model

The Java runtime is renderer-neutral. Host UIs should compile or restore TPS, bind buttons to the playback commands, and render from snapshots instead of recomputing active-word state themselves.

Use:

- `TpsPlayer` for host-owned clocks
- `TpsPlaybackSession` for SDK-owned timer playback
- `TpsStandalonePlayer` for compile-and-play or restore-and-play entry points

## Local Commands

- `cd SDK/java && ./build.sh`
- `cd SDK/java && ./test.sh`
- `cd SDK/java && ./coverage.sh`

## Verification Scope

The Java suite covers:

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

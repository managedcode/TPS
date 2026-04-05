# ManagedCode.Tps TypeScript SDK

[![SDK CI](https://github.com/managedcode/TPS/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/ci.yml)

This folder contains the canonical TPS implementation.

## What This Project Is

`SDK/ts` is the source of truth for TPS runtime behavior. If TPS parsing, compilation, validation, constants, or player semantics change, this is the first project that should usually be updated.

This project defines the runtime contract that the JavaScript package follows and that the C# runtime must match semantically.

## Public API

- `TpsSpec`
- `TpsKeywords`
- `validateTps(source)`
- `parseTps(source)`
- `compileTps(source)`
- `TpsPlayer`: pure state resolver
- `TpsPlayer.enumerateStates(stepMs)`: deterministic sampling helper
- `TpsPlaybackSession`: live controller with `play/pause/stop/seek/advanceBy`, `nextWord/previousWord`, `nextBlock/previousBlock`, and speed correction
- `TpsPlaybackSession.snapshot`: embeddable runtime snapshot for host UIs
- `TpsPlaybackSession.on(...)`: runtime events for `stateChanged`, `wordChanged`, `phraseChanged`, `blockChanged`, `segmentChanged`, `statusChanged`, `completed`, and `snapshotChanged`
- `TpsPlaybackSession.observeSnapshot(listener, emitCurrent)`: UI-friendly snapshot subscription with immediate replay
- `TpsStandalonePlayer.compile(source, options)`: stand-alone compile-and-play wrapper
- `TpsStandalonePlayer.fromCompiledScript(script, options)`: restore a standalone player from an already compiled TPS state machine
- `TpsStandalonePlayer.fromCompiledJson(json, options)`: restore a standalone player from serialized compiled JSON
- `TpsStandalonePlayer.on(...)`: direct event subscription for embeddable hosts
- `TpsStandalonePlayer.observeSnapshot(listener, emitCurrent)`: immediate current snapshot plus future updates

## Technical Scope

- typed contract for TPS constants and keywords
- validation diagnostics for TPS authoring errors
- parser for front matter, title, segments, blocks, and inline markers
- compiler for the JSON-friendly TPS state machine
- player logic for current-word and visible-content resolution
- timed playback session logic for hosts that want the SDK to own the clock
- standalone player wrapper that can start from raw TPS source or from a precompiled state machine
- emission target for the JavaScript runtime in `SDK/js/lib`

## Source Map

- `src/constants.ts`: TPS constants catalog
- `src/parser.ts`: markdown/front-matter/header parsing
- `src/content-compiler.ts`: inline tags, timings, word metadata
- `src/compiler.ts`: document-to-state-machine compilation
- `src/player.ts`: phrase/word presentation model
- `src/playback-session.ts`: timer-driven playback controller
- `src/standalone-player.ts`: compile-and-play wrapper for embeddable hosts

## How To Work With This Project

1. Edit files in `src/` when TPS behavior or the public contract changes.
2. Rebuild the generated JS runtime after TS changes.
3. Run the TypeScript checks and source-level integration tests before touching downstream runtimes.
4. Regenerate example snapshots if the compiled output or player checkpoints intentionally changed.

Keep `TpsPlayer` deterministic. Put autoplay, pause/resume, and host-facing playback events in `TpsPlaybackSession`.

For host UIs, bind your own buttons to `play`, `pause`, `stop`, `seek`, `advanceBy`, `nextWord`, `previousWord`, `nextBlock`, `previousBlock`, `increaseSpeed`, `decreaseSpeed`, and `setSpeedOffsetWpm`, then render from `observeSnapshot(...)`, `snapshotChanged`, or `session.snapshot`. If your app stores compiled TPS JSON, restore through `TpsStandalonePlayer.fromCompiledJson(...)` instead of recompiling the source on every open. The TypeScript runtime validates that compiled JSON shape before playback and uses the same canonical transport fixture as the JS and .NET runtimes.

The root [README.md](/Users/ksemenenko/Developer/TPS/README.md) is the canonical TPS format spec. Keep this package aligned with that document and with the shared example fixtures.

## Local Commands

- `npm --prefix SDK/js run build:tps`
- `npm --prefix SDK/js run test:typescript`
- `npm --prefix SDK/js run coverage:typescript`
- `npm --prefix SDK/js run generate:example-snapshots`

## Relationship To Other SDKs

- `SDK/js` consumes the generated output from this project.
- `SDK/dotnet` should stay behaviorally aligned with the same TPS contract.
- `SDK/fixtures` should reflect shared expected behavior across active runtimes.

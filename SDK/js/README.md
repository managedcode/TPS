# ManagedCode.Tps JavaScript SDK

[![SDK JavaScript](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml)
[![SDK JavaScript Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml)

This folder exposes the JavaScript-consumable TPS runtime built from the TypeScript source.

Package identity: `managedcode.tps`

## What This Project Is

`SDK/js` is the consumer-facing JavaScript runtime package. It contains the built `lib/` output, Node test entry points, and package metadata for the JS distribution.

If you want to change TPS behavior, edit `SDK/ts` first. Change `SDK/js` directly only when the work is package-specific, test-specific, or distribution-specific.

## Public API

Imports come from `SDK/js/lib/index.js` and mirror the TS contract:

- `TpsSpec`
- `TpsKeywords`
- `validateTps(source)`
- `parseTps(source)`
- `compileTps(source)`
- `TpsPlayer`: pure state resolver
- `TpsPlayer.enumerateStates(stepMs)`: deterministic sampling helper
- `TpsPlaybackSession`: live playback controller with internal timer and runtime events
- `TpsPlaybackSession.snapshot`: embeddable runtime view-model
- `TpsStandalonePlayer.compile(source, options)`: stand-alone compile-and-play wrapper
- `TpsStandalonePlayer.fromCompiledScript(script, options)`: restore directly from a compiled TPS state machine
- `TpsStandalonePlayer.fromCompiledJson(json, options)`: restore from serialized compiled TPS JSON after validation
- `TpsStandalonePlayer.on(...)`: direct event subscription for embeddable hosts
- `TpsStandalonePlayer.onSnapshotChanged(listener)`: snapshot-only convenience subscription
- `TpsStandalonePlayer.observeSnapshot(listener, emitCurrent)`: immediate replay plus future updates
- `TpsStandalonePlayer.setSpeedOffsetWpm(offsetWpm)`: explicit global tempo correction

## Technical Structure

- `lib/` is generated output and should stay aligned with `SDK/ts/src/`
- `tests/node/` validates the built JavaScript runtime, not the TS source
- `package.json` defines exports, entry points, and verification commands

For host apps:

- use `TpsPlayer` if your UI already owns the clock
- use `TpsPlaybackSession` if you already have a compiled script and want the SDK to run playback
- use `TpsStandalonePlayer` if you want one object that compiles TPS source, restores precompiled JSON, manages playback, and emits snapshots

## How To Work With This Project

1. Rebuild `lib/` whenever TypeScript source changes.
2. Run JS tests against the built artifact.
3. Run coverage when changing runtime behavior or JS-facing tests.
4. Regenerate example snapshots if compiled output or player checkpoints intentionally changed.
5. Keep both deterministic player tests and real internal-timer session tests green.

The embeddable control surface is command-based, not DOM-owned. Hosts wire their own buttons to `play`, `pause`, `stop`, `seek`, `advanceBy`, `nextWord`, `previousWord`, `nextBlock`, `previousBlock`, `increaseSpeed`, `decreaseSpeed`, and `setSpeedOffsetWpm`, then render from `snapshot`, `onSnapshotChanged(...)`, or `observeSnapshot(...)`.

If your app caches compiled TPS JSON, prefer `TpsStandalonePlayer.fromCompiledJson(...)` or `TpsStandalonePlayer.fromCompiledScript(...)`. The JS runtime now validates that transport shape before playback so cached payloads fail fast instead of drifting into broken UI state later.

The root [README.md](/Users/ksemenenko/Developer/TPS/README.md) is the canonical TPS format spec. Keep this package aligned with that document and with the shared example fixtures.

## Local Commands

- `npm --prefix SDK/js run build:tps`
- `npm --prefix SDK/js run test:js`
- `npm --prefix SDK/js run coverage:js`
- `npm --prefix SDK/js run generate:example-snapshots`

## When To Edit This Folder

- change `package.json`, exports, or JS-specific tests here
- change TPS runtime logic in `SDK/ts`, then rebuild this folder

Canonical cross-runtime fixtures live in:

- `SDK/fixtures/examples/*.snapshot.json`
- `SDK/fixtures/transport/*.json`

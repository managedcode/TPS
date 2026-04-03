# ManagedCode.Tps TypeScript SDK

[![SDK TypeScript](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-typescript.yml)

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
- `TpsPlayer`
- `TpsPlayer.enumerateStates(stepMs)`

## Technical Scope

- typed contract for TPS constants and keywords
- validation diagnostics for TPS authoring errors
- parser for front matter, title, segments, blocks, and inline markers
- compiler for the JSON-friendly TPS state machine
- player logic for current-word and visible-content resolution
- emission target for the JavaScript runtime in `SDK/js/lib`

## Source Map

- `src/constants.ts`: TPS constants catalog
- `src/parser.ts`: markdown/front-matter/header parsing
- `src/content-compiler.ts`: inline tags, timings, word metadata
- `src/compiler.ts`: document-to-state-machine compilation
- `src/player.ts`: phrase/word presentation model

## How To Work With This Project

1. Edit files in `src/` when TPS behavior or the public contract changes.
2. Rebuild the generated JS runtime after TS changes.
3. Run the TypeScript checks and source-level integration tests before touching downstream runtimes.
4. Regenerate example snapshots if the compiled output or player checkpoints intentionally changed.

## Local Commands

- `npm --prefix SDK/js run build:tps`
- `npm --prefix SDK/js run test:typescript`
- `npm --prefix SDK/js run generate:example-snapshots`

## Relationship To Other SDKs

- `SDK/js` consumes the generated output from this project.
- `SDK/dotnet` should stay behaviorally aligned with the same TPS contract.
- `SDK/fixtures` should reflect shared expected behavior across active runtimes.

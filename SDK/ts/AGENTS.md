# AGENTS.md

Project: SDK TypeScript runtime
Owned by: ManagedCode.Tps SDK maintainers

Parent: `../../AGENTS.md`

## Purpose

- Own the authoring runtime for TPS in TypeScript.
- Define the canonical TS source for constants, validation, parsing, compilation, and player behavior.

## Entry Points

- `src/`
- `tests/types/`

## Boundaries

- In scope:
  - TypeScript source and type-level API checks
  - shared contract alignment with JavaScript build output and C#
- Out of scope:
  - C# project files
  - site rendering logic
  - generated JS output details beyond what TS emits

## Project Commands

- `build`: `npm --prefix ../js run build:tps`
- `test`: `npm --prefix ../js run test:types`
- `coverage`: `npm --prefix ../js run coverage:js`

## Applicable Skills

- `mcaf-solid-maintainability`
- `mcaf-testing`
- `dotnet-mcaf-documentation`

## Local Risks Or Protected Areas

- `src/` is the source of truth for the JS runtime and must stay parity-aligned with .NET and the other SDKs.
- Shared fixture contracts under `SDK/fixtures/` and `examples/*.tps` are protected compatibility inputs.
- Playback snapshots, event names, and compiled JSON normalization are host-facing API seams.

## Local Rules

- Keep the public API mirrored in JavaScript and C#.
- Keep file sizes small and prefer pure functions.
- Run TS verification through the `SDK/js` workspace package because that is where the shared JS/TS toolchain now lives.
- Put reusable runtime fixtures under `SDK/fixtures/`, not inside this project.

## Exception Record

- Size exception:
  - scope: `src/content-compiler.ts`, `src/parser.ts`, `src/playback-session.ts`, `src/compiled-script.ts`
  - reason: these files currently centralize the parity-first TypeScript implementation for the shared contract
  - removal plan: extract parser/header helpers, inline-tag handlers, playback transport helpers, and compiled-script validation helpers into smaller modules

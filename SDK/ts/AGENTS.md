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

## Local Rules

- Keep the public API mirrored in JavaScript and C#.
- Keep file sizes small and prefer pure functions.
- Run TS verification through the `SDK/js` workspace package because that is where the shared JS/TS toolchain now lives.
- Put reusable runtime fixtures under `SDK/fixtures/`, not inside this project.

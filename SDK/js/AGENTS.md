# AGENTS.md

Project: SDK JavaScript runtime
Owned by: ManagedCode.Tps SDK maintainers

Parent: `../../AGENTS.md`

## Purpose

- Own the JavaScript-consumable TPS runtime surface emitted from TypeScript.
- Hold JS-facing tests that execute against built output.

## Entry Points

- `lib/`
- `tests/node/`

## Boundaries

- In scope:
  - built JS runtime output
  - JS integration tests
- Out of scope:
  - TS source authoring details unless they affect emitted JS behavior
  - C# implementation

## Project Commands

- `build`: `npm run build:tps`
- `test`: `npm run coverage:js`

## Local Rules

- Tests must import built JS from `lib/`, not TS source directly.
- Keep JS behavior aligned with shared fixtures and the C# runtime.

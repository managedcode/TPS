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

## Applicable Skills

- `mcaf-solid-maintainability`
- `mcaf-testing`
- `dotnet-mcaf-documentation`

## Local Risks Or Protected Areas

- `lib/` is generated from `SDK/ts/src` and must stay byte-for-byte behavior-aligned with the TypeScript source.
- Node integration tests are the main runtime-level safety net for JS consumers.
- Do not hand-edit generated output without also reflecting the change in `SDK/ts`.

## Local Rules

- Tests must import built JS from `lib/`, not TS source directly.
- Keep JS behavior aligned with shared fixtures and the C# runtime.

## Exception Record

- Size exception:
  - scope: generated files under `lib/`
  - reason: built artifacts mirror the TypeScript source layout and may exceed source-file limits
  - removal plan: keep hand-edited source in `SDK/ts`; do not introduce manual logic directly into generated files

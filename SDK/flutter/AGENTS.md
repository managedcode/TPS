# AGENTS.md

Project: SDK Flutter runtime
Owned by: ManagedCode.Tps SDK maintainers

Parent: `../../AGENTS.md`

## Purpose

- Own the Dart runtime consumed by Flutter hosts.
- Keep compile, validate, restore, player, playback-session, and standalone-player behavior aligned with the other TPS runtimes.

## Entry Points

- `lib/src/managedcode_tps.dart`
- `lib/managedcode_tps.dart`
- `test/runtime_test.dart`

## Boundaries

- In scope:
  - Dart runtime implementation
  - Flutter-facing package export surface
  - parity and integration tests for the Dart runtime
- Out of scope:
  - widget-layer rendering
  - TypeScript, .NET, Swift, or Java source changes unless parity requires them

## Project Commands

- `build`: `dart analyze`
- `test`: `dart test`
- `coverage`: `./coverage.sh`

## Applicable Skills

- `mcaf-solid-maintainability`
- `mcaf-testing`
- `dotnet-mcaf-documentation`

## Local Risks Or Protected Areas

- Shared fixture parity with `SDK/fixtures/**` and `examples/*.tps` is a protected contract.
- Public runtime models must stay embeddable and UI-framework-neutral.
- Playback snapshots and event names are transport-facing and must remain stable across runtimes.

## Local Rules

- Prefer immutable public models and deterministic playback math.
- Keep runtime constants under named SDK types instead of scattering literals through the player/session code.
- Add regression tests for every playback or compiled-JSON bug fix.

## Exception Record

- Size exception:
  - scope: `lib/src/managedcode_tps.dart`
  - reason: the Flutter runtime is still implemented as one parity-first source file while the contract is stabilized across six runtimes
  - removal plan: split into `constants`, `parser`, `compiler`, `player`, `playback-session`, and `transport` files in the next maintainability pass

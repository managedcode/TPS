# AGENTS.md

Project: SDK Java runtime
Owned by: ManagedCode.Tps SDK maintainers

Parent: `../../AGENTS.md`

## Purpose

- Own the standalone Java TPS runtime.
- Keep Java compile, restore, playback, and snapshot behavior aligned with the shared TPS contract.

## Entry Points

- `src/main/java/com/managedcode/tps/ManagedCodeTps.java`
- `src/test/java/com/managedcode/tps/ManagedCodeTpsTests.java`
- `build.sh`
- `test.sh`

## Boundaries

- In scope:
  - Java runtime implementation
  - Java runtime test harness and coverage script
  - parity with the shared fixture set
- Out of scope:
  - Android UI integration
  - non-Java runtime source changes unless parity requires them

## Project Commands

- `build`: `./build.sh`
- `test`: `./test.sh`
- `coverage`: `./coverage.sh`

## Applicable Skills

- `mcaf-solid-maintainability`
- `mcaf-testing`
- `dotnet-mcaf-documentation`

## Local Risks Or Protected Areas

- Shared fixture parity with `SDK/fixtures/**` and `examples/*.tps` is a protected contract.
- Public nested types under `ManagedCodeTps` are a stable host-facing API surface.
- Playback snapshots and event names must remain transport-compatible with the other runtimes.

## Local Rules

- Keep the runtime embeddable and UI-framework-neutral.
- Prefer immutable public models and deterministic playback math.
- Replace meaningful literals with named constants before adding new playback behavior.

## Exception Record

- Size exception:
  - scope: `src/main/java/com/managedcode/tps/ManagedCodeTps.java`
  - reason: the Java runtime still ships as a parity-first single source file while the contract is stabilized
  - removal plan: split into package-level classes for constants, parser, compiler, player, playback session, and compiled transport

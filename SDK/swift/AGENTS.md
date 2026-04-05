# AGENTS.md

Project: SDK Swift runtime
Owned by: ManagedCode.Tps SDK maintainers

Parent: `../../AGENTS.md`

## Purpose

- Own the native Swift TPS runtime package.
- Keep Swift compile, restore, playback, and snapshot behavior aligned with the shared TPS contract.

## Entry Points

- `Package.swift`
- `Sources/ManagedCodeTps/ManagedCodeTps.swift`
- `Tests/ManagedCodeTpsTests/ManagedCodeTpsTests.swift`

## Boundaries

- In scope:
  - Swift runtime implementation
  - SwiftPM package surface
  - parity and integration tests
- Out of scope:
  - UIKit/AppKit/SwiftUI rendering layers
  - non-Swift runtime source changes unless parity requires them

## Project Commands

- `build`: `swift build`
- `test`: `swift test`
- `coverage`: `./coverage.sh`

## Applicable Skills

- `mcaf-solid-maintainability`
- `mcaf-testing`
- `dotnet-mcaf-documentation`

## Local Risks Or Protected Areas

- Shared fixture parity with `SDK/fixtures/**` and `examples/*.tps` is a protected contract.
- Public API names and wire-format semantics must stay stable for host apps.
- Playback event names and snapshot shape are cross-runtime compatibility points.

## Local Rules

- Keep the runtime embeddable and UI-framework-neutral.
- Prefer immutable value models and deterministic playback math.
- Move playback literals into named constants instead of reusing inline strings and numbers.

## Exception Record

- Size exception:
  - scope: `Sources/ManagedCodeTps/ManagedCodeTps.swift`
  - reason: the Swift runtime is still a parity-first monolith while the six-runtime surface is being normalized
  - removal plan: split into cohesive source files for constants, parsing, compilation, playback, and transport validation

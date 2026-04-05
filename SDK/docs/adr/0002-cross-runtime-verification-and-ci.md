# ADR 0002: Cross-Runtime Verification And CI

## Status

Accepted

## Context

The TPS SDK now spans multiple runtimes and must stay behaviorally aligned across them.
The user also requires:

- green CI on every commit
- minimum 90% coverage for active runtimes
- a path to enable more runtimes later without rewriting the workflow
- durable docs for development and testing under `SDK/`

## Decision

We verify TPS runtimes from manifest-driven matrices and keep GitHub automation compact around one staged SDK workflow plus separate Pages and Release workflows.

### Runtime Verification Rules

- TypeScript verifies the typed public contract.
- JavaScript verifies the built artifact and enforces at least 90% coverage with `c8`.
- C# verifies the .NET runtime and enforces at least 90% line, branch, and method coverage with `coverlet.msbuild`.
- Flutter verifies the Dart runtime and enforces at least 90% line coverage.
- Swift verifies the Swift runtime and enforces at least 90% line coverage.
- Java verifies the JVM runtime and enforces at least 90% line coverage.

### CI Orchestration

- `SDK/manifest.json` is the source of truth for enabled runtimes.
- `SDK/scripts/runtime-matrix.mjs` converts the manifest into the GitHub Actions matrices.
- `.github/workflows/ci.yml` runs quality, build/test, and coverage stages from one workflow.
- Future runtimes stay manifest-driven and can join CI without redesigning the workflow.

## Consequences

### Positive

- runtime enablement is declarative
- adding more runtimes later does not require redesigning CI
- shared fixtures keep behavior parity testable across runtimes
- active runtimes keep hard coverage gates rather than best-effort reporting

### Negative

- every new branch in an active runtime must be backed by tests immediately
- runtime parity changes must update both shared fixtures and multiple language implementations

## Flow

```mermaid
flowchart LR
  Manifest["SDK/manifest.json"] --> Matrix["runtime-matrix.mjs"]
  Matrix --> CI["ci.yml"]
  Fixtures["SDK/fixtures"] --> TS["TypeScript checks"]
  Fixtures --> JS["JavaScript coverage"]
  Fixtures --> CS["dotnet coverage"]
  CI --> TS
  CI --> JS
  CI --> CS
```

## Follow-up

- keep future runtimes disabled until they implement the full TPS contract
- keep thresholds at or above 90% for active runtimes unless an ADR explicitly changes that policy

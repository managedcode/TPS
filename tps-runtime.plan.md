# TPS Runtime Plan

Chosen brainstorm: `tps-runtime.brainstorm.md`

## Goal

Implement a full TPS parser, validator, compiler, constants surface, and player for TypeScript, JavaScript, and C#, with test coverage and CI gates.

## Scope

### In scope

- `SDK/` runtime folder layout and manifest
- `SDK/docs/` architecture and ADR documentation
- TS runtime implementation and JS build output
- C# runtime implementation
- TPS validation with diagnostics
- shared spec constants
- compiled state-machine model
- small player API
- automated tests
- coverage and CI
- architecture/doc updates needed for the new runtime

### Out of scope

- package publishing
- browser UI for the player
- editor UX beyond validator/compiler APIs

## Constraints And Risks

- Must keep `ManagedCode.Tps` prefix for .NET artifacts.
- Must keep JS/TS/C# behavior aligned.
- Must not break the existing site build.
- Coverage target is effectively 100% for the new runtime surfaces.
- Unknown TPS tags must produce diagnostics rather than disappearing silently.
- The runtime implementation and docs must move under `SDK/`.
- CI should be easy to extend to future runtimes such as Flutter, Swift, and Java.

## Ordered Implementation Plan

- [ ] Step 1. Create the SDK folder layout and runtime manifest.
  - Add `SDK/docs`, per-language runtime folders, shared fixtures, and a manifest describing active runtimes and verification commands.
  - Verification:
    - folder layout is stable and documented
    - manifest can drive CI for active runtimes

- [ ] Step 2. Define shared runtime contract.
  - Create shared models for spec constants, diagnostics, syntax tree, compiled state machine, and player state.
  - Verification:
    - inspect public APIs
    - ensure naming is consistent across TS and C#

- [ ] Step 3. Add shared TPS fixtures.
  - Reuse valid examples and add invalid fixtures for validator failures.
  - Add expected assertions for compile/player edge cases.
  - Verification:
    - fixture files load in both runtimes
    - invalid fixtures cover unknown tags, malformed pauses, and mismatched tags

- [ ] Step 4. Implement TypeScript validator and parser.
  - Build tokenization, header parsing, metadata parsing, and diagnostics.
  - Verification:
    - Node tests for valid and invalid inputs
    - no parser/validator test failures

- [ ] Step 5. Implement TypeScript compiler and player.
  - Add ORP logic, timing, timeline offsets, compiled JSON contract, and playback state queries.
  - Verification:
    - Node tests for compile timing, constants, and player state transitions
    - TS declaration generation succeeds

- [ ] Step 6. Emit JavaScript build and wire package entrypoints.
  - Add `tsconfig`, build scripts, and exports so TS source produces JS output and type declarations.
  - Verification:
    - `npm run build:tps`
    - JS tests import built JS, not TS source directly

- [ ] Step 7. Implement C# validator, parser, compiler, and player.
  - Mirror runtime contract and behavior from TS fixtures.
  - Verification:
    - xUnit tests pass against the shared fixture set
    - .NET compiled model matches expected behaviors

- [ ] Step 8. Add coverage and CI.
  - Add Node and .NET test scripts and GitHub Actions checks.
  - Verification:
    - local CI-equivalent commands pass
    - coverage thresholds are enforced
    - runtime matrix is driven from SDK configuration, not scattered workflow edits

- [ ] Step 9. Write the ADR and update SDK architecture docs.
  - Add a full ADR for SDK layout, runtime parity, validation, testing, and CI.
  - Verification:
    - ADR is complete and references implementation/testing strategy
    - SDK architecture docs and Mermaid diagrams match the code layout

- [ ] Step 10. Update repo-level docs and architecture map.
  - Reflect runtime layout, entry points, and verification flow.
  - Verification:
    - docs build still works
    - Mermaid diagrams remain valid

## Test Strategy

- TS and JS:
  - validate fixtures
  - parser/header tests
  - compiler timing/state-machine tests
  - player timeline tests
  - constants surface tests
- C#:
  - same logical fixture coverage with xUnit
  - parity checks for diagnostics and compile semantics
- Integration:
  - site build still passes
  - solution build/test passes

## Testing Methodology

- Test through public APIs.
- Use shared `.tps` fixtures for valid and invalid cases.
- Favor deterministic assertions for:
  - diagnostics
  - normalized metadata
  - compiled word properties
  - timeline positions
  - player state at selected timestamps
- Avoid mock-heavy tests; use real parser/compiler/player objects.

## Full-Test Baseline

- [ ] Run current baseline before major implementation:
  - `npm run build`
  - `dotnet format ManagedCode.Tps.slnx --verify-no-changes`
  - `dotnet build ManagedCode.Tps.slnx -warnaserror`
  - `dotnet test ManagedCode.Tps.slnx`

## Known Failing Tests Baseline

- [ ] None currently recorded for this task.

## Final Validation Skills And Commands

- [ ] `mcaf-testing`
  - Reason: confirm regression and coverage scope matches the behavior change.
- [ ] `dotnet-quality-ci`
  - Reason: confirm .NET quality gates and commands are correct.
- [ ] `mcaf-ci-cd`
  - Reason: confirm CI matches the repository workflow.

## Done Criteria

- [ ] TS source compiles to JS and declarations.
- [ ] JS consumers can use the built runtime.
- [ ] C# runtime exposes equivalent parser, validator, compiler, constants, and player APIs.
- [ ] Unknown tags and malformed TPS produce actionable diagnostics.
- [ ] SDK docs contain a full ADR for development, validation, testing, and pipeline strategy.
- [ ] Runtime code is organized under `SDK/` with per-language folders.
- [ ] Shared fixtures pass in both runtimes.
- [ ] Build, test, coverage, and CI checks pass.
- [ ] Docs and architecture map reflect the new structure.

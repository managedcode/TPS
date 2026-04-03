# TPS Runtime Brainstorm

## Problem

The repository needs a real TPS implementation, not just a site and placeholder projects.
The implementation must exist for:

- TypeScript
- JavaScript
- C#

The repository structure must also change so that runtime code and runtime docs live under a dedicated `SDK/` folder with per-language subfolders.

Each runtime must provide:

- TPS spec constants for keywords, tags, metadata keys, emotions, volume levels, and delivery modes
- TPS validation with actionable diagnostics
- TPS parsing into a structured syntax tree
- TPS compilation into a deterministic JSON-friendly state machine with timing and word-level metadata
- A small player that reads the compiled state machine and returns the current presentation model

The validation layer must catch invalid or unknown tags and malformed TPS instead of silently accepting everything.

## Constraints

- Keep `ManagedCode.Tps` as the .NET prefix.
- Keep root and project-local `AGENTS.md` files.
- Do not publish packages; only make the repo build, test, and verify cleanly in CI.
- Preserve the documentation site.
- Keep JS and TS aligned by implementing the TS source and compiling it to JS output.
- Keep C# behavior aligned with the JS/TS runtime through shared fixtures and mirrored test cases.
- Keep runtime docs and ADRs under `SDK/docs/`.
- Prepare the SDK layout so future runtimes such as Flutter, Swift, and Java can be added without redesigning the CI or docs structure.

## Existing Material

- `README.md` contains the TPS format specification and examples.
- `examples/*.tps` contain valid scripts covering many features.
- `../PrompterOne/src/PrompterOne.Core/Tps` contains a mature parser/compiler reference.
- `../PrompterOne/tests/PrompterOne.Core.Tests/Tps/TpsRoundTripTests.cs` contains useful regression expectations.

## Design Options

### Option A: Port PrompterOne directly into C# and manually re-implement in TS

Pros:

- Fastest path to parity with the proven C# behavior.
- Gives immediate coverage for parser/compiler edge cases.

Cons:

- High risk of subtle divergence between TS and C# if the TS port is not fixture-driven.

### Option B: Define a small shared fixture contract first, then implement both runtimes against it

Pros:

- Stronger cross-runtime parity.
- Cleaner API shape for validator/compiler/player.

Cons:

- Slightly more up-front work.

### Option C: Generate one runtime from the other

Pros:

- Lowest parity drift in theory.

Cons:

- Not practical here without building a generator first.
- Adds toolchain complexity and slows delivery.

## Recommended Direction

Use Option B, but borrow implementation logic from PrompterOne where it is already strong.

Practical shape:

1. Create `SDK/` as the runtime root.
2. Define shared fixture inputs and a runtime manifest under `SDK/`.
3. Implement TS as the primary Node-authoring source under `SDK/TypeScript`.
4. Emit JS into `SDK/JavaScript`.
5. Port the same models and validation/compiler rules to `SDK/CSharp`.
6. Keep parity through shared fixture inputs and mirrored assertions.
7. Add placeholder folders and manifest entries for future runtimes.

## Runtime Contract

Each runtime should expose:

- `TpsSpec` constants
- `validateTps(...)`
- `parseTps(...)`
- `compileTps(...)`
- `TpsPlayer`

Validation output should include:

- machine-readable code
- severity
- message
- line and column
- optional suggestion

Compilation output should include:

- metadata
- segments
- blocks
- phrases
- words
- per-word timing
- cumulative timeline positions
- presentation metadata such as emotion, speed, emphasis, highlight, pause, stress, pronunciation, volume, delivery mode, and speaker

Player output should include:

- current word
- active phrase and block
- elapsed and remaining time
- current visual model
- next transition time

## Risks

- Coverage requirements can balloon if the implementation sprawls.
- Parser and validator logic may diverge unless they share tokenization rules.
- Header parsing and nested inline tag handling are the most error-prone parts.
- C# and TS can drift on rounding unless duration logic is explicitly matched.

## Mitigations

- Keep implementation files small and model-driven.
- Use one set of shared invalid fixtures for validator diagnostics.
- Centralize timing and ORP logic in dedicated helpers in each runtime.
- Add parity tests for tricky cases:
  - unknown tags
  - mismatched closing tags
  - relative and absolute speeds
  - punctuation attachment
  - pauses and edit points
  - pronunciation and stress

## Final Validation Skills To Run

1. `mcaf-testing`
   Reason: verify coverage strategy and runtime regression scope.
2. `dotnet-quality-ci`
   Reason: verify .NET quality commands and CI readiness.
3. `mcaf-ci-cd`
   Reason: verify the GitHub Actions pipeline reflects the repo workflow.

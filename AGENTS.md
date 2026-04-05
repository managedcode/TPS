# AGENTS.md

Project: ManagedCode.Tps
Stack: Node.js static documentation site plus .NET 10 solution with xUnit on VSTest

Follows [MCAF](https://mcaf.managed-code.com/)

---

## Purpose

This file defines the global rules for AI agents working in this repository.

- Keep one root `AGENTS.md` at the repository root.
- Read this file first, then read the nearest local `AGENTS.md` before editing a project subtree.
- Local `AGENTS.md` files may tighten root policy, but they must not silently weaken it.

## Solution Topology

- Repository root: `/Users/ksemenenko/Developer/TPS`
- Solution file: `SDK/dotnet/ManagedCode.Tps.slnx`
- Repo-local skills: `.codex/skills/`
- SDK root: `SDK/`
- Documentation/site surface:
  - `package.json`
  - `scripts/build-site.mjs`
  - `examples/`
  - `public/`
  - `website/`
- SDK projects with local `AGENTS.md` files:
  - `SDK/ts/`
  - `SDK/js/`
  - `SDK/flutter/`
  - `SDK/swift/`
  - `SDK/java/`
  - `SDK/dotnet/src/ManagedCode.Tps/`
  - `SDK/dotnet/tests/ManagedCode.Tps.Tests/`

## Rule Precedence

1. Read the solution-root `AGENTS.md` first.
2. Read the nearest local `AGENTS.md` for the area you will edit.
3. Apply the stricter rule when both files cover the same topic.
4. If a local rule appears weaker than root policy, stop and clarify before editing.
5. Document justified exceptions explicitly in the nearest durable doc:
   - local `AGENTS.md`
   - `docs/Architecture.md`
   - ADR or feature doc when those exist

## Preferences

### Likes

- Use `ManagedCode.Tps` as the namespace, project, and solution prefix for .NET artifacts.
- Keep the `.NET` runtime as the canonical TPS implementation and module layout that other runtimes mirror where practical.
- Keep repo-local agent skills under `.codex/skills/`.
- Keep architecture and workflow guidance durable and versioned in the repository.
- Keep all active TPS runtimes feature-aligned: each runtime must expose spec constants, validation APIs, compiler APIs, and player APIs.
- Keep SDK implementation, runtime docs, ADRs, and per-language code grouped under `SDK/`.
- Keep shared fixtures and runtime-manifest-driven CI under `SDK/` so future runtimes can join without reorganizing the repo again.

### Dislikes

- Do not move `AGENTS.md` out of the repository root.
- Do not add repo-local skills under `.claude/`, `.agents/`, or other agent roots for this repository.
- Do not add stale or superseded MCAF skill folders when updating the repo-local skill set.

## Conversations (Self-Learning)

Record durable user rules here instead of relying on chat history.

- Update this file when the user gives a lasting requirement, correction, workflow change, or repeated preference.
- Do not record one-off task instructions as durable policy.
- Prefer updating an existing rule over adding duplicates.

## Global Skills

List only the skills this repository should actively use.

- `mcaf-solution-governance` — maintain root and project-local `AGENTS.md` files, rule precedence, and project boundaries.
- `mcaf-solid-maintainability` — keep maintainability limits, exception handling, and refactor expectations explicit.
- `mcaf-architecture-overview` — create or update `docs/Architecture.md` and keep module maps current.
- `mcaf-ci-cd` — review or update CI/CD workflows and deployment-quality gates.
- `mcaf-code-review` — tighten review expectations and PR hygiene.
- `mcaf-testing` — choose test scope, regression strategy, and user-flow coverage.
- `dotnet-quality-ci` — .NET analyzer, formatting, coverage, and quality-gate changes.
- `dotnet-xunit` — xUnit and VSTest guidance for the .NET test project.
- `dotnet-mcaf-devex` — developer-experience and onboarding guidance.
- `dotnet-mcaf-documentation` — durable documentation structure and navigation.
- `dotnet-mcaf-source-control` — source-control workflow and branch/commit rules.

## Rules to Follow (Mandatory)

### Commands

- `build`: `npm run build`
- `test`: `npm run test`
- `format`: `dotnet format SDK/dotnet/ManagedCode.Tps.slnx --verify-no-changes`
- `analyze`: `dotnet build SDK/dotnet/ManagedCode.Tps.slnx -warnaserror`
- `coverage`: `npm run coverage:sdk`

.NET execution details:

- Test framework: xUnit
- Runner model: VSTest
- Coverage driver: `coverlet.msbuild` with explicit threshold gates
- Analyzer and formatting source of truth: repo-root `.editorconfig`
- Do not pin `LangVersion` unless the repository intentionally diverges from the SDK default.

### Project AGENTS Policy

- This is a multi-project solution and must keep one root `AGENTS.md` plus one local `AGENTS.md` in each project root.
- Each local `AGENTS.md` must document:
  - project purpose
  - entry points
  - boundaries
  - project-local commands
  - applicable skills
  - local risks or protected areas
- Local files may tighten root rules, but must not weaken them silently.

### Maintainability Limits

- `file_max_loc`: `400`
- `type_max_loc`: `200`
- `function_max_loc`: `50`
- `max_nesting_depth`: `3`
- `exception_policy`: `Document any justified exception in the nearest AGENTS file, ADR, or feature doc with the reason, scope, and removal plan.`

### Task Delivery

- Start non-trivial work from `docs/Architecture.md` and the nearest local `AGENTS.md`.
- For non-trivial tasks, create a root-level `<slug>.brainstorm.md` before implementation.
- After the direction is chosen, create a root-level `<slug>.plan.md`.
- Keep the plan current while work is in progress.
- Include verification steps in the ordered plan from the start.
- Run focused verification first, then broader verification, then the full required regression set.
- If a task changes .NET production code, run the repo-defined quality pass:
  - `format`
  - `build`
  - `analyze`
  - focused `test`
  - broader `test`
  - `coverage`
- Summarize the change, remaining risks, and verification evidence before marking the task complete.

### Documentation

- Durable repository documentation lives in `docs/`.
- SDK-specific architecture, ADRs, and language rollout docs live in `SDK/docs/`.
- Runtime-facing usage docs live in `SDK/README.md` and `SDK/<Language>/README.md`.
- GitHub Actions workflows stay compact by delivery surface:
  - `.github/workflows/ci.yml` for SDK quality, runtime build/test, and coverage stages
  - `.github/workflows/pages.yml` for site publishing
  - `.github/workflows/release.yml` for versioned GitHub releases
- `docs/Architecture.md` is the global architecture map for this repository.
- Architecture docs, feature docs, and ADRs must include Mermaid diagrams when they describe non-trivial structure or flow.
- Keep one canonical source of truth for each important fact and link rather than duplicating.
- Update docs when behavior, topology, or verification flow changes.

### Testing

- TDD is the default for new behavior and bug fixes.
- Bug fixes start with a failing regression test when practical.
- Test user-visible behavior and boundary contracts, not only internal implementation details.
- Prefer realistic verification over mock-heavy tests.
- Flaky tests are failures and must be fixed, not ignored.
- Active runtime CI coverage gates must stay at or above 90% unless an ADR explicitly changes that policy.
- Repository or module coverage must not go down without an explicit written exception.
- The task is not done until the full relevant test suite is green.

### Code and Design

- Follow SOLID by default.
- Keep responsibilities explicit and boundaries narrow.
- Use `.editorconfig`, project files, and checked-in docs as the durable source of tooling truth.
- Keep names, namespaces, and future .NET projects under the `ManagedCode.Tps` prefix unless a documented exception is approved.
- Every TPS runtime library must publish a clear list of spec constants for keywords, tags, emotions, metadata keys, and other validation-critical terms.
- Do not introduce magic string literals, repeated catalog literals, or inline public catalog numbers for TPS spec terms, statuses, diagnostic codes, emotion names, palette keys, recommended WPM values, rhythm ranges, or similar runtime-contract data; define and reuse named constants or named catalog values.
- Every TPS runtime library must include TPS format validation that reports actionable diagnostics for invalid structure, unknown tags, malformed attributes, and other authoring errors.
- Keep each runtime in its own language folder under `SDK/`, and keep SDK design/testing/ADR documentation under `SDK/docs/`.
- Design CI so the active runtime set is extensible beyond JavaScript, TypeScript, and C#, with future language additions enabled by configuration instead of ad hoc workflow rewrites.

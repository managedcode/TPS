# SDK CI And Release Refresh Brainstorm

## Problem

- GitHub Actions contains many small SDK-specific workflows that duplicate setup logic.
- SDK README badges and workflow references depend on those duplicate files.
- The `/skills/` site page is manually authored and has drifted behind the root `README.md`.
- The `v1.1.0` release is missing on GitHub even though `VERSION` is `1.1.0`.

## Goals

- Replace scattered SDK workflows with one compact staged SDK CI workflow.
- Keep Pages and Release as separate concern-specific workflows.
- Align root docs, SDK docs, and generated site pages with the real workflow and skill-install story.
- Make release creation explicit and deterministic by creating the tag before creating the GitHub release.

## Constraints

- Preserve full build, test, and coverage enforcement across all six active runtimes.
- Keep GitHub Pages publishing working.
- Keep release creation idempotent when rerun.
- Keep README links and badges understandable after workflow consolidation.

## Approach

1. Introduce a single `sdk-ci.yml` workflow with jobs for:
   - setup/runtime matrices
   - quality
   - runtime build/test matrix
   - coverage matrix
2. Remove runtime-specific workflow files and update README badges to point at the single workflow.
3. Update `ci.yml` and `coverage.yml` references in docs to the new layout.
4. Rewrite the generated skills page so it mirrors the real install guidance for Claude Code, Codex, and GitHub Copilot.
5. Update `release.yml` so it explicitly creates and pushes the version tag before running `gh release create --verify-tag`.
6. After verification, push to `main` and recreate `v1.1.0`.

## Risks

- README badge granularity drops from per-runtime workflows to a shared SDK CI status.
- Workflow removal requires docs and site updates in the same change to avoid broken badge links.
- Release recreation must not move an existing tag; it should only create it if absent.

# TPS Prostir Agent Upgrade Brainstorm

## Goal

Upgrade the existing Prostir Skill and Agent with slug `tps` into a polished, lossless script-markup product. The Agent must transform supplied scripts into valid TPS without rewriting source copy and should have a distinctive custom public passport.

## Product Contract

- Preserve source wording, spelling, capitalization, punctuation, language, paragraph order, and speaker text.
- Treat tone, pacing, emotion, speaker, duration, and archetype requests as annotation instructions only.
- Insert only valid TPS structure, delivery tags, pauses, breath/edit markers, and required escapes.
- Return one complete `tps` code block with no surrounding commentary unless the source boundary or a conflicting request requires clarification.
- Prefer sparse, readable direction over decorative tag saturation.
- Keep TPS structure aligned with rhetorical intent: segments for major moves, blocks for subtopics or speaker turns, inline tags for local delivery changes.

## Upgrade Direction

1. Keep the existing `tps` slugs and publish new versions rather than create duplicates.
2. Make the Skill concise at the entrypoint and move closed-set syntax plus annotation heuristics to direct references.
3. Add a deterministic lossless verifier script and representative evaluation cases.
4. Strengthen the Agent prompt with an explicit priority order, source-boundary handling, conflict behavior, output contract, and self-check.
5. Attach the current published `tps` Skill version to the Agent and verify the attachment after publishing.
6. Add a self-contained interactive custom passport under 64 KiB. It should explain the lossless promise, show the TPS delivery model, expose the canonical MCP endpoint, and avoid external assets or network access.

## Passport Concept

Use a dark editorial-console aesthetic with warm amber and electric cyan accents. Present source text and TPS direction as two synchronized layers rather than a before/after rewrite. Include:

- a strong “Your words. Directed, not rewritten.” promise;
- a compact source-to-TPS visual demo;
- six vocal archetype chips;
- a three-step workflow;
- the canonical MCP endpoint with a copy interaction;
- responsive layout and accessible reduced-motion behavior.

The passport uses the `interactive` execution profile only for local UI affordances. It does not call Prostir or any external service.

## Verification

- Validate the local Skill package with the skill-creator validator.
- Test the lossless verifier with a passing multilingual source and an intentional mutation.
- Check generated Agent YAML and passport HTML locally for syntax, size, and required endpoint/copy.
- In Prostir: import files, validate, publish, attach, publish Agent, set passport, re-read all states.
- Runtime-call the Agent with a short Ukrainian sample and verify exact source recovery before reporting behavioral success.

## Risks

- Browser or MCP authentication may block external publication; keep all publishable artifacts ready and report this boundary honestly.
- TPS syntax may collide with literal source characters; the Skill must escape only parser-sensitive literals and preserve their rendered value.
- A custom passport can obscure the standard setup page; keep the MCP endpoint and a standard-passport link visible.
- Existing unrelated worktree changes must remain untouched.

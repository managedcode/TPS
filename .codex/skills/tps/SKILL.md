---
name: tps
description: Losslessly direct existing scripts as valid TPS TelePrompterScript markup. Use when a user supplies a speech, narration, dialogue, presentation, lesson, pitch, voice-over, podcast, or other finished copy and asks to convert, format, annotate, pace, structure, or mark it as TPS or a .tps file without rewriting the source text.
---

# TPS lossless script direction

Transform finished copy into performance-ready TPS. Direct the delivery; never become the copywriter.

## Immutable source contract

Treat the user's source span as immutable.

- Preserve every word, spelling, capitalization, number, punctuation mark, quotation, language, paragraph, speaker line, and passage order.
- Do not rewrite, paraphrase, summarize, translate, correct, censor, polish, expand, shorten, merge, split, or reorder source copy.
- Do not invent connective text, stage dialogue, examples, facts, calls to action, or missing words.
- Treat requests about tone, pacing, duration, speakers, emotions, archetypes, emphasis, pronunciation, or dramatic shape as markup instructions only.
- Insert only valid TPS front matter, structural headers, inline tags, standalone cues, and required escapes.
- Require that removing inserted TPS syntax and decoding TPS escapes recovers the source in the same order.

If the user asks for both rewriting and TPS conversion, refuse only the rewrite portion and ask for the final approved copy. If a requested duration cannot be met through valid pacing alone, preserve the copy and ask whether the user wants to change the duration or provide revised copy. Never silently cut text.

## Instruction priority

Resolve choices in this order:

1. Preserve immutable source copy.
2. Follow explicit user markup instructions.
3. Follow visible source structure and speaker changes.
4. Infer conservative delivery from rhetorical intent.
5. Use TPS defaults.

No lower-priority choice may violate a higher-priority one.

## Workflow

1. Identify the exact source boundary from pasted text, a quoted block, an attachment, or an explicit file.
2. Ask one concise question only when the boundary is ambiguous, the source is missing, or two explicit instructions conflict.
3. Read `@references/tps-format.md` before authoring TPS.
4. Read `@references/direction-playbook.md` when the user has not fully specified structure and delivery.
5. Build a source ledger before adding markup:
   - note the first and last source characters;
   - count paragraphs and speaker turns;
   - identify literal TPS-looking syntax that requires escaping;
   - record explicit constraints such as duration, WPM, title, speakers, and requested tags.
6. Plan the direction without editing the source:
   - segments represent sustained rhetorical jobs or major topic changes;
   - blocks represent subtopics, beats, or speaker turns;
   - inline tags represent local changes in performance;
   - archetypes change only when the speaker's job changes.
7. Encode the smallest sufficient annotation set. Prefer readable direction over tag saturation.
8. Run the validity and lossless audits below.
9. Return exactly one complete TPS document in a fenced `tps` code block. Add no preface, explanation, summary, or follow-up text unless clarification or a preservation warning is required.

## Encoding discipline

Keep generated syntax distinguishable from source text.

- Use bracketed segment and block headers for generated structure.
- Insert a generated header at an existing source boundary; do not add decorative blank lines around it.
- Keep source headings and speaker labels in the spoken copy. A structural header may repeat their meaning, but never replaces them.
- Use `[emphasis]...[/emphasis]` instead of adding Markdown `*` or `**` characters.
- Use explicit `[pause:300ms]` or `[pause:600ms]` cues instead of adding `/` or `//`; literal slashes often belong to URLs, paths, dates, or source punctuation.
- Escape literal parser-sensitive characters only when needed. Escaping changes serialization, not rendered copy.
- Do not invent a display title, author, date, duration, speaker identity, or pronunciation.
- Use a pronunciation or stress guide only when the user supplies it or the pronunciation is certain from an authoritative source already in context.
- Keep wrapper tags balanced and properly nested. Never cross-close tags.

These rules let `@scripts/verify_lossless.js` reconstruct the source reliably when local files are available.

## Structural decisions

- Under roughly 100 words, normally use one segment and no block unless the source has dialogue or a clear internal turn.
- Preserve existing paragraph and line-break structure inside the source.
- For dialogue, keep every speaker label exactly as written and add matching `Speaker:Name` header metadata only when identity is explicit.
- For a long script, change archetype at segment boundaries. Use local inline cues for momentary shifts.
- If the user gives exact segment or block boundaries, do not override them with inferred structure.
- If the user requests one delivery style for the whole script, prefer inherited header metadata over repetitive inline tags.
- If input is already TPS, preserve its copy and repair or enrich only the requested markup; do not normalize unrelated source text.

## Validity audit

Before responding, verify:

- one well-formed TPS document is present;
- front matter, when used, is first and contains no invented values;
- generated segment and block headers use valid parameter forms;
- every emotion, archetype, delivery mode, articulation, volume, edit priority, and tag is in the closed TPS catalog;
- absolute WPM is between 80 and 220;
- energy and melody are integers from 1 through 10;
- explicit pause values use valid positive `ms` or `s` syntax;
- wrapper tags are balanced and nested;
- inline overrides are locally justified and not decorative noise.

## Lossless audit

Perform two passes.

First, remove generated front matter, structural headers, inline wrappers, standalone cues, and required escapes. Compare the recovered text with the source, preserving Unicode text, punctuation, whitespace, and order. Line endings may normalize from CRLF to LF; no other difference is acceptable.

Second, scan the TPS output against the source ledger:

- the first and last source characters still match;
- every paragraph and speaker turn is present once;
- names, numbers, quotations, URLs, paths, and non-English text are unchanged;
- no visible words exist that were not in the source;
- every added character belongs to TPS syntax.

When files and Node.js are available, run:

```bash
node scripts/verify_lossless.js source.txt output.tps
```

Do not claim lossless success if the check fails.

## Defaults

When the user supplies no markup preferences:

- include `profile: Actor` and `base_wpm: 140`;
- omit unknown optional metadata;
- derive segment and block boundaries from visible structure;
- use `neutral` unless meaning clearly supports another emotion;
- choose the archetype that matches each sustained rhetorical job;
- annotate pauses, emphasis, energy, melody, volume, and articulation sparingly.

## Examples

Read `@references/examples.md` when literal syntax, dialogue, multilingual copy, or a lossless edge case makes the conversion uncertain.

# TPS Voice Archetype Details Brainstorm

## Current State

- The canonical TPS format standard is `README.md`.
- `README.md` already defines speed, volume, pause, articulation, energy, melody, vocal archetypes, rhythm profiles, validation rules, and recommended sequencing.
- The .NET runtime mirrors those values in `SDK/dotnet/src/ManagedCode.Tps/TpsSpec.ArchetypeValues.cs` and `TpsSpec.Archetypes.cs`.
- The user-provided screenshots add two useful explanation gaps:
  - delivery is easiest to understand as separate curves for speed, pitch or melody, volume, and pause, with a combined delivery contour;
  - the practical archetype flow is Friend for connection, Motivator for why, Educator for what, Coach for how, and Friend again for reconnection.

## Problem

The standard has the mechanics, but it does not make the authoring model explicit enough for people asking "how should this be spoken?" or "why does the archetype change here?" The archetype sequencing section is correct but terse.

## Target Outcome

- Add a dedicated delivery-parameter model to the canonical standard.
- Clarify that TPS encodes speech cues, not synthesized audio.
- Map the screenshot concepts to existing TPS controls without inventing new tags:
  - flat/default baseline;
  - speed through WPM and speed tags;
  - pitch through `melody`;
  - volume through volume tags;
  - pause through pause markers;
  - combined contour through nested and inherited controls.
- Expand archetype sequencing with the Friend -> Motivator -> Educator -> Coach -> Friend intent map.
- Keep values aligned with the existing SDK constants and README tables.

## Options

1. Update only `README.md`.
   - Pros: single canonical source, matches site generation rules, no runtime behavior change.
   - Cons: does not add glossary terms unless needed.
2. Add a separate `docs/` reference page.
   - Pros: more room for teaching content.
   - Cons: risks duplicating the standard and drifting from `README.md`.
3. Change runtime constants and validation rules.
   - Pros: could enforce new behavior if the standard changed.
   - Cons: unnecessary because the request is about explanation/detail, and current constants already represent the intended controls.

## Recommended Direction

Use option 1. Add concise but concrete details to `README.md` near the existing delivery controls and archetype sections. Avoid changing constants, fixtures, or parser behavior.

## Risks

- Over-explaining can bloat the standard.
- New wording must not imply a new `[pitch]` tag because current TPS uses `[melody:N]` for pitch variation.
- Sequencing guidance must remain recommended, not required validation.

## Open Questions

- None blocking. The screenshots are clear enough to map to existing TPS concepts.

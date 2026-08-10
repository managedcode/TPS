# TPS Voice Archetype Details Plan

1. Read repository guidance, architecture docs, documentation skill guidance, the current standard, and runtime archetype constants. Status: done.
2. Add a `README.md` section that explains the voice-parameter model using existing TPS controls. Status: done.
3. Expand the archetype sequencing section with intent, listener question, delivery shift, and TPS authoring cues. Status: done.
4. Verify the canonical markdown can still build into the static site with `npm run build`. Status: done.
5. Review the diff for accidental runtime-contract changes or duplicated source-of-truth facts. Status: done.

## Verification

- `npm run build:site`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

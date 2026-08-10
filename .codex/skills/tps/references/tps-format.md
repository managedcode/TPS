# TPS format reference

Use this closed reference when producing TPS. Preserve the user's source copy; these constructs are the only additions.

## Document shape

```text
--- optional YAML front matter ---
# optional display title
## segment
### block
source text with inline direction
```

Front matter must be the first content. A title is display metadata, not a segment. A segment is a major rhetorical move. A block is a local beat inside a segment. Text between a segment and its first block is valid.

The optional `# Display title` must follow front matter and precede body content. If both it and front-matter `title` exist, the `#` title wins for display. Neither title contributes spoken words, timing, segment inheritance, or the lossless source span unless the user explicitly supplied it as spoken copy.

Plain `## Segment` and `### Block` headings are valid shorthand with inherited defaults. If a document has no `##` heading, all body content belongs to one implicit `Content` segment with inherited/default WPM and `neutral` emotion. Do not add either shorthand form during lossless conversion when the bracketed form can carry the required direction explicitly.

## Front matter

All fields are optional. Omit unknown values.

```yaml
---
title: "Provided title"
profile: Actor
duration: "MM:SS"
base_wpm: 140
speed_offsets:
  xslow: -40
  slow: -20
  fast: 25
  xfast: 50
author: "Provided author"
created: "YYYY-MM-DD"
version: "1.0"
---
```

Use `profile: Actor` when a profile is present. Do not invent metadata. `duration` is a target or hint; do not change copy to force it.

Canonical front-matter keys are `title`, `profile`, `duration`, `base_wpm`, `speed_offsets.xslow`, `speed_offsets.slow`, `speed_offsets.fast`, `speed_offsets.xfast`, `author`, `created`, and `version`. `base_wpm` must be 80-220. Speed offsets are integer percentages, not WPM deltas: the multiplier is `1 + offset / 100`. The canonical defaults are `-40`, `-20`, `25`, and `50`, producing `0.6x`, `0.8x`, `1.25x`, and `1.5x`.

## Headers

Segment:

```markdown
## [Name|140WPM|warm|0:00-0:30|Speaker:Name|Archetype:Friend]
```

Block:

```markdown
### [Name|135WPM|focused|Speaker:Name|Archetype:Educator]
```

Only the name is required. Optional parameters are position-independent and separated by `|`. Omit unused parameters instead of adding empty fields.

- WPM: integer or `NNNWPM`, range 80-220.
- Emotion: one closed-set emotion.
- Segment timing: `MM:SS` or `MM:SS-MM:SS`.
- Speaker: `Speaker:Name`.
- Archetype: `Archetype:Name`.

Plain `## Name` and `### Name` are valid simple headers but cannot carry parameters. Header tokens are trimmed and matched by type. Duplicate values of the same type are invalid authoring even though recovery-oriented parsers may keep the last recognized value. Timing belongs to segments, not blocks. Unknown archetypes, emotions, timing forms, prefixes, and header tokens are invalid.

## Closed catalogs

Emotions are case-insensitive and closed:

| Emotion | Delivery | Typical pacing |
| --- | --- | --- |
| `neutral` | even and uncolored | steady |
| `warm` | friendly and approachable | relaxed |
| `professional` | formal, authoritative, clearly articulated | measured |
| `focused` | precise and concentrated | deliberate |
| `concerned` | careful and empathetic | slower |
| `urgent` | tense, direct, immediate | faster |
| `motivational` | encouraging with rising intensity | building |
| `excited` | enthusiastic with a wider pitch range | faster |
| `happy` | joyful, positive, light | relaxed |
| `sad` | somber and reflective | slower |
| `calm` | peaceful and reassuring | slow |
| `energetic` | dynamic and punchy | fast |

Archetypes:

| Archetype | Job | Recommended WPM | Expected WPM | Articulation | Energy | Melody | Volume tendency |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| `Friend` | connect | 135 | 125-150 | legato | 4-6 | 6-8 | soft/default |
| `Motivator` | inspire | 155 | 145-170 | legato | 7-10 | 7-9 | loud |
| `Educator` | inform | 120 | 110-135 | none expected | 3-5 | 2-4 | default |
| `Coach` | instruct | 145 | 135-160 | staccato | 7-9 | 1-3 | loud |
| `Storyteller` | transport | 125 | 100-150 | legato or staccato | 4-7 | 8-10 | flexible |
| `Entertainer` | delight | 150 | 140-165 | legato or staccato | 6-8 | 7-9 | flexible |

Delivery modes: `sarcasm`, `aside`, `rhetorical`, `building`.

Articulation: `legato`, `staccato`.

Volume: `loud`, `soft`, `whisper`.

Edit-point priorities:

| Priority | Meaning |
| --- | --- |
| unqualified | standard edit location |
| `low` | optional or low-impact review point |
| `medium` | important review point |
| `high` | critical review point |

## Inline syntax

### Pauses and breathing

```markdown
[pause:300ms]
[pause:600ms]
[pause:2s]
[breath]
```

TPS also accepts `/` and `//`, but lossless conversion should add explicit pause tags because literal slashes are common source characters. A breath does not add time.

`/` is exactly 300 ms and `//` is exactly 600 ms. Explicit seconds convert to milliseconds, so `[pause:2s]` is 2000 ms. Adjacent pause markers add together.

### Emphasis and visual highlight

```markdown
[emphasis]text[/emphasis]
[highlight]text[/highlight]
```

TPS accepts Markdown `*` and `**` emphasis, but do not add them in lossless conversion because they are indistinguishable from literal source punctuation.

### Speed

```markdown
[xslow]text[/xslow]
[slow]text[/slow]
[normal]text[/normal]
[fast]text[/fast]
[xfast]text[/xfast]
[150WPM]text[/150WPM]
```

Relative speed uses configured offsets from `base_wpm`. Absolute WPM is 80-220.

Resolution priority: inline speed, block WPM, segment WPM, archetype recommendation, `base_wpm`, default 140.

### Volume, delivery, and articulation

```markdown
[loud]text[/loud]
[soft]text[/soft]
[whisper]text[/whisper]
[sarcasm]text[/sarcasm]
[aside]text[/aside]
[rhetorical]text[/rhetorical]
[building]text[/building]
[legato]text[/legato]
[staccato]text[/staccato]
```

### Energy, melody, and emotion

```markdown
[energy:8]text[/energy]
[melody:3]text[/melody]
[warm]text[/warm]
[urgent]text[/urgent]
```

Energy and melody are integers 1-10. Any closed-set emotion may wrap text.

| Range | Energy | Melody |
| --- | --- | --- |
| 1-2 | minimal, still, near-monotone physical intensity | flat, factual pitch contour |
| 3-4 | calm, measured, restrained | subtle, controlled inflection |
| 5-6 | engaged conversational intensity | natural conversational inflection |
| 7-8 | dynamic, animated, projected | expressive and musical |
| 9-10 | maximum, commanding intensity | dramatic, theatrical pitch contour |

### Pronunciation and stress

```markdown
[phonetic:ˈkæməl]camel[/phonetic]
[pronunciation:KAM-uhl]camel[/pronunciation]
develop[stress]me[/stress]nt
[stress:de-VE-lop-ment]development[/stress]
```

Never guess uncertain pronunciation.

### Editing cues

```markdown
[edit_point]
[edit_point:low]
[edit_point:medium]
[edit_point:high]
```

Place edit points at natural phrase, block, or segment boundaries.

## Escapes

Escape a source character only when TPS would parse it as syntax:

| Source literal | TPS serialization |
| --- | --- |
| `[` | `\[` |
| `]` | `\]` |
| `|` | `\|` |
| `/` | `\/` |
| `*` | `\*` |
| `\` | `\\` |

Escapes apply to plain text, not tag or header parameters. Escape parser-sensitive source sequences, URLs, paths, slash punctuation, and literal asterisks conservatively.

## Nesting and inheritance

- Close wrapper tags in reverse order; cross-nesting is invalid.
- Inline tags override block values; block values override segment values; segment values override archetype or document defaults.
- Use header inheritance for sustained direction and inline tags for local changes.
- Tags are case-insensitive, but emit canonical lowercase tags and conventional uppercase `WPM`.
- Unknown tags, malformed attributes, unbalanced wrappers, invalid values, and invalid header parameters are errors.

### Exact precedence

Effective WPM resolves in this order: innermost inline speed, enclosing inline speed, block WPM, segment WPM, archetype recommendation, `base_wpm`, default 140. Emotion, articulation, energy, and melody use the innermost applicable inline wrapper. Volume is independent from emotion and delivery mode. Delivery modes (`sarcasm`, `aside`, `rhetorical`, `building`) replace the current emotion-style delivery for their span. Inline direction always wins over archetype expectations; an archetype mismatch is advisory, not a reason to ignore valid inline markup.

Relative speed wrappers stack multiplicatively. With default offsets, `[xslow][slow]text[/slow][/xslow]` is `base x 0.6 x 0.8`. An absolute wrapper creates a new base for nested relative speed: `[150WPM][slow]text[/slow][/150WPM]` is 120 WPM. `[normal]` resets to the document/runtime base rather than the surrounding relative multiplier.

`/`, `//`, and explicit pauses are additive when adjacent. A `[breath]` creates a breath boundary without duration. In lossless work, generated pauses must use `[pause:...]`; escape source slashes as `\/` only when they would otherwise parse as pause syntax.

### Phrase and word parsing

A phrase ends at sentence punctuation (`.`, `?`, `!`), a pause marker, or a segment/block boundary. Timing counts words after removing headers and tags and decoding escapes. Text split by a mid-word wrapper is rejoined before counting, so `develop[stress]me[/stress]nt` is one word. Whitespace separates words; a hyphenated token remains one word. Phrase duration is `(word_count / effective_wpm) * 60000`, plus explicit pause durations.

An unclosed wrapper may be recovered by a tolerant parser at the end of a block, but generated TPS must never rely on recovery. Unknown tags, cross-nesting, and malformed attributes remain validation failures.

## Archetype validation profiles

Archetype checks are advisory warnings after syntax is valid. Run rhythm checks only on scopes with at least 12 words.

| Archetype | Phrase words | Pauses / 100 words | Pause ms | Emphasis % | Speed changes / 100 words |
| --- | --- | --- | --- | --- | --- |
| `Friend` | 8-15 | 4-8 | 300-600 | 3-8 | 0-1 |
| `Motivator` | 8-20 | 3-6 | 600-2000 | 10-20 | 0-2 |
| `Educator` | 10-25 | 6-12 | 400-800 | 3-8 | 0-2 |
| `Coach` | 3-8 | 8-15 | 200-400 | 15-30 | 0-2 |
| `Storyteller` | 5-20 | 4-10 | 500-3000 | 5-12 | 3-6 |
| `Entertainer` | 5-15 | 5-10 | 300-2000 | 5-15 | 2-4 |

Out-of-profile WPM, articulation, energy, melody, phrase length, pause frequency, pause duration, emphasis density, or speed variation produces a warning, not invalid TPS. Deliberate valid overrides are allowed.

## Validation and recovery semantics

- Reject authoring WPM outside 80-220, while 80-89 and 201-220 should be treated as extreme-use warnings.
- Reject energy or melody outside 1-10 and pauses that are missing, zero, negative, or use an unsupported unit.
- Reject unknown emotions, archetypes, delivery modes, articulation styles, volume tags, speed tags, and malformed edit priorities in generated TPS.
- Reject cross-nested or mismatched wrappers. A tolerant parser may recover state for diagnostics, but generated output must be balanced.
- Treat `Speaker:` values as opaque non-empty names and preserve the supplied spelling exactly.
- Treat front-matter `duration` as a target. A compiled duration more than 20% over target is a warning; it never authorizes source editing.
- Legacy metadata aliases may be readable by runtimes, but generated TPS uses only the canonical keys listed above.

### Parser recovery contract

Recovery keeps a reader usable but does not make malformed authoring valid:

- An unknown tag is retained as literal visible text and reported as an unknown-tag diagnostic.
- An unknown emotion is ignored in favor of inherited emotion and reported as an error.
- An unknown archetype is ignored, leaves no archetype for that scope, and is reported as an error.
- An invalid header WPM is ignored in favor of inherited WPM and reported as an error.
- An invalid energy or melody wrapper is ignored and reported as an error.
- A malformed pause is retained as literal text and reported as malformed.
- An unclosed wrapper is implicitly closed at the end of its block for recovery and reported.
- A closing wrapper without an opening wrapper is ignored and reported.
- Cross-nesting is recovered by closing scopes in stack order and reported.
- Duplicate recognized header parameters recover with the last value, but generation must never emit duplicates.

## Actor profile and WPM guidance

`Actor` is the canonical spoken-reading profile. The general recommended range is 125-150 WPM, with 140 as the default.

| Use | WPM | Guidance |
| --- | --- | --- |
| Formal, legal, careful teaching | 100-120 | clear diction and longer processing pauses |
| Standard teleprompter | 125-150 | comfortable natural reading |
| Conversational or energetic | 145-165 | experienced reader, natural rhythm |
| Fast presentation | 160-170 | short sustained spans only |

Use 80-99 or 171-220 only for a deliberate effect. Relative speed presets may temporarily produce an effective value outside the comfortable range; `xfast` at base 140 is 210 WPM and should be brief.

## Casing, whitespace, and normalization

- Tags, emotion values, and recognized header keywords are case-insensitive; generate canonical lowercase tags and conventional archetype casing.
- `WPM` is uppercase by convention. Parsers may normalize `140wpm` and `140 WPM` to `140WPM`.
- Trim header parameters around `|`; do not change whitespace inside the spoken text.
- Escapes are decoded only in plain text, never inside tag arguments or header parameters.
- Preserve Unicode. A UTF-8 TPS file uses `.tps`; `.tps.md` and `.md.tps` are valid markdown-editor alternatives.

## Rendering contract

TPS is source markup. A teleprompter renderer shows clean spoken text and never exposes structural headers or raw direction tags to the reader. Pauses, breath marks, and edit points become non-spoken timing or visual cues.

Recommended visual meaning is implementation-defined but must stay consistent:

| Direction | Typical visible treatment |
| --- | --- |
| emphasis / highlight | weight, accent, or highlight overlay |
| slow / fast | wider or tighter pacing/spacing |
| loud / soft / whisper | larger/bolder or smaller/lighter text |
| legato / staccato | connected or separated rhythm cues |
| energy / melody | intensity and pitch-contour indicators |
| sarcasm / aside / rhetorical / building | distinct delivery indicator; building ramps intensity |
| pronunciation / phonetic / stress | guide, tooltip, or stressed-syllable treatment |
| segment / block | navigation divider, never spoken markup |

The reference rendering context is a near-black teleprompter background with light text. Styled text should preserve at least WCAG AA 4.5:1 contrast. A highlight uses an overlay rather than reducing text contrast. These are renderer recommendations, not syntax requirements.

TPS body content is intended to be spoken. URLs, code, tables, and media references are authoring smells, not parser errors. In lossless conversion, preserve them exactly and escape only parser-sensitive characters; never rewrite them into more speakable copy.

## Complete-coverage map

This file contains the complete TPS document, metadata, structure, closed catalogs, tag syntax, escapes, inheritance, precedence, timing, rhythm, validation, recovery, profile, normalization, file-extension, and rendering contract needed by an author or formatter. Literal edge-case examples live in `examples.md`; direction selection lives in `direction-playbook.md`. SDK object models and player APIs are implementations of this format, not additional TPS syntax.

## Final validity check

Confirm closed-set values, WPM range, energy/melody range, positive pauses, balanced tags, valid escapes, and no invented metadata. Then run the separate lossless audit from `SKILL.md`.

# TPS Format Specification (TelePrompterScript)

## What is TPS?

TPS (TelePrompterScript) is a markdown-based file format for teleprompter scripts. It supports hierarchical content organization with precise timing, emotional cues, visual styling, and presentation instructions.

## Motivation

Teleprompter scripts need more than plain text. A speaker needs pace guidance, emotional cues, visual emphasis, and natural pauses — all embedded directly in the script. Existing formats (plain text, SubRip `.srt`, WebVTT) either lack structure entirely or focus on subtitle timing rather than live presentation flow.

TPS bridges this gap: it is human-readable markdown that any text editor can open, yet it carries rich metadata that teleprompter software can interpret for real-time rendering.

## Target Audience

- **Script authors** — writers who create teleprompter scripts and want inline pace/emotion control without leaving a text editor.
- **Teleprompter app developers** — engineers who parse and render TPS files in real-time reading applications.
- **Content producers** — video/podcast teams who need structured, reviewable scripts with edit points and timing hints.

## Design Goals

1. **Markdown-compatible** — a `.tps` file renders reasonably in any markdown viewer.
2. **Human-authorable** — no tooling required to write a valid script.
3. **Hierarchical** — documents decompose into Segments → Blocks → Phrases → Words, each level inheriting and overriding properties.
4. **Minimal yet extensible** — the core tag set is small; parsers ignore unknown tags gracefully.

## Glossary

| Term | Definition |
|------|-----------|
| **Script** | The entire TPS document, including front matter and all content. |
| **Front Matter** | YAML metadata block delimited by `---` at the top of the file. |
| **Segment** | A major section (`##` header) — e.g., Intro, Problem, Solution. |
| **Block** | A topic group (`###` header) within a segment. |
| **Phrase** | A sentence or thought within a block, delimited by sentence-ending punctuation or pause markers. |
| **Word** | An individual token with optional per-word properties (color, emphasis, pause). |
| **WPM** | Words Per Minute — the reading speed. |
| **Edit Point** | A marker indicating a natural place to stop or start an editing session. |
| **Emotion** | A predefined mood preset that controls visual styling (colors) and presentation hints. |

## File Structure

```
Script
├── Front Matter (YAML metadata)
├── Title (# header — optional, informational only)
└── Segments (## headers — major sections)
    └── Blocks (### headers — topic groups within segments)
        └── Phrases (sentences/thoughts with inline markers)
            └── Words (with individual properties)
```

### Title (`#` Level)

An optional `#` header immediately after the front matter. It serves as the document title for display purposes. Parsers should treat it as metadata — it does not create a segment or affect WPM/emotion inheritance. If omitted, the `title` field from the front matter is used instead. If both are present, the `#` header takes precedence for display.

## Format Specification

### Front Matter (YAML)

The front matter is a YAML block delimited by `---` lines at the very start of the file. All fields are optional.

```yaml
---
title: "Script Title"
profile: Actor              # Actor (default)
duration: "10:00"           # Target duration MM:SS
base_wpm: 140               # Default words per minute
speed_offsets:              # Percentage offsets for speed tags relative to base_wpm
  xslow: -40                # [xslow] = base_wpm × 0.6 (40% slower)
  slow: -20                 # [slow] = base_wpm × 0.8 (20% slower)
  fast: 25                  # [fast] = base_wpm × 1.25 (25% faster)
  xfast: 50                 # [xfast] = base_wpm × 1.5 (50% faster)
author: "Author Name"
created: "2024-01-01"
version: "1.0"
---
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | string | — | Human-readable script title. |
| `profile` | string | `Actor` | `Actor` for natural spoken reading from a teleprompter. |
| `duration` | string | — | Target duration in `MM:SS` format. |
| `base_wpm` | integer | 140 | Default reading speed (words per minute) for the entire document. |
| `speed_offsets.xslow` | integer | -40 | Percentage offset for `[xslow]...[/xslow]` tags. Default -40 means 60% of base speed. |
| `speed_offsets.slow` | integer | -20 | Percentage offset for `[slow]...[/slow]` tags. Default -20 means 80% of base speed. |
| `speed_offsets.fast` | integer | 25 | Percentage offset for `[fast]...[/fast]` tags. Default 25 means 125% of base speed. |
| `speed_offsets.xfast` | integer | 50 | Percentage offset for `[xfast]...[/xfast]` tags. Default 50 means 150% of base speed. |
| `author` | string | — | Script author name. |
| `created` | string | — | Creation date (ISO 8601). |
| `version` | string | — | Document version. |

### Segments (`##` Level)

Segments are major sections of the script.

```markdown
## [SegmentName|120WPM|Emotion|Timing]
```

All parameters after the name are optional, separated by `|`. Parameters are identified by format, not by position:

- An integer (or integer + `WPM` suffix) → **WPM**
- A known emotion keyword → **Emotion**
- A time pattern (`MM:SS` or `MM:SS-MM:SS`) → **Timing**

This means parameters can appear in any order and unneeded ones can simply be omitted — no empty `||` slots required.

**Examples:**
- `## [Intro|Warm]` — inherits base WPM, sets emotion
- `## [Urgent Update|145WPM|Urgent|0:30-1:10]` — overrides WPM, sets emotion and timing
- `## [Overview|Neutral]` — inherits WPM, sets emotion
- `## [Simple Segment]` — name only, inherits everything

**Segment Parameters:**

| Parameter | Format | Description |
|-----------|--------|-------------|
| **Name** | free text | Human-readable label shown in editors. Required (first value before the first `\|`). |
| **WPM** | `NNN` or `NNNWPM` | Integer speed override. Omit to inherit. |
| **Emotion** | preset name | Emotion preset (see table below). Omit to inherit (defaults to `Neutral` at document level). |
| **Timing** | `MM:SS` or `MM:SS-MM:SS` | Duration hint. Stored for tooling; playback computes timing from word counts. |

**Leading text:** Content between a segment header and its first block is preserved as introductory text that inherits the segment's speed and emotion.

### Blocks (`###` Level)

Blocks are topic groups within a segment.

```markdown
### [BlockName|120WPM|Emotion]
```

**Examples:**
- `### [Opening Block]` — inherits segment WPM and emotion
- `### [Speed Variations|Focused]` — inherits WPM, overrides emotion
- `### [Key Stats|130WPM]` — overrides WPM, inherits emotion
- `### [Climax|150WPM|Urgent]` — overrides both

**Block Parameters:**

| Parameter | Format | Description |
|-----------|--------|-------------|
| **Name** | free text | Descriptive label. Required (first value before the first `\|`). |
| **WPM** | `NNN` or `NNNWPM` | Integer speed override. Inherits segment WPM if omitted. |
| **Emotion** | preset name | Emotion override. Inherits segment emotion if omitted. |

### Inline Markers

Inline markers are embedded within phrase text to control presentation.

#### Pauses

```markdown
[pause:2s]          # 2-second pause
[pause:1000ms]      # 1000-millisecond pause
/                   # Short pause (300ms)
//                  # Medium pause (600ms)
```

#### Emphasis

```markdown
[emphasis]word[/emphasis]    # Standard emphasis (level 1)
*word*                       # Markdown italic → emphasis level 1
**word**                     # Markdown bold → emphasis level 2
```

#### Speed Changes

```markdown
[150WPM]text here[/150WPM]    # Temporary absolute speed change
[xslow]very careful[/xslow]   # Relative: base_wpm × 0.6 (40% slower than base)
[slow]important point[/slow]   # Relative: base_wpm × 0.8 (20% slower than base)
[fast]quick mention[/fast]     # Relative: base_wpm × 1.25 (25% faster than base)
[xfast]rapid section[/xfast]   # Relative: base_wpm × 1.5 (50% faster than base)
[normal]reset speed[/normal]   # Reset to base_wpm (multiplier = 1.0)
```

**Speed tag summary (at base_wpm = 140):**

| Tag | Multiplier | Effective WPM |
|-----|-----------|---------------|
| `[xslow]` | 0.6× | 84 |
| `[slow]` | 0.8× | 112 |
| `[normal]` | 1.0× | 140 |
| `[fast]` | 1.25× | 175 |
| `[xfast]` | 1.5× | 210 |

**Note:** All relative speed tags are **relative to the base speed**, not absolute values. The multiplier is calculated as `1 + (offset / 100)`. For example, `slow` with offset `-20` → multiplier `1 + (-20/100)` = `0.8`. Tags stack multiplicatively when nested: `[xslow][slow]text[/slow][/xslow]` = base × 0.6 × 0.8 = 48% of base.

#### Runtime Speed Control

The **+/−** buttons on the reading page change the **base speed** for the current run. All relative speed tags (`[xslow]`, `[slow]`, `[fast]`, `[xfast]`) automatically scale with the new base, preserving their proportional relationship. For example, pressing **+** to increase from 140 to 150 WPM means `[slow]` changes from 112 to 120 WPM.

#### Color Styling

```markdown
[red]warning text[/red]             # Color coding
[highlight]key point[/highlight]    # Highlighting (yellow background)
```

#### Emotion Styling

```markdown
[warm]friendly greeting[/warm]      # Apply emotion-based styling inline
[urgent]breaking news[/urgent]      # Emotion colors applied to text
```

#### Edit Points

```markdown
[edit_point:high]                   # High priority edit point
[edit_point:medium]                 # Medium priority edit point
[edit_point]                        # Standard edit point (no priority)
```

#### Pronunciation Guides

```markdown
[phonetic:ˈkæməl]camel[/phonetic]              # IPA pronunciation
[pronunciation:KAM-uhl]camel[/pronunciation]    # Simple guide
```

#### Stress Marks

```markdown
[stress:de-VE-lop-ment]development[/stress]     # Stressed syllable in UPPERCASE
[stress:IN-fra-struc-ture]infrastructure[/stress]
```

The guide string uses hyphens to separate syllables. The stressed syllable is written in **UPPERCASE**; unstressed syllables are lowercase. For words with secondary stress, use an acute accent on the vowel: `[stress:rè-su-MÉ]résumé[/stress]`.

Renderers should display the stress guide as a tooltip, subtitle, or overlay — not replace the word itself.

## Keyword Reference

### Emotions (case-insensitive)

| Keyword | Color | Emoji | Description |
|---------|-------|-------|-------------|
| `warm` | Orange | 😊 | Friendly, welcoming tone |
| `concerned` | Red | 😟 | Worried, empathetic |
| `focused` | Green | 🎯 | Concentrated, precise |
| `motivational` | Purple | 💪 | Inspiring, encouraging |
| `neutral` | Blue | 😐 | Default, balanced |
| `urgent` | Bright Red | 🚨 | Critical, immediate attention |
| `happy` | Yellow | 😄 | Joyful, positive |
| `excited` | Pink | 🚀 | Enthusiastic, energetic |
| `sad` | Indigo | 😢 | Melancholy, somber |
| `calm` | Teal | 😌 | Peaceful, relaxed |
| `energetic` | Orange-Red | ⚡ | High energy, dynamic |
| `professional` | Navy | 💼 | Business-like, formal |

### Colors (case-insensitive)

Colors are **semantic names** — renderers map them to actual hex values appropriate for the rendering context. The hex codes below are reference values for a **dark background** (the default teleprompter rendering context).

| Keyword | Dark-BG Hex | Visibility | Usage |
|---------|-------------|------------|-------|
| `red` | #FF6B6B | High | Warnings, emphasis |
| `green` | #51CF66 | High | Positive, success |
| `blue` | #74C0FC | High | Calm, informational |
| `yellow` | #FFE066 | High | Caution, highlight |
| `orange` | #FFA94D | High | Attention |
| `purple` | #CC5DE8 | High | Creative, special |
| `cyan` | #66D9E8 | High | Cool, tech |
| `magenta` | #F783AC | High | Accent |
| `pink` | #FAA2C1 | High | Soft emphasis |
| `teal` | #38D9A9 | High | Professional |
| `white` | #F8F9FA | High | Default text on dark BG |
| `gray` | #ADB5BD | Medium | Subdued, secondary text |

> **Note:** `black` is **not a valid inline color** — it is invisible on the dark teleprompter background. Parsers should strip `[black]` tags and render the enclosed content unstyled (no color applied).

`highlight` is a **formatting tag**, not a color — it applies a semi-transparent yellow **background overlay**: `[highlight]key point[/highlight]`.

### Inline Tags

| Tag | Syntax | Description |
|-----|--------|-------------|
| **Pause** | `[pause:Ns]` or `[pause:Nms]` | Pause for N seconds/milliseconds |
| **Short pause** | `/` | 300ms pause |
| **Medium pause** | `//` | 600ms pause |
| **Emphasis** | `[emphasis]text[/emphasis]` | Standard emphasis (level 1) |
| **Markdown emphasis** | `*text*` | Converted to emphasis level 1 |
| **Strong emphasis** | `**text**` | Converted to emphasis level 2 |
| **Highlight** | `[highlight]text[/highlight]` | Visual highlighting |
| **Speed (absolute)** | `[NWPM]text[/NWPM]` | Temporary absolute speed change (e.g., `[150WPM]`) |
| **Speed (preset)** | `[xslow]text[/xslow]` | Extra slow: base × 0.6 |
| **Speed (preset)** | `[slow]text[/slow]` | Slow: base × 0.8 |
| **Speed (preset)** | `[fast]text[/fast]` | Fast: base × 1.25 |
| **Speed (preset)** | `[xfast]text[/xfast]` | Extra fast: base × 1.5 |
| **Speed (reset)** | `[normal]text[/normal]` | Reset to base speed: base × 1.0 |
| **Edit point** | `[edit_point]` or `[edit_point:priority]` | Mark edit location |
| **Phonetic** | `[phonetic:IPA]text[/phonetic]` | IPA pronunciation guide |
| **Pronunciation** | `[pronunciation:guide]text[/pronunciation]` | Simple pronunciation guide |
| **Stress** | `[stress:SYL-la-ble]text[/stress]` | Syllable stress (UPPERCASE = stressed) |
| **Color** | `[red]text[/red]`, `[green]...[/green]`, etc. | Apply color styling (see Colors table) |
| **Emotion** | `[warm]text[/warm]`, `[urgent]...[/urgent]`, etc. | Apply emotion-based color styling (see Emotions table) |

### Speed Presets

All speed presets are **relative to base_wpm** — they apply a multiplier, not an absolute value.

| Preset | Multiplier | Effect at base 140 | Usage |
|--------|-----------|---------------------|-------|
| `xslow` | 0.6× | 84 WPM | Very careful delivery, critical warnings |
| `slow` | 0.8× | 112 WPM | Important points, emphasis |
| `fast` | 1.25× | 175 WPM | Quick mentions, asides |
| `xfast` | 1.5× | 210 WPM | Rapid transitions, low-importance text |
| `normal` | 1.0× | 140 WPM | Reset to base speed |

### Edit Point Priorities

| Priority | Usage |
|----------|-------|
| `high` | Critical edit points, must review |
| `medium` | Important but not critical |
| (none) | Standard edit point |

### Escape Sequences

| Sequence | Result | Usage |
|----------|--------|-------|
| `\[` | `[` | Literal bracket in text |
| `\]` | `]` | Literal bracket in text |
| `\|` | `|` | Literal pipe in segment/block names |
| `\/` | `/` | Literal slash (not a pause) |
| `\*` | `*` | Literal asterisk (not emphasis) |
| `\\` | `\` | Literal backslash |

## Parsing Rules

### Inheritance

Properties flow downward through the hierarchy. Each level can override its parent:

1. **Front matter** sets document-level defaults (base_wpm, speed_offsets).
2. **Segment** overrides document defaults for WPM, emotion.
3. **Block** overrides segment defaults for WPM, emotion.
4. **Inline tags** override block defaults for the tagged span only.

If a child omits a value, it inherits from its nearest ancestor.

**Best practice:** Only specify WPM or emotion when they **differ** from the inherited value. If `base_wpm` is 140 and a segment runs at 140 WPM, omit the WPM parameter — `## [Intro|Warm]` not `## [Intro|140WPM|Warm]`. Similarly, if a block's emotion matches its parent segment, omit it — `### [Details]` not `### [Details|140WPM|Warm]`. Redundant declarations add noise and make overrides harder to spot.

### WPM Resolution

For any word, the effective WPM is determined by (highest priority first):

1. Inline speed tag (`[150WPM]...[/150WPM]`, `[xslow]`, `[slow]`, `[normal]`, `[fast]`, `[xfast]`)
2. Block header WPM
3. Segment header WPM
4. `base_wpm` from front matter
5. Default: 140 WPM

### Pause Handling

- `/` inserts a 300ms pause at the word boundary.
- `//` inserts a 600ms pause at the word boundary.
- `[pause:Ns]` inserts N×1000 ms pause.
- `[pause:Nms]` inserts N ms pause.
- Pauses at word boundaries are additive if multiple markers appear together.

### Emotion Transitions

When emotion changes between segments or blocks, renderers should apply a smooth visual transition (recommended: 3-second fade between color schemes).

### Color and Emotion Precedence

When inline color and emotion tags are nested, the **innermost tag wins** for the enclosed span. For example, `[warm][red]text[/red][/warm]` renders "text" in red, not the warm emotion color. Block-level emotion serves as the default styling; inline tags override it for their span only.

### Phrase Boundaries

A **phrase** is a unit of text delimited by:
- Sentence-ending punctuation: `.` `?` `!`
- Pause markers: `/`, `//`, `[pause:...]`
- Block or segment boundaries

Phrases are the smallest unit for timing calculation. Words within a phrase are counted for WPM computation using whitespace tokenization: each whitespace-separated token counts as one word. Hyphenated words (e.g., `state-of-the-art`) count as one word. Tags and tag syntax are not counted.

### Tag Nesting

- Tags must be properly closed: `[red]text[/red]`.
- Tags must not cross-nest: `[red][emphasis]text[/red][/emphasis]` is **invalid**.
- Valid nesting: `[red][emphasis]text[/emphasis][/red]`.
- If a tag is never closed, the parser should implicitly close it at the end of the current block.

### Nested Speed Resolution

When speed tags are nested, relative tags (`[slow]`, `[fast]`, etc.) stack multiplicatively against the **base speed** — not against each other:

- `[slow]text[/slow]` = base × 0.8
- `[xslow][slow]text[/slow][/xslow]` = base × 0.6 × 0.8 = base × 0.48

When an absolute speed tag (`[150WPM]`) contains a relative tag, the absolute value becomes the new base for the inner tag:

- `[150WPM][slow]text[/slow][/150WPM]` = 150 × 0.8 = 120 WPM

### Content Without Segments

If a TPS file has no `##` segment headers, the entire content (after front matter) is treated as a single implicit segment with `Neutral` emotion and default WPM.

### Simple Headers

Plain markdown `## Title` and `### Title` headers (without `[...]` brackets) are also recognized as segments and blocks respectively, with default (neutral) emotion and inherited WPM.

## Rendering Context

TPS is designed for **teleprompter use** — text is always rendered on a **dark background** (typically near-black: `#1A1B2E` or similar). All color choices, contrast ratios, and visibility rules assume this context.

### Dark Background Rules

1. **Text base color** is white/light (`#F8F9FA` or similar). All inline colors must be **lighter variants** that contrast well against dark backgrounds.
2. **`black` is not a valid inline color** — it would be invisible. Renderers should strip `[black]` tags and render the enclosed content unstyled.
3. **Minimum contrast** — all color keywords must produce at least **WCAG AA 4.5:1** contrast ratio against the dark background.
4. **Emotion color schemes** (background, text, accent) are pre-defined per emotion. They are not raw hex values — they are tuned for the dark rendering context with appropriate alpha channels.
5. **`highlight`** uses a semi-transparent yellow background overlay, not a text color change.

## WPM Guidelines

### Actor Profile (Spoken Reading)

The Actor profile targets natural spoken delivery — reading aloud from a teleprompter while maintaining eye contact with the camera.

| Use Case | WPM Range | Recommendation |
|----------|-----------|----------------|
| Slow, formal (news anchor, legal) | 100–130 | Clear diction, long pauses between phrases |
| **Standard teleprompter** | **130–160** | **Comfortable for most speakers** |
| Conversational / podcast | 150–170 | Natural speech rhythm |
| Fast presentation (pitch, TED) | 170–200 | Experienced speakers only |

**Default `base_wpm`: 140** — sits in the middle of the standard range. Most people read comfortably at 130–150 WPM from a teleprompter.

**Duration formula:** `phrase_duration_ms = (word_count / effective_wpm) × 60000`. Total duration is the sum of all phrase durations plus all pause durations.

**Advice for script authors:**
- Start at 130 WPM for new speakers, increase gradually.
- Use `[xslow]...[/xslow]` for critical warnings or very important statements.
- Use `[slow]...[/slow]` for key points and emotional moments.
- Use `[fast]...[/fast]` for asides and throwaway lines.
- Use `[xfast]...[/xfast]` for rapid transitions or low-importance filler.
- Add `/` pauses between clauses; `//` between sentences.

## Profiles and Validation

### Validation Requirements

| Rule | Value |
|------|-------|
| WPM error range | < 80 or > 220 |
| WPM warning range | < 90 or > 200 |
| Recommended WPM | 130–160 |
| Segment/Block WPM | Single integer |
| Inline speed | Integer, respects allowed range |

Additional validation:
- Emotions must be from the predefined set (see table above).
- Timing calculations should not exceed target duration by > 20%.
- All markup tags must be properly closed; no cross-nesting.
- Edit points should be at phrase or block boundaries.
- Pronunciation guides should use valid IPA or phonetic notation.

### Casing, Whitespace, Escaping

- Tags are case-insensitive; canonical form is lower-case (e.g., `[emphasis]`).
- `WPM` suffix is uppercase by convention (e.g., `140WPM`).
- Parameters inside headers are trimmed; `140 WPM` normalizes to `140WPM`.
- Escape reserved characters in plain text with backslash: `\[`, `\]`, `\|`, `\/`, `\*`, `\\`.

## Complete Example

```markdown
---
title: Product Launch
profile: Actor
base_wpm: 140
speed_offsets:
  xslow: -40
  slow: -20
  fast: 25
  xfast: 50
author: Jane Doe
---

# Product Launch

## [Intro|Warm]

### [Opening Block]
Good morning everyone, / and [emphasis]welcome[/emphasis] to what I believe /
will be a [green]transformative moment[/green] for our company. //

[pause:2s]

### [Purpose Block|145WPM]
[emphasis]Today[/emphasis], / we're not just launching a product – /
we're introducing a [highlight]solution[/highlight] that will [emphasis]revolutionize[/emphasis] /
how our customers interact with [stress:tech-NO-lo-gy]technology[/stress]. //

## [Problem|135WPM|Concerned]

### [Statistics Block|Neutral]
But first, / let's address the [xslow][red]elephant in the room[/red][/xslow]. /
Our industry has been [emphasis]struggling[/emphasis] with a fundamental problem. //

[edit_point:high]

According to recent studies, /
[slow][emphasis]73% of users abandon[/emphasis] applications within the first three interactions[/slow] /
due to [highlight]complexity and poor user experience[/highlight]. //

### [Impact Block]
This affects [emphasis]millions[/emphasis] of people worldwide, /
costing businesses [red]billions in revenue[/red] annually. //

## [Solution|Focused]

### [Introduction Block]
That's where our [blue][emphasis]new platform[/emphasis][/blue] comes in. /
We've developed a [green]local-first teleprompter workflow[/green] that /
[highlight]simplifies complex processes[/highlight] and [emphasis]enhances user experience[/emphasis]. //

### [Benefits Block|150WPM|Excited]
With our solution, / you can expect a [green][emphasis]50% reduction[/emphasis][/green] in user abandonment /
and a [green][emphasis]30% increase[/emphasis][/green] in engagement. //

[pause:1s]

[xfast]Full details are available in the handout.[/xfast] /
[highlight]Thank you[/highlight] for your time. //

[edit_point:medium]
```

## Examples

The [`examples/`](examples/) directory contains sample TPS files demonstrating the format:

| File | Description |
|------|-------------|
| [`basic.tps`](examples/basic.tps) | Minimal valid TPS file — front matter, title, segments, blocks, pauses, emphasis. |
| [`advanced.tps`](examples/advanced.tps) | All format features — speed controls, inline WPM, colors, emotions, pronunciation, edit points, tag nesting. |
| [`multi-segment.tps`](examples/multi-segment.tps) | Multi-segment script with varying speed and emotion across segments. |

## File Extension

- Primary: `.tps` (TelePrompterScript)
- Alternative: `.tps.md` (for markdown-aware editors)

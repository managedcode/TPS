# TPS Glossary

This glossary is the durable reference for TPS terms used by the format specification, SDKs, validators, compilers, and players.
It is intended to be complete for the current TPS specification, including heading markers (`#`, `##`, `###`), inline tags, diagnostics, compiled runtime concepts, and SDK terminology.

## Core Document Terms

| Term | Definition |
|------|------------|
| **TPS** | TelePrompterScript, a markdown-based teleprompter script format with timing, pacing, emotion, and presentation metadata. |
| **Script** | The full TPS document, including front matter, optional title, segments, blocks, phrases, and words. |
| **Front Matter** | The metadata block at the top of the file delimited by `---`. |
| **Title** | The optional `#` heading after front matter. It is display metadata, not a segment. |
| **Segment** | A major script section defined by a `##` header. |
| **Block** | A topic group inside a segment defined by a `###` header. |
| **Phrase** | A spoken unit inside a block, usually bounded by sentence-ending punctuation or pause markers. |
| **Word** | The smallest compiled spoken token, including regular words and control tokens such as pauses or edit points. |

## Syntax And Structural Markers

| Term | Definition |
|------|------------|
| **Title Heading (`#`)** | The single top-level heading used as display title metadata for the script. |
| **Segment Heading (`##`)** | The heading form that starts a major segment. |
| **Block Heading (`###`)** | The heading form that starts a block inside a segment. |
| **Header Parameter** | A `|`-separated value inside a segment or block header, such as WPM, emotion, timing, or `Speaker:Name`. |
| **Timing Point** | A single header time value such as `0:30`. |
| **Timing Range** | A header time span such as `0:30-1:10`. |
| **Escape Sequence** | A backslash escape used to render TPS control characters literally, for example `\\[` or `\\/`. |

## Timing And Delivery Terms

| Term | Definition |
|------|------------|
| **WPM** | Words Per Minute, the reading speed used to calculate display timing. |
| **Base WPM** | The document-level default WPM defined by `base_wpm` in front matter. |
| **Effective WPM** | The final reading speed after base speed, relative tags, and explicit overrides are applied. |
| **Speed Offset** | A front matter percentage that adjusts relative speed tags such as `slow` or `xfast`. |
| **Absolute Speed Override** | An inline or header speed value like `150WPM` that directly sets effective reading speed. |
| **Relative Speed Tag** | A speed modifier such as `[slow]`, `[fast]`, or `[normal]` that scales from the current base speed. |
| **Timing Hint** | A header value like `0:30` or `0:30-1:10` stored for tooling and authoring context. |
| **Pause Marker** | A control token such as `[pause:2s]`, `/`, or `//` that inserts a timed pause into the compiled script. |
| **Breath Mark** | A `[breath]` marker that indicates a natural breathing point without adding display time. |
| **Emotion** | A named delivery profile such as `warm`, `urgent`, or `focused`. |
| **Emotion Preset** | A predefined emotion value recognized by the TPS validator and compiler. |
| **Emphasis** | A visual and delivery emphasis span created by tags such as `[emphasis]`, `*text*`, or `**text**`. |
| **Highlight** | A presentation tag such as `[highlight]...[/highlight]` that increases visual prominence without changing timing. |
| **Volume Level** | A loudness modifier such as `loud`, `soft`, or `whisper`. |
| **Volume Tag** | An inline tag that applies a volume level to a span of text. |
| **Delivery Mode** | A delivery-shaping tag such as `aside`, `rhetorical`, `sarcasm`, or `building`. |
| **Edit Point** | A control marker that identifies a good editing or stitching boundary in the script. |

## Authoring And Inline Metadata Terms

| Term | Definition |
|------|------------|
| **Inline Tag** | A TPS tag embedded in body text, for example `[slow]`, `[phonetic:...]`, or `[highlight]`. |
| **Speaker Assignment** | A `Speaker:Name` header token used for multi-speaker scripts. |
| **Phonetic Guide** | A pronunciation hint provided by `[phonetic:...]...[/phonetic]`. |
| **Pronunciation Guide** | A syllable-oriented guide provided by `[pronunciation:...]...[/pronunciation]`. |
| **Stress Text** | The literal text to emphasize inside a word or phrase. |
| **Stress Guide** | A guide that shows where spoken stress should land. |
| **Implicit Segment** | A segment synthesized by the parser when content appears before the first explicit `##` segment header. |
| **Implicit Block** | A block synthesized by the compiler when a segment has direct content but no explicit `###` blocks. |
| **Leading Content** | Text placed between a segment header and the first explicit block. |

## Validation Terms

| Term | Definition |
|------|------------|
| **Diagnostic Severity** | The seriousness of a validation message, typically `error`, `warning`, or `info`. |
| **Diagnostic Range** | The line/column or offset span associated with a validation finding. |
| **Suggestion** | Optional fix guidance attached to a diagnostic. |
| **Unknown Tag** | An inline tag that is not part of the TPS contract and should be reported by validation logic. |
| **Malformed Tag** | A tag-like construct with invalid syntax, for example a broken closing tag or invalid pause payload. |
| **Unknown Header Token** | A segment or block header parameter that is not recognized as name, speed, emotion, timing, or speaker. |

## Compiler And Player Terms

| Term | Definition |
|------|------------|
| **Validator** | The TPS component that checks structure and authoring rules and produces diagnostics. |
| **Diagnostic** | An actionable validation message with code, severity, range, and optional suggestion. |
| **Parser** | The TPS component that turns markdown TPS text into a structured document model. |
| **Compiler** | The TPS component that converts a parsed document into a timed, JSON-friendly playback model. |
| **Compiled Script** | The full compiled output containing metadata, segments, blocks, phrases, words, and total duration. |
| **State Machine** | The compiled playback model that lets a runtime resolve what should be visible at a given elapsed time. |
| **Player** | The runtime component that reads the compiled script and returns the current presentation state. |
| **Presentation Model** | The player output describing the active segment, block, phrase, visible words, active word, and remaining time. |
| **Current Word Index** | The zero-based index of the active compiled word, or `-1` when no active word exists. |
| **Elapsed Time** | The playback time passed into a player when resolving the current presentation model. |
| **Remaining Time** | The difference between compiled duration and elapsed playback time. |

## SDK Terms

| Term | Definition |
|------|------------|
| **ManagedCode.Tps SDK** | The multi-runtime TPS SDK workspace under `SDK/`. |
| **Runtime** | A language-specific TPS implementation such as TypeScript, JavaScript, or C#. |
| **Active Runtime** | A runtime enabled in `SDK/manifest.json` and covered by CI. |
| **Planned Runtime** | A reserved SDK folder that is documented but not yet enabled in CI. |
| **SDK Catalog** | The runtime listing page generated from `SDK/manifest.json` and published on the website. |
| **Runtime Matrix** | The CI-generated list of enabled runtimes used for build, test, and coverage workflows. |
| **Shared Fixtures** | Canonical test inputs and runtime expectations stored under `SDK/fixtures/`. |
| **Parity** | The requirement that all active SDKs expose the same TPS contract: constants, validation, parser, compiler, and player APIs. |

# TPS Passport Standard Links Brainstorm

## Goal

Make the TPS Agent passport explain the underlying format before it sells the Agent workflow, and connect visitors to the authoritative standard, its open-source source/SDK repository, and PrompterOne as a real implementation.

## Source-of-truth links

- Standard and documentation: `https://tps.managed-code.com/`
- Format specification and multi-runtime SDKs: `https://github.com/managedcode/TPS`
- Reference teleprompter implementation: `https://github.com/managedcode/PrompterOne`

## Content direction

- Define TPS as an open, Markdown-based `.tps` format for teleprompter scripts.
- Explain that YAML front matter carries document metadata, Markdown headings carry hierarchy, and inline cues carry pace, pauses, emotion, emphasis, speakers, and delivery intent.
- Separate the format from the Agent: TPS is the standard; TPS Script Director applies the standard without rewriting source copy.
- Present PrompterOne as an open-source example that parses and renders TPS into editor, rehearsal, and teleprompter experiences.
- Keep English and Ukrainian copy at parity.

## UI direction

- Add a prominent “What is TPS?” destination from the hero.
- Add one editorial definition panel with a compact visual grammar stack.
- Add three distinct linked resource cards: Standard, Source & SDKs, and PrompterOne.
- Preserve the existing dark editorial system, warm amber/cyan palette, responsive layout, and network-free self-contained HTML.

## Verification

- Validate all three URLs before publication.
- Check HTML byte budget and inline JavaScript syntax.
- Publish with optimistic passport revision control.
- Verify desktop and mobile rendering, bilingual switching, external link destinations, and browser console health.

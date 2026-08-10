# TPS Agent Passport Design QA

## Evidence

- Reference: `.codex/prostir/tps/reference-tps-editorial-specimen.png`
- Final live passport: <https://tps.ai.prostir.build/?v=final-14> (revision `12`)
- Approved product logo: `.codex/prostir/tps/assets/tps-mark-v2-64.png`
- Automatic social preview: <https://tps.ai.prostir.build/social-preview.png>

## Comparison passes

- Typography and layout: the final implementation preserves the reference's warm editorial surface, high-contrast serif hero, restrained sans-serif copy, gold accent, two-column source-to-TPS specimen, and sparse navigation. The richer production copy intentionally adds one text line while retaining the hierarchy.
- Responsive behavior: verified at 1280×720 and 390×844. Mobile has no horizontal overflow, keeps usable tap targets, stacks the specimen cleanly, and preserves the hero hierarchy.
- Color and assets: the warm paper, dark ink, muted gold, and monospaced syntax palette match the selected direction. The approved horizontal TPS mark is embedded in the passport and uploaded to both the Agent and Skill; Prostir reports `hasLogo: true` for both products.
- Content and SEO: the intent-matched H1 is `Format text for a teleprompter with AI.` Copy directly describes an AI teleprompter script formatter that returns TelePrompterScript without rewriting source text. Canonical metadata, indexable robots directives, Open Graph/Twitter tags, `WebApplication`, and `FAQPage` structured data are present. Open Graph and Twitter use Prostir's automatic `/social-preview.png` route.
- Interaction and accessibility: EN/UA switching, endpoint copy state, semantic headings and navigation, focus styles, reduced motion, and the subtle accessible `P` standard-passport link were verified. All 13 external links expose `target="_blank"`, `rel="noopener noreferrer"`, and a pointer cursor. The live response permits popups to escape the passport sandbox.

## Iteration history

1. Replaced the original dark dashboard direction with the selected editorial concept.
2. Replaced placeholder initials and earlier badge experiments with the approved compact TPS wordmark.
3. Tightened hero scale, width, and vertical rhythm after a same-frame desktop comparison.
4. Added an honest clipboard fallback and verified the success state in the live sandbox.
5. Restored Prostir's automatic social preview route and uploaded the approved product logo through the creator MCP.
6. Expanded the bundled `references/tps-format.md` from a partial guide into the complete compact TPS standard used by the Agent's attached Skill.

## Result

passed

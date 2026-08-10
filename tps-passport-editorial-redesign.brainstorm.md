# TPS Passport Editorial Redesign — Brainstorm

## Problem

The current custom Prostir passport reads like a technical dashboard and hides the product's simple purpose behind invented labels, numbered metadata, cards, and marketing copy.

## Product truth

- This is an AI Agent that formats finished user text as valid TPS.
- It adds TPS structure and performance direction without rewriting, translating, correcting, or reordering the source copy.
- The primary interaction is simple: give the Agent text; receive a `.tps` document.
- TPS is the TelePrompterScript format and standard published at <https://tps.managed-code.com/>.
- Managed Code is the publisher and should be credited with a link to <https://managed-code.com/>.
- The open-source format lives at <https://github.com/managedcode/TPS>.
- PrompterOne is the concrete reference application at <https://github.com/managedcode/PrompterOne>.

## Hard design requirements

- Follow the visual language of `managed-code.com` and `tps.managed-code.com` rather than inventing a separate Agent-dashboard style.
- State the product plainly above the fold: “AI agent that formats text into TPS.”
- Remove decorative meta labels, numbered cards, status strings, faux system chrome, and vague names such as “Script Director”.
- Use a small number of semantic sections with generous whitespace and strong typography.
- Keep English and Ukrainian copy available.
- Keep the MCP endpoint copy action useful but secondary.
- Keep the standard Prostir passport reachable only through a discreet `P` link with an accessible label and visible keyboard focus.
- Keep the page self-contained and within Prostir's custom-passport size limit.

## Search intent and copy strategy

The page should answer a real task, not repeat internal product vocabulary. Its primary intent is **format text for a teleprompter**; TPS and TelePrompterScript explain the method and format.

- Primary query family: `AI teleprompter script formatter`, `format text for teleprompter`, `convert text to teleprompter script`.
- Secondary query family: `TPS format`, `TelePrompterScript`, `structured teleprompter script`, `MCP teleprompter agent`.
- Use the query language naturally in the title, H1 support copy, first paragraph, one H2, and TPS definition. Do not keyword-stuff labels or repeat synonyms without purpose.
- Make one H1 visually dominant and keep headings descriptive so search engines and people see the same hierarchy.
- Keep the English page canonical. The current client-side Ukrainian switch is a reader convenience, not a separately indexable localized URL; do not add misleading `hreflang` entries without distinct URLs.
- Add accurate page metadata, Open Graph/Twitter metadata, and truthful JSON-LD. Do not invent pricing, reviews, ratings, or unsupported product claims.

### Compact-keyword decision

The earlier “Your script, ready for the teleprompter” direction is too broad. The final landing page targets the high-intent compact keyword **AI teleprompter script formatter** and answers the task immediately.

- Final H1: `Format text for a teleprompter with AI.`
- Final product sentence: `TPS Agent is an AI teleprompter script formatter.`
- Conversion intent: the visitor already has text and wants it formatted for spoken delivery, not written or rewritten.
- Supporting coverage: speeches, video scripts, presentations, demos, lessons, webinars, podcasts, voice-over, dialogue, and multiple speakers.
- Decision content: a four-step workflow, TPS-versus-plain-text/subtitle comparison, format explanation, lossless boundary, compatible tools, MCP connection, and concise FAQs.
- Structured data: one truthful `WebApplication` entity and one FAQ page matching visible answers.
- Social preview: use Prostir's canonical `/social-preview.png`; the published Agent brand identity is the source for the automatically generated 1200×630 image.

### Superseded early English exploration

- Title: `TPS AI Agent: Format Text for a Teleprompter | Managed Code`
- Meta description: `Turn speeches, presentations, video scripts, lessons, podcasts, and voice-over copy into structured TPS teleprompter scripts—without rewriting your words.`
- H1: `Your script, ready for the teleprompter.`
- Lead: `Paste a finished speech, presentation, video script, lesson, podcast, or voice-over. TPS Agent adds teleprompter structure, pacing, pauses, emotion, emphasis, and speaker cues—then returns a valid .tps file without rewriting your text.`
- Primary action: `Copy agent endpoint`
- Secondary action: `Read the TPS standard`
- Proof heading: `From finished copy to a structured TPS script`
- Boundary heading: `Formatting, not rewriting.`
- Boundary copy: `Your text is the source of truth. TPS Agent does not rewrite, translate, correct, summarize, or reorder it. Remove the TPS markup and the original words, punctuation, language, and order remain.`
- TPS heading: `What is TPS?`
- TPS definition: `TPS (TelePrompterScript) is an open, Markdown-based file format for teleprompter scripts. It keeps scripts readable in any text editor while giving compatible teleprompter software structured pace, timing, pauses, emotion, emphasis, and speaker cues.`
- Attribution: `TPS is an open format by Managed Code.`

### Superseded early Ukrainian exploration

- H1: `Ваш сценарій, готовий до телесуфлера.`
- Lead: `Вставте готову промову, презентацію, відеосценарій, урок, подкаст або текст для озвучення. TPS Agent додає структуру телесуфлера, темп, паузи, емоції, акценти й репліки спікерів — і повертає валідний .tps-файл, не переписуючи ваш текст.`
- Primary action: `Скопіювати endpoint агента`
- Secondary action: `Відкрити стандарт TPS`
- Proof heading: `Від готового тексту до структурованого TPS-сценарію`
- Boundary heading: `Форматування, а не переписування.`
- Boundary copy: `Ваш текст — єдине джерело правди. TPS Agent не переписує, не перекладає, не виправляє, не скорочує й не змінює його порядок. Приберіть TPS-розмітку — оригінальні слова, пунктуація, мова та послідовність залишаться.`
- TPS heading: `Що таке TPS?`
- TPS definition: `TPS (TelePrompterScript) — це відкритий формат сценаріїв для телесуфлера на основі Markdown. Текст залишається читабельним у будь-якому редакторі, а сумісні телесуфлери отримують структуровані дані про темп, таймінг, паузи, емоції, акценти та спікерів.`
- Attribution: `TPS — відкритий формат від Managed Code.`

## Exploration boundary

Create three materially different compositions grounded in the live Managed Code and TPS sites. Vary hierarchy and page rhythm, not the product truth or brand language. Select one visual target before implementation.

## Verification expectations

- Compare the chosen implementation visually with the selected concept at matching viewport sizes.
- Verify desktop and mobile layout, EN/UA switching, outbound links, endpoint copying, keyboard focus, console output, and live publication.
- Confirm the published HTML matches the checked-in source.

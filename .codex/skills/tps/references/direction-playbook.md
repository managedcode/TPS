# TPS direction playbook

Use this reference only when the user has not completely specified delivery. Infer performance from the existing copy without changing it.

## Rhetorical job to archetype

Choose an archetype for a sustained speaker job, normally at a segment boundary.

| Listener need | Speaker job | Archetype | Typical direction |
| --- | --- | --- | --- |
| “Can I trust you?” | connect | `Friend` | warm, conversational, legato, natural pauses |
| “Why should I care?” | create purpose or stakes | `Motivator` | higher energy, broader melody, projected volume |
| “What do I need to understand?” | explain facts or concepts | `Educator` | slower pace, clear phrasing, processing pauses |
| “What should I do?” | instruct or decide | `Coach` | short beats, staccato, strong emphasis, sharp pauses |
| “What happened?” | narrate a journey or scene | `Storyteller` | expressive melody, variable pace, dramatic silence |
| “Will you keep my attention?” | delight or perform | `Entertainer` | playful timing, contrast, expressive energy |

A common long-form sequence is Friend → Motivator → Educator → Coach → Friend. Use it only when the copy actually makes those moves. Do not force every script into it.

## Segment and block boundaries

Create a segment when one of these changes persists:

- communicative intent;
- major topic;
- time or scene;
- primary speaker;
- emotional baseline;
- audience task.

Create a block for a subtopic, example, list, question/answer beat, proof point, or speaker turn inside a stable segment.

Do not switch archetype sentence by sentence. A local change in intensity belongs in an inline tag.

## Emotion selection

Use emotion for the intended delivery, not merely for words that name an emotion.

- `neutral`: uncolored baseline.
- `warm`: welcome, rapport, reassurance.
- `professional`: formal authority.
- `focused`: precision, decisions, instructions.
- `concerned`: risk, empathy, caution.
- `urgent`: immediate high-stakes action.
- `motivational`: purpose and encouragement.
- `excited`: discovery or launch energy.
- `happy`: joy and positive outcome.
- `sad`: grief or sober reflection.
- `calm`: de-escalation and steadiness.
- `energetic`: dynamic momentum without necessarily being emotional.

Prefer one inherited emotion per stable beat. Use an inline emotion only for a genuine short shift.

## Delivery curves

Treat delivery parameters as independent curves over the same text.

- Speed controls time, not importance.
- Melody controls pitch variation, not volume.
- Volume controls projection, not energy.
- Energy controls physical and vocal intensity, not speed.
- Articulation controls how connected or separated words feel.
- Pauses control silence and processing time.

A passage can be slow and loud, fast and flat, soft and high-energy, or calm with long pauses. Do not mechanically couple every parameter.

## Sparse annotation budget

Direction should remain readable at performance speed.

- Prefer header inheritance for the baseline.
- Add inline tags only at meaningful local departures.
- Emphasize the few words that carry contrast, decision, or reveal.
- Use a breath in genuinely long phrasing, not after every sentence.
- Use explicit pauses where silence changes comprehension or impact.
- Avoid stacking more than three wrapper cues on a short phrase unless the user explicitly asks for dense direction.
- Avoid highlighting more than roughly ten percent of the copy.

## Timing and WPM

Estimate spoken time from word count and WPM, then add explicit pauses. Never delete or rewrite copy to hit a target.

- 110-130 WPM: careful teaching, complex material, reflective narration.
- 130-150 WPM: ordinary presentation and conversational delivery.
- 150-170 WPM: energized pitch, short transitions, familiar material.
- 80-109 or 171-220 WPM: deliberate special effect; use sparingly.

If an archetype supplies the intended baseline, omit redundant explicit WPM unless the user gives a target.

## Multi-speaker copy

- Preserve speaker labels exactly as source text.
- Add `Speaker:Name` only when the identity is explicit.
- Use a block for each turn when that improves teleprompter navigation.
- Do not convert an ambiguous colon phrase into a speaker label.
- Do not invent off-screen narrators or roles.

## User request mapping

- “Make it calmer” → apply calm delivery metadata; keep words unchanged.
- “Slow down the legal part” → use block or inline speed direction around that exact existing span.
- “Two speakers” → use supplied identities; ask if speaker ownership is not clear.
- “Fit 60 seconds” → calculate whether valid WPM and pauses can meet it; never cut.
- “Fix the grammar and make TPS” → explain that this agent does lossless markup and ask for final approved copy.
- “Just convert it” → infer conservatively and return the TPS without an approval round.

## Final restraint test

For every inline cue, ask: would a performer change delivery here if the tag were visible? If not, remove the tag. For every segment or block, ask: does it represent a real navigation or intent boundary? If not, keep the inherited structure.

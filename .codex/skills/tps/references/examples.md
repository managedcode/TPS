# Lossless TPS examples

These examples demonstrate invariants, not a mandatory style.

## Short Ukrainian copy

Source:

```text
Ми починаємо зараз. Не завтра — зараз.
```

Valid direction:

```tps
---
profile: Actor
base_wpm: 140
---
## [Opening|focused|Archetype:Coach]
[staccato]Ми починаємо [emphasis]зараз[/emphasis]. [pause:600ms]Не завтра — зараз.[/staccato]
```

Removing front matter, the generated header, wrappers, and pause recovers the exact source.

## Speaker labels remain copy

Source:

```text
Олена: Готові?
Марко: Так. Починай.
```

Valid direction:

```tps
---
profile: Actor
base_wpm: 140
---
## [Dialogue|warm|Archetype:Friend]
### [Question|Speaker:Олена]
Олена: Готові?
### [Answer|Speaker:Марко]
Марко: Так. [pause:300ms]Починай.
```

Do not remove `Олена:` or `Марко:` from the spoken copy merely because the headers carry speaker metadata.

## Literal TPS-looking syntax

Source:

```text
Open https://example.com/a/b and type [warm] *now*.
```

Lossless serialization must escape literals that the parser could treat as direction:

```tps
---
profile: Actor
base_wpm: 140
---
## [Instruction|focused|Archetype:Coach]
Open https:\/\/example.com\/a\/b and type \[warm\] \*now\*.
```

Decoding the escapes recovers the exact URL, brackets, and asterisks.

## Impossible duration

When 350 source words must fit 30 seconds, do not cut or rewrite. The required 700 WPM is invalid. Ask whether to change the target duration or provide revised final copy.

## Prohibited output

Source: `Це важливо.`

Invalid: `Це надзвичайно важливо!`

The change adds a word and alters punctuation. Richer direction must be expressed through TPS syntax around `Це важливо.` instead.

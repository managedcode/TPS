# ManagedCode.Tps TypeScript SDK

This folder contains the canonical TPS implementation.

## Public API

- `TpsSpec`
- `TpsKeywords`
- `validateTps(source)`
- `parseTps(source)`
- `compileTps(source)`
- `TpsPlayer`

## Responsibilities

- define the runtime contract for TPS in typed source form
- own validation, parser, compiler, and player behavior
- emit the JavaScript runtime in `SDK/js/lib`

## Source Map

- `src/constants.ts`: TPS constants catalog
- `src/parser.ts`: markdown/front-matter/header parsing
- `src/content-compiler.ts`: inline tags, timings, word metadata
- `src/compiler.ts`: document-to-state-machine compilation
- `src/player.ts`: phrase/word presentation model

## Verification

- `npm run build:tps`
- `npm run test:types`

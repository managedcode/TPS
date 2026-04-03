# ManagedCode.Tps SDK

`SDK/` is the runtime workspace for TPS.

## Layout

- `ts/`: canonical TPS source implementation
- `js/`: emitted JS runtime, JS-facing tests, and the JS-local package
- `dotnet/`: .NET runtime, solution, and xUnit tests
- `fixtures/`: shared TPS fixtures and runtime expectations
- `docs/`: SDK architecture and ADRs
- `manifest.json`: enabled runtimes plus CI commands

## Common Contract

Every active runtime must provide:

- a constants catalog for TPS keywords, tags, metadata keys, emotions, and diagnostics
- TPS validation with actionable diagnostics
- TPS parsing into a document model
- TPS compilation into a JSON-friendly state machine
- a player API that resolves the current presentation model from compiled data

## Compiled Model

The compiled TPS state machine is organized as:

1. metadata
2. segments
3. blocks
4. phrases
5. words

Each compiled word carries timing plus authoring-derived metadata such as emphasis, emotion hint, speed override, pronunciation, volume, delivery mode, and edit-point markers.

## Verification

- TypeScript: `npm --prefix SDK/js run test:types`
- JavaScript: `npm --prefix SDK/js run coverage:js`
- C#: `dotnet test SDK/dotnet/ManagedCode.Tps.slnx /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`

GitHub Actions reads `SDK/manifest.json`, builds the enabled runtimes, runs their tests, and enforces a minimum runtime coverage gate of 90%.

## GitHub Pipelines

- `.github/workflows/ci.yml`: build and test pipeline
- `.github/workflows/coverage.yml`: separate coverage pipeline with the `>= 90%` gates

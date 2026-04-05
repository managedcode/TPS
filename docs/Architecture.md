# ManagedCode.Tps Architecture

## Overview

This repository currently has three delivery surfaces:

1. A static TPS documentation site built with Node.js.
2. An SDK workspace under `SDK/` for TypeScript, JavaScript, C#, Flutter, Swift, and Java runtimes.
3. A .NET solution rooted at `SDK/dotnet/ManagedCode.Tps.slnx` for the C# SDK projects.

```mermaid
flowchart LR
  Readme["README.md + examples/*.tps"] --> SiteBuild["npm run build"]
  Website["website/ + public/"] --> SiteBuild
  BuildScript["scripts/build-site.mjs"] --> SiteBuild
  SiteBuild --> Dist["dist/ static site output"]

  Fixtures["SDK/fixtures + SDK/manifest.json"] --> CsRuntime["SDK/dotnet"]
  Fixtures --> TsRuntime["SDK/ts"]
  TsRuntime --> JsRuntime["SDK/js"]
  Fixtures --> FlutterRuntime["SDK/flutter"]
  Fixtures --> SwiftRuntime["SDK/swift"]
  Fixtures --> JavaRuntime["SDK/java"]

  Solution["SDK/dotnet/ManagedCode.Tps.slnx"] --> Runtime["ManagedCode.Tps"]
  Solution --> Tests["ManagedCode.Tps.Tests"]
  Tests --> Runtime
```

## Repository Boundaries

- The site surface owns documentation publishing and static example rendering.
- `SDK/` owns runtime implementations, shared fixtures, manifest-driven verification metadata, and SDK-focused docs.
- `ManagedCode.Tps` is the C# SDK implementation area for TPS parsing, validation, compilation, and playback logic.
- `ManagedCode.Tps.Tests` owns xUnit-based verification for the C# runtime.
- `.codex/skills/` holds repo-local MCAF and .NET companion skills used by Codex.

## Canonical .NET Layout

The `.NET` runtime is the canonical TPS implementation. Other runtimes should mirror its responsibility split where practical:

- `TpsSpec*.cs`: public constants, catalogs, and archetype profiles
- `Models/*Contracts.cs`: public transport and runtime models
- `Internal/TpsParser*.cs`: front matter, headers, segments, and parser models
- `Internal/TpsContentCompiler*.cs`: inline tag handling, tokenization, and compiler models
- `Internal/TpsArchetypeAnalyzer*.cs`: advisory archetype and rhythm diagnostics
- `TpsRuntime*.cs`: compile pipeline and canonical state-machine construction
- `TpsPlayer.cs`: deterministic state resolver
- `TpsPlaybackSession*.cs`: live playback transport, snapshot math, runtime loop, and event dispatch

```mermaid
flowchart LR
  Spec["TpsSpec*.cs"] --> Runtime["TpsRuntime*.cs"]
  Contracts["Models/*Contracts.cs"] --> Runtime
  Parser["Internal/TpsParser*.cs"] --> Runtime
  Compiler["Internal/TpsContentCompiler*.cs"] --> Runtime
  Archetypes["Internal/TpsArchetypeAnalyzer*.cs"] --> Runtime
  Runtime --> Player["TpsPlayer.cs"]
  Player --> Session["TpsPlaybackSession*.cs"]
```

```mermaid
flowchart TD
  Root["Repository Root"] --> Docs["docs/ + AGENTS.md"]
  Root --> Skills[".codex/skills"]
  Root --> Site["Node documentation surface"]
  Root --> Sdk["SDK/"]

  Sdk --> Ts["TypeScript source"]
  Sdk --> Js["JavaScript runtime workspace"]
  Sdk --> Cs["dotnet runtime"]
  Sdk --> Shared["fixtures + docs + manifest"]

  Cs --> Runtime["ManagedCode.Tps"]
  Cs --> TestProject["ManagedCode.Tps.Tests"]
  TestProject -. verifies .-> Runtime
```

## Verification Flow

- Site changes: run `npm run build`.
- SDK JS/TS changes: run `npm run build:tps`, `npm run test:types`, and `npm run coverage:js`.
- .NET changes: run `dotnet format SDK/dotnet/ManagedCode.Tps.slnx --verify-no-changes`, `dotnet build SDK/dotnet/ManagedCode.Tps.slnx -warnaserror`, and `dotnet test SDK/dotnet/ManagedCode.Tps.slnx`.
- Coverage checks use `dotnet test SDK/dotnet/ManagedCode.Tps.slnx /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`.

# ManagedCode.Tps .NET SDK

This folder contains the .NET TPS runtime under the `ManagedCode.Tps` namespace.

## Public API

- `TpsSpec`: TPS constants, tags, metadata keys, emotions, diagnostics, and palettes
- `TpsRuntime.Validate(source)`
- `TpsRuntime.Parse(source)`
- `TpsRuntime.Compile(source)`
- `TpsPlayer`

## Project Layout

- `src/ManagedCode.Tps/`: runtime implementation
- `tests/ManagedCode.Tps.Tests/`: xUnit coverage and parity tests

## Contract Notes

- validation returns actionable `TpsDiagnostic` entries with exact ranges
- parse returns the TPS document model with segments and blocks
- compile returns the fully timed state machine with compiled words, phrases, blocks, and segments
- player resolves the current presentation model for any elapsed timestamp

## Verification

- `dotnet build ManagedCode.Tps.slnx -warnaserror --no-restore`
- `dotnet test ManagedCode.Tps.slnx --no-build --no-restore /p:CollectCoverage=true /p:CoverletOutputFormat=json /p:ThresholdType=line%2Cbranch%2Cmethod /p:Threshold=90`

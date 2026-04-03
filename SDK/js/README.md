# ManagedCode.Tps JavaScript SDK

This folder exposes the JavaScript-consumable TPS runtime built from the TypeScript source.

Package identity: `managedcode.tps`

## Public API

Imports come from `SDK/js/lib/index.js` and mirror the TS contract:

- `TpsSpec`
- `TpsKeywords`
- `validateTps(source)`
- `parseTps(source)`
- `compileTps(source)`
- `TpsPlayer`

## Notes

- `lib/` is generated output and should stay aligned with `SDK/ts/src/`
- JS tests must execute the built runtime, not the TS source, to verify real consumer behavior

## Verification

- `npm run build:tps`
- `npm run coverage:js`

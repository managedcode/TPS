# ManagedCode.Tps JavaScript SDK

[![SDK JavaScript](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript.yml)
[![SDK JavaScript Coverage](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml/badge.svg?branch=main)](https://github.com/managedcode/TPS/actions/workflows/sdk-javascript-coverage.yml)

This folder exposes the JavaScript-consumable TPS runtime built from the TypeScript source.

Package identity: `managedcode.tps`

## What This Project Is

`SDK/js` is the consumer-facing JavaScript runtime package. It contains the built `lib/` output, Node test entry points, and package metadata for the JS distribution.

If you want to change TPS behavior, edit `SDK/ts` first. Change `SDK/js` directly only when the work is package-specific, test-specific, or distribution-specific.

## Public API

Imports come from `SDK/js/lib/index.js` and mirror the TS contract:

- `TpsSpec`
- `TpsKeywords`
- `validateTps(source)`
- `parseTps(source)`
- `compileTps(source)`
- `TpsPlayer`

## Technical Structure

- `lib/` is generated output and should stay aligned with `SDK/ts/src/`
- `tests/node/` validates the built JavaScript runtime, not the TS source
- `package.json` defines exports, entry points, and verification commands

## How To Work With This Project

1. Rebuild `lib/` whenever TypeScript source changes.
2. Run JS tests against the built artifact.
3. Run coverage when changing runtime behavior or JS-facing tests.

## Local Commands

- `npm --prefix SDK/js run build:tps`
- `npm --prefix SDK/js run test:js`
- `npm --prefix SDK/js run coverage:js`

## When To Edit This Folder

- change `package.json`, exports, or JS-specific tests here
- change TPS runtime logic in `SDK/ts`, then rebuild this folder

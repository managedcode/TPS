import { compileTps, parseTps, TpsPlayer, TpsSpec, type CompiledScript, type PlayerState } from "../../src/index.js";

const compiled = compileTps("## [Signal|focused]\n### [Body]\nReady.");
const parsed = parseTps("## [Signal|focused]\n### [Body]\nReady.");

if (!compiled.script) {
  throw new Error("Expected a compiled script.");
}

const script: CompiledScript = compiled.script;
const player = new TpsPlayer(script);
const state: PlayerState = player.getState(0);

void parsed.document;
void state.presentation.visibleWords;
void TpsSpec.defaultBaseWpm;

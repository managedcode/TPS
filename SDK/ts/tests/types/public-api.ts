import {
  compileTps,
  parseTps,
  TpsPlaybackSession,
  TpsStandalonePlayer,
  TpsPlayer,
  TpsSpec,
  type CompiledScript,
  type TpsPlaybackSnapshot,
  type PlayerState,
  type TpsPlaybackStatus
} from "../../src/index.js";

const compiled = compileTps("## [Signal|focused]\n### [Body]\nReady.");
const parsed = parseTps("## [Signal|focused]\n### [Body]\nReady.");
const script: CompiledScript = compiled.script;
const player = new TpsPlayer(script);
const session = new TpsPlaybackSession(script);
const standalone = TpsStandalonePlayer.compile("## [Signal]\n### [Body]\nReady.");
const state: PlayerState = player.getState(0);
const frames: PlayerState[] = Array.from(player.enumerateStates(100));
const status: TpsPlaybackStatus = session.status;
const snapshot: TpsPlaybackSnapshot = session.snapshot;

void parsed.document;
void state.presentation.visibleWords;
void frames;
void session.play;
void session.observeSnapshot;
void session.nextWord;
void session.nextBlock;
void session.setSpeedOffsetWpm;
void standalone.on;
void standalone.observeSnapshot;
void standalone.advanceBy;
void standalone.snapshot;
void standalone.status;
void standalone.currentState;
void TpsStandalonePlayer.fromCompiledScript(script);
void TpsStandalonePlayer.fromCompiledJson(JSON.stringify(script));
void status;
void snapshot.focusedWord;
void TpsSpec.defaultBaseWpm;

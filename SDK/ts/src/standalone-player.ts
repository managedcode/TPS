import { normalizeCompiledScript, parseCompiledScriptJson } from "./compiled-script.js";
import type {
  CompiledScript,
  PlayerState,
  TpsCompilationResult,
  TpsPlaybackEventMap,
  TpsPlaybackEventName,
  TpsPlaybackSnapshot,
  TpsPlaybackSnapshotChangedEvent,
  TpsPlaybackStatus,
  TpsStandalonePlayerOptions
} from "./models.js";
import { compileTps } from "./compiler.js";
import { TpsPlaybackEventNames } from "./constants.js";
import { TpsPlaybackSession } from "./playback-session.js";

export class TpsStandalonePlayer {
  public readonly diagnostics: TpsCompilationResult["diagnostics"];

  public readonly document: TpsCompilationResult["document"] | undefined;

  public readonly ok: boolean;

  public readonly script: CompiledScript;

  public readonly session: TpsPlaybackSession;

  public constructor(compilationOrScript: TpsCompilationResult | CompiledScript, options: TpsStandalonePlayerOptions = {}) {
    if (isCompilationResult(compilationOrScript)) {
      const normalizedScript = normalizeCompiledScript(compilationOrScript.script);
      this.ok = compilationOrScript.ok;
      this.diagnostics = compilationOrScript.diagnostics;
      this.document = compilationOrScript.document;
      this.script = normalizedScript;
    } else {
      const normalizedScript = normalizeCompiledScript(compilationOrScript);
      this.ok = true;
      this.diagnostics = [];
      this.script = normalizedScript;
    }

    this.session = new TpsPlaybackSession(this.script, options);
    if (options.autoPlay) {
      this.session.play();
    }
  }

  public static compile(source: string, options: TpsStandalonePlayerOptions = {}): TpsStandalonePlayer {
    return new TpsStandalonePlayer(compileTps(source), options);
  }

  public static fromCompiledScript(script: CompiledScript, options: TpsStandalonePlayerOptions = {}): TpsStandalonePlayer {
    return new TpsStandalonePlayer(script, options);
  }

  public static fromCompiledJson(json: string, options: TpsStandalonePlayerOptions = {}): TpsStandalonePlayer {
    return new TpsStandalonePlayer(parseCompiledScriptJson(json), options);
  }

  public get currentState(): PlayerState {
    return this.session.currentState;
  }

  public get isPlaying(): boolean {
    return this.session.isPlaying;
  }

  public get snapshot(): TpsPlaybackSnapshot {
    return this.session.snapshot;
  }

  public get status(): TpsPlaybackStatus {
    return this.session.status;
  }

  public on<K extends TpsPlaybackEventName>(eventName: K, listener: (event: TpsPlaybackEventMap[K]) => void): () => void {
    return this.session.on(eventName, listener);
  }

  public off<K extends TpsPlaybackEventName>(eventName: K, listener: (event: TpsPlaybackEventMap[K]) => void): void {
    this.session.off(eventName, listener);
  }

  public onSnapshotChanged(listener: (snapshot: TpsPlaybackSnapshot) => void): () => void {
    return this.session.on(TpsPlaybackEventNames.snapshotChanged, (event: TpsPlaybackSnapshotChangedEvent) => listener(event.snapshot));
  }

  public observeSnapshot(listener: (snapshot: TpsPlaybackSnapshot) => void, emitCurrent = true): () => void {
    return this.session.observeSnapshot(listener, emitCurrent);
  }

  public play() {
    return this.session.play();
  }

  public pause() {
    return this.session.pause();
  }

  public stop() {
    return this.session.stop();
  }

  public seek(elapsedMs: number) {
    return this.session.seek(elapsedMs);
  }

  public advanceBy(deltaMs: number) {
    return this.session.advanceBy(deltaMs);
  }

  public nextWord() {
    return this.session.nextWord();
  }

  public previousWord() {
    return this.session.previousWord();
  }

  public nextBlock() {
    return this.session.nextBlock();
  }

  public previousBlock() {
    return this.session.previousBlock();
  }

  public increaseSpeed(stepWpm?: number) {
    return this.session.increaseSpeed(stepWpm);
  }

  public decreaseSpeed(stepWpm?: number) {
    return this.session.decreaseSpeed(stepWpm);
  }

  public setSpeedOffsetWpm(offsetWpm: number) {
    return this.session.setSpeedOffsetWpm(offsetWpm);
  }

  public dispose(): void {
    this.session.dispose();
  }
}

function isCompilationResult(value: TpsCompilationResult | CompiledScript): value is TpsCompilationResult {
  return "script" in value && "document" in value && "diagnostics" in value;
}

import { normalizeCompiledScript, parseCompiledScriptJson } from "./compiled-script.js";
import { compileTps } from "./compiler.js";
import { TpsPlaybackSession } from "./playback-session.js";
export class TpsStandalonePlayer {
    diagnostics;
    document;
    ok;
    script;
    session;
    constructor(compilationOrScript, options = {}) {
        if (isCompilationResult(compilationOrScript)) {
            const normalizedScript = normalizeCompiledScript(compilationOrScript.script);
            this.ok = compilationOrScript.ok;
            this.diagnostics = compilationOrScript.diagnostics;
            this.document = compilationOrScript.document;
            this.script = normalizedScript;
        }
        else {
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
    static compile(source, options = {}) {
        return new TpsStandalonePlayer(compileTps(source), options);
    }
    static fromCompiledScript(script, options = {}) {
        return new TpsStandalonePlayer(script, options);
    }
    static fromCompiledJson(json, options = {}) {
        return new TpsStandalonePlayer(parseCompiledScriptJson(json), options);
    }
    get currentState() {
        return this.session.currentState;
    }
    get isPlaying() {
        return this.session.isPlaying;
    }
    get snapshot() {
        return this.session.snapshot;
    }
    get status() {
        return this.session.status;
    }
    on(eventName, listener) {
        return this.session.on(eventName, listener);
    }
    off(eventName, listener) {
        this.session.off(eventName, listener);
    }
    onSnapshotChanged(listener) {
        return this.session.on("snapshotChanged", (event) => listener(event.snapshot));
    }
    observeSnapshot(listener, emitCurrent = true) {
        return this.session.observeSnapshot(listener, emitCurrent);
    }
    play() {
        return this.session.play();
    }
    pause() {
        return this.session.pause();
    }
    stop() {
        return this.session.stop();
    }
    seek(elapsedMs) {
        return this.session.seek(elapsedMs);
    }
    advanceBy(deltaMs) {
        return this.session.advanceBy(deltaMs);
    }
    nextWord() {
        return this.session.nextWord();
    }
    previousWord() {
        return this.session.previousWord();
    }
    nextBlock() {
        return this.session.nextBlock();
    }
    previousBlock() {
        return this.session.previousBlock();
    }
    increaseSpeed(stepWpm) {
        return this.session.increaseSpeed(stepWpm);
    }
    decreaseSpeed(stepWpm) {
        return this.session.decreaseSpeed(stepWpm);
    }
    setSpeedOffsetWpm(offsetWpm) {
        return this.session.setSpeedOffsetWpm(offsetWpm);
    }
    dispose() {
        this.session.dispose();
    }
}
function isCompilationResult(value) {
    return "script" in value && "document" in value && "diagnostics" in value;
}
//# sourceMappingURL=standalone-player.js.map
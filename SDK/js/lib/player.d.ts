import type { CompiledScript, PlayerState } from "./models.js";
export declare class TpsPlayer {
    private readonly blockById;
    private readonly compiledScript;
    private readonly phraseById;
    private readonly segmentById;
    constructor(compiledScript: CompiledScript);
    get script(): CompiledScript;
    getState(elapsedMs: number): PlayerState;
    seek(elapsedMs: number): PlayerState;
    enumerateStates(stepMs?: number): IterableIterator<PlayerState>;
    private findCurrentWord;
}

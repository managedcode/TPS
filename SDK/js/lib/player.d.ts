import type { CompiledScript, PlayerState } from "./models.js";
export declare class TpsPlayer {
    private readonly script;
    constructor(script: CompiledScript);
    getState(elapsedMs: number): PlayerState;
    seek(elapsedMs: number): PlayerState;
    private findCurrentWord;
}

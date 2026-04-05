import type { CompiledWord, TpsDiagnostic } from "./models.js";
export interface InheritedFormattingState {
    targetWpm: number;
    emotion: string;
    speaker?: string;
    archetype?: string;
    speedOffsets: Record<string, number>;
}
export interface ContentCompilationResult {
    words: WordSeed[];
    phrases: PhraseSeed[];
}
export interface PhraseSeed {
    words: WordSeed[];
    text: string;
}
export type WordSeed = Omit<CompiledWord, "id" | "index" | "startMs" | "endMs" | "segmentId" | "blockId" | "phraseId">;
export declare function compileContent(rawText: string, startOffset: number, inherited: InheritedFormattingState, lineStarts: number[], diagnostics: TpsDiagnostic[]): ContentCompilationResult;

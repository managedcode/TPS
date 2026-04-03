export type TpsSeverity = "error" | "warning" | "info";
export interface TpsPosition {
    line: number;
    column: number;
    offset: number;
}
export interface TpsRange {
    start: TpsPosition;
    end: TpsPosition;
}
export interface TpsDiagnostic {
    code: string;
    severity: TpsSeverity;
    message: string;
    suggestion?: string | undefined;
    range: TpsRange;
}
export interface TpsValidationResult {
    ok: boolean;
    diagnostics: TpsDiagnostic[];
}
export interface TpsParseResult extends TpsValidationResult {
    document: TpsDocument;
}
export interface TpsCompilationResult extends TpsValidationResult {
    document: TpsDocument;
    script?: CompiledScript;
}
export interface TpsDocument {
    metadata: Record<string, string>;
    segments: TpsSegment[];
}
export interface TpsSegment {
    id: string;
    name: string;
    content: string;
    targetWpm?: number | undefined;
    emotion?: string | undefined;
    speaker?: string | undefined;
    timing?: string | undefined;
    backgroundColor?: string | undefined;
    textColor?: string | undefined;
    accentColor?: string | undefined;
    leadingContent?: string | undefined;
    blocks: TpsBlock[];
}
export interface TpsBlock {
    id: string;
    name: string;
    content: string;
    targetWpm?: number | undefined;
    emotion?: string | undefined;
    speaker?: string | undefined;
}
export interface WordMetadata {
    isEmphasis: boolean;
    emphasisLevel: number;
    isPause: boolean;
    pauseDurationMs?: number | undefined;
    isHighlight: boolean;
    isBreath: boolean;
    isEditPoint: boolean;
    editPointPriority?: string | undefined;
    emotionHint?: string | undefined;
    inlineEmotionHint?: string | undefined;
    volumeLevel?: string | undefined;
    deliveryMode?: string | undefined;
    phoneticGuide?: string | undefined;
    pronunciationGuide?: string | undefined;
    stressText?: string | undefined;
    stressGuide?: string | undefined;
    speedOverride?: number | undefined;
    speedMultiplier?: number | undefined;
    speaker?: string | undefined;
    headCue?: string | undefined;
}
export type CompiledWordKind = "word" | "pause" | "breath" | "edit-point";
export interface CompiledWord {
    id: string;
    index: number;
    kind: CompiledWordKind;
    cleanText: string;
    characterCount: number;
    orpPosition: number;
    displayDurationMs: number;
    startMs: number;
    endMs: number;
    metadata: WordMetadata;
    segmentId: string;
    blockId: string;
    phraseId: string;
}
export interface CompiledPhrase {
    id: string;
    text: string;
    startWordIndex: number;
    endWordIndex: number;
    startMs: number;
    endMs: number;
    words: CompiledWord[];
}
export interface CompiledBlock {
    id: string;
    name: string;
    targetWpm: number;
    emotion: string;
    speaker?: string | undefined;
    isImplicit: boolean;
    startWordIndex: number;
    endWordIndex: number;
    startMs: number;
    endMs: number;
    phrases: CompiledPhrase[];
    words: CompiledWord[];
}
export interface CompiledSegment {
    id: string;
    name: string;
    targetWpm: number;
    emotion: string;
    speaker?: string | undefined;
    timing?: string | undefined;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    startWordIndex: number;
    endWordIndex: number;
    startMs: number;
    endMs: number;
    blocks: CompiledBlock[];
    words: CompiledWord[];
}
export interface CompiledScript {
    metadata: Record<string, string>;
    totalDurationMs: number;
    segments: CompiledSegment[];
    words: CompiledWord[];
}
export interface PlayerPresentationModel {
    segmentName?: string | undefined;
    blockName?: string | undefined;
    phraseText?: string | undefined;
    visibleWords: CompiledWord[];
    activeWordInPhrase: number;
}
export interface PlayerState {
    elapsedMs: number;
    remainingMs: number;
    progress: number;
    isComplete: boolean;
    currentWordIndex: number;
    currentWord?: CompiledWord | undefined;
    previousWord?: CompiledWord | undefined;
    nextWord?: CompiledWord | undefined;
    currentSegment?: CompiledSegment | undefined;
    currentBlock?: CompiledBlock | undefined;
    currentPhrase?: CompiledPhrase | undefined;
    nextTransitionMs?: number | undefined;
    presentation: PlayerPresentationModel;
}

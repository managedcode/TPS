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
    script: CompiledScript;
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
export type TpsPlaybackStatus = "idle" | "playing" | "paused" | "completed";
export interface TpsPlaybackSessionOptions {
    tickIntervalMs?: number | undefined;
    baseWpm?: number | undefined;
    speedStepWpm?: number | undefined;
    initialSpeedOffsetWpm?: number | undefined;
}
export interface TpsPlaybackStateChangedEvent {
    state: PlayerState;
    previousState: PlayerState;
    status: TpsPlaybackStatus;
}
export interface TpsPlaybackStatusChangedEvent {
    state: PlayerState;
    previousStatus: TpsPlaybackStatus;
    status: TpsPlaybackStatus;
}
export interface TpsPlaybackTempo {
    baseWpm: number;
    effectiveBaseWpm: number;
    speedOffsetWpm: number;
    speedStepWpm: number;
    playbackRate: number;
}
export interface TpsPlaybackControls {
    canPlay: boolean;
    canPause: boolean;
    canStop: boolean;
    canNextWord: boolean;
    canPreviousWord: boolean;
    canNextBlock: boolean;
    canPreviousBlock: boolean;
    canIncreaseSpeed: boolean;
    canDecreaseSpeed: boolean;
}
export interface TpsPlaybackWordView {
    word: CompiledWord;
    isActive: boolean;
    isRead: boolean;
    isUpcoming: boolean;
    emotion: string;
    speaker?: string | undefined;
    emphasisLevel: number;
    isHighlighted: boolean;
    deliveryMode?: string | undefined;
    volumeLevel?: string | undefined;
}
export interface TpsPlaybackSnapshot {
    status: TpsPlaybackStatus;
    state: PlayerState;
    tempo: TpsPlaybackTempo;
    controls: TpsPlaybackControls;
    visibleWords: TpsPlaybackWordView[];
    focusedWord?: TpsPlaybackWordView | undefined;
    currentWordDurationMs?: number | undefined;
    currentWordRemainingMs?: number | undefined;
    currentSegmentIndex: number;
    currentBlockIndex: number;
}
export interface TpsPlaybackSnapshotChangedEvent {
    snapshot: TpsPlaybackSnapshot;
}
export interface TpsPlaybackEventMap {
    stateChanged: TpsPlaybackStateChangedEvent;
    wordChanged: TpsPlaybackStateChangedEvent;
    phraseChanged: TpsPlaybackStateChangedEvent;
    blockChanged: TpsPlaybackStateChangedEvent;
    segmentChanged: TpsPlaybackStateChangedEvent;
    statusChanged: TpsPlaybackStatusChangedEvent;
    completed: TpsPlaybackStateChangedEvent;
    snapshotChanged: TpsPlaybackSnapshotChangedEvent;
}
export type TpsPlaybackEventName = keyof TpsPlaybackEventMap;
export interface TpsStandalonePlayerOptions extends TpsPlaybackSessionOptions {
    autoPlay?: boolean | undefined;
}

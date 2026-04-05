import { TpsPlaybackDefaults, TpsPlaybackEventNames, TpsSpec } from "./constants.js";
import { resolveBaseWpm } from "./runtime-helpers.js";
import { TpsPlayer } from "./player.js";
export class TpsPlaybackSession {
    blockIndexById = new Map();
    blocks;
    listeners = {
        [TpsPlaybackEventNames.stateChanged]: new Set(),
        [TpsPlaybackEventNames.wordChanged]: new Set(),
        [TpsPlaybackEventNames.phraseChanged]: new Set(),
        [TpsPlaybackEventNames.blockChanged]: new Set(),
        [TpsPlaybackEventNames.segmentChanged]: new Set(),
        [TpsPlaybackEventNames.statusChanged]: new Set(),
        [TpsPlaybackEventNames.completed]: new Set(),
        [TpsPlaybackEventNames.snapshotChanged]: new Set()
    };
    now = resolveNow();
    segmentIndexById = new Map();
    tickIntervalMs;
    playbackOffsetMs = 0;
    playbackStartedAtMs = 0;
    speedOffsetWpm = 0;
    timer;
    baseWpm;
    player;
    speedStepWpm;
    currentState;
    status = "idle";
    constructor(scriptOrPlayer, options = {}) {
        this.player = scriptOrPlayer instanceof TpsPlayer ? scriptOrPlayer : new TpsPlayer(scriptOrPlayer);
        this.currentState = this.player.getState(0);
        this.tickIntervalMs = normalizeTickInterval(options.tickIntervalMs);
        this.baseWpm = normalizeBaseWpm(options.baseWpm ?? resolveBaseWpm(this.player.script.metadata));
        this.speedStepWpm = normalizeSpeedStep(options.speedStepWpm);
        this.speedOffsetWpm = normalizeSpeedOffset(this.baseWpm, options.initialSpeedOffsetWpm ?? 0);
        this.blocks = flattenBlocks(this.player.script);
        for (const [index, segment] of this.player.script.segments.entries()) {
            this.segmentIndexById.set(segment.id, index);
        }
        for (const [index, block] of this.blocks.entries()) {
            this.blockIndexById.set(block.id, index);
        }
    }
    get effectiveBaseWpm() {
        return clampWpm(this.baseWpm + this.speedOffsetWpm);
    }
    get isPlaying() {
        return this.status === "playing";
    }
    get playbackRate() {
        return this.baseWpm <= 0 ? 1 : this.effectiveBaseWpm / this.baseWpm;
    }
    get snapshot() {
        return this.createSnapshot();
    }
    get speedOffset() {
        return this.speedOffsetWpm;
    }
    on(eventName, listener) {
        this.listeners[eventName].add(listener);
        return () => this.off(eventName, listener);
    }
    off(eventName, listener) {
        this.listeners[eventName].delete(listener);
    }
    observeSnapshot(listener, emitCurrent = true) {
        const unsubscribe = this.on(TpsPlaybackEventNames.snapshotChanged, (event) => listener(event.snapshot));
        if (emitCurrent) {
            listener(this.snapshot);
        }
        return unsubscribe;
    }
    play() {
        if (this.status === "playing") {
            return this.currentState;
        }
        if (this.currentState.isComplete && this.player.script.totalDurationMs > 0) {
            this.seek(0);
        }
        if (this.player.script.totalDurationMs === 0) {
            return this.updatePosition(0, "completed");
        }
        this.playbackOffsetMs = this.currentState.elapsedMs;
        this.playbackStartedAtMs = this.now();
        this.clearTimer();
        this.updateStatus("playing");
        this.emitSnapshotChanged();
        this.scheduleNextTick();
        return this.currentState;
    }
    pause() {
        if (this.status !== "playing") {
            return this.currentState;
        }
        const state = this.updatePosition(this.readLiveElapsedMs(), "paused");
        this.clearTimer();
        return state;
    }
    stop() {
        this.clearTimer();
        this.playbackOffsetMs = 0;
        this.playbackStartedAtMs = 0;
        return this.updatePosition(0, "idle");
    }
    seek(elapsedMs) {
        if (!Number.isFinite(elapsedMs)) {
            throw new RangeError("elapsedMs must be a finite number.");
        }
        const nextStatus = this.status === "playing"
            ? "playing"
            : resolveStatusAfterSeek(this.status, this.player.script.totalDurationMs, elapsedMs);
        const state = this.updatePosition(elapsedMs, nextStatus);
        if (nextStatus === "playing") {
            this.playbackOffsetMs = state.elapsedMs;
            this.playbackStartedAtMs = this.now();
            this.clearTimer();
            this.scheduleNextTick();
        }
        return state;
    }
    advanceBy(deltaMs) {
        if (!Number.isFinite(deltaMs)) {
            throw new RangeError("deltaMs must be a finite number.");
        }
        return this.seek(this.currentState.elapsedMs + deltaMs);
    }
    nextWord() {
        const words = this.player.script.words;
        if (words.length === 0) {
            return this.currentState;
        }
        if (!this.currentState.currentWord) {
            return this.seek(words[0].startMs);
        }
        const nextIndex = Math.min(this.currentState.currentWord.index + 1, words.length - 1);
        return this.seek(words[nextIndex].startMs);
    }
    previousWord() {
        const words = this.player.script.words;
        if (words.length === 0) {
            return this.currentState;
        }
        const currentWord = this.currentState.currentWord;
        if (!currentWord) {
            return this.seek(0);
        }
        if (this.currentState.elapsedMs > currentWord.startMs) {
            return this.seek(currentWord.startMs);
        }
        const previousIndex = Math.max(0, currentWord.index - 1);
        return this.seek(words[previousIndex].startMs);
    }
    nextBlock() {
        if (this.blocks.length === 0) {
            return this.currentState;
        }
        const currentIndex = this.currentState.currentBlock ? this.blockIndexById.get(this.currentState.currentBlock.id) ?? -1 : -1;
        const nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, this.blocks.length - 1);
        return this.seek(this.blocks[nextIndex].startMs);
    }
    previousBlock() {
        if (this.blocks.length === 0) {
            return this.currentState;
        }
        const currentBlock = this.currentState.currentBlock;
        if (!currentBlock) {
            return this.seek(0);
        }
        const currentIndex = this.blockIndexById.get(currentBlock.id) ?? 0;
        if (this.currentState.elapsedMs > currentBlock.startMs) {
            return this.seek(currentBlock.startMs);
        }
        const previousIndex = Math.max(0, currentIndex - 1);
        return this.seek(this.blocks[previousIndex].startMs);
    }
    increaseSpeed(stepWpm = this.speedStepWpm) {
        return this.changeSpeedBy(stepWpm);
    }
    decreaseSpeed(stepWpm = this.speedStepWpm) {
        return this.changeSpeedBy(-stepWpm);
    }
    setSpeedOffsetWpm(offsetWpm) {
        if (!Number.isFinite(offsetWpm)) {
            throw new RangeError("offsetWpm must be a finite number.");
        }
        const normalized = normalizeSpeedOffset(this.baseWpm, offsetWpm);
        if (normalized === this.speedOffsetWpm) {
            return this.snapshot;
        }
        const elapsedMs = this.status === "playing" ? this.readLiveElapsedMs() : this.currentState.elapsedMs;
        this.speedOffsetWpm = normalized;
        const state = this.updatePosition(elapsedMs, this.status);
        if (this.status === "playing") {
            this.playbackOffsetMs = state.elapsedMs;
            this.playbackStartedAtMs = this.now();
            this.clearTimer();
            this.scheduleNextTick();
        }
        return this.snapshot;
    }
    createSnapshot() {
        const state = this.currentState;
        const visibleWords = (state.currentPhrase?.words ?? []).map((word) => createWordView(word, state));
        const currentWord = state.currentWord;
        const currentBlockIndex = state.currentBlock ? this.blockIndexById.get(state.currentBlock.id) ?? -1 : -1;
        const currentSegmentIndex = state.currentSegment ? this.segmentIndexById.get(state.currentSegment.id) ?? -1 : -1;
        const currentWordDurationMs = currentWord ? Math.max(1, Math.round(currentWord.displayDurationMs / this.playbackRate)) : undefined;
        const currentWordRemainingMs = currentWord
            ? Math.max(0, Math.round((currentWord.endMs - state.elapsedMs) / this.playbackRate))
            : undefined;
        return {
            status: this.status,
            state,
            tempo: {
                baseWpm: this.baseWpm,
                effectiveBaseWpm: this.effectiveBaseWpm,
                speedOffsetWpm: this.speedOffsetWpm,
                speedStepWpm: this.speedStepWpm,
                playbackRate: this.playbackRate
            },
            controls: this.createControls(currentBlockIndex),
            visibleWords,
            focusedWord: visibleWords.find((word) => word.isActive),
            currentWordDurationMs,
            currentWordRemainingMs,
            currentSegmentIndex,
            currentBlockIndex
        };
    }
    dispose() {
        this.clearTimer();
    }
    changeSpeedBy(deltaWpm) {
        if (!Number.isFinite(deltaWpm)) {
            throw new RangeError("deltaWpm must be a finite number.");
        }
        return this.setSpeedOffsetWpm(this.speedOffsetWpm + deltaWpm);
    }
    createControls(currentBlockIndex) {
        const wordCount = this.player.script.words.length;
        const currentWordIndex = this.currentState.currentWordIndex;
        const canRewindCurrentWord = !!this.currentState.currentWord && this.currentState.elapsedMs > this.currentState.currentWord.startMs;
        const canRewindCurrentBlock = !!this.currentState.currentBlock && this.currentState.elapsedMs > this.currentState.currentBlock.startMs;
        return {
            canPlay: this.status !== "playing",
            canPause: this.status === "playing",
            canStop: this.status !== "idle" || this.currentState.elapsedMs > 0,
            canNextWord: wordCount > 0 && (!this.currentState.currentWord || currentWordIndex < wordCount - 1),
            canPreviousWord: wordCount > 0 && (currentWordIndex > 0 || canRewindCurrentWord),
            canNextBlock: this.blocks.length > 0 && (!this.currentState.currentBlock || currentBlockIndex < this.blocks.length - 1),
            canPreviousBlock: this.blocks.length > 0 && (currentBlockIndex > 0 || canRewindCurrentBlock),
            canIncreaseSpeed: this.effectiveBaseWpm < TpsSpec.maximumWpm,
            canDecreaseSpeed: this.effectiveBaseWpm > TpsSpec.minimumWpm
        };
    }
    emit(eventName, event) {
        for (const listener of this.listeners[eventName]) {
            listener(event);
        }
    }
    emitSnapshotChanged() {
        this.emit(TpsPlaybackEventNames.snapshotChanged, { snapshot: this.createSnapshot() });
    }
    scheduleNextTick() {
        if (this.status !== "playing") {
            return;
        }
        this.timer = setTimeout(() => {
            const state = this.updatePosition(this.readLiveElapsedMs(), "playing");
            if (state.isComplete || this.status !== "playing") {
                this.clearTimer();
                return;
            }
            this.scheduleNextTick();
        }, this.tickIntervalMs);
    }
    readLiveElapsedMs() {
        const deltaMs = Math.max(0, this.now() - this.playbackStartedAtMs);
        return this.playbackOffsetMs + Math.max(0, Math.round(deltaMs * this.playbackRate));
    }
    updatePosition(elapsedMs, requestedStatus) {
        const previousState = this.currentState;
        const nextState = this.player.getState(elapsedMs);
        const nextStatus = requestedStatus === "playing" && nextState.isComplete
            ? "completed"
            : requestedStatus;
        this.currentState = nextState;
        this.updateStatus(nextStatus, nextState);
        if (hasStateChanged(previousState, nextState)) {
            const stateEvent = {
                state: nextState,
                previousState,
                status: this.status
            };
            this.emit(TpsPlaybackEventNames.stateChanged, stateEvent);
            if (previousState.currentWord?.id !== nextState.currentWord?.id) {
                this.emit(TpsPlaybackEventNames.wordChanged, stateEvent);
            }
            if (previousState.currentPhrase?.id !== nextState.currentPhrase?.id) {
                this.emit(TpsPlaybackEventNames.phraseChanged, stateEvent);
            }
            if (previousState.currentBlock?.id !== nextState.currentBlock?.id) {
                this.emit(TpsPlaybackEventNames.blockChanged, stateEvent);
            }
            if (previousState.currentSegment?.id !== nextState.currentSegment?.id) {
                this.emit(TpsPlaybackEventNames.segmentChanged, stateEvent);
            }
        }
        if (this.status === "completed" && !previousState.isComplete) {
            this.emit(TpsPlaybackEventNames.completed, {
                state: nextState,
                previousState,
                status: this.status
            });
        }
        this.emitSnapshotChanged();
        return nextState;
    }
    updateStatus(nextStatus, nextState = this.currentState) {
        const previousStatus = this.status;
        this.status = nextStatus;
        if (previousStatus === nextStatus) {
            return;
        }
        const event = {
            state: nextState,
            previousStatus,
            status: nextStatus
        };
        this.emit(TpsPlaybackEventNames.statusChanged, event);
        if (nextStatus !== "playing") {
            this.playbackOffsetMs = nextState.elapsedMs;
            this.playbackStartedAtMs = 0;
        }
        if (nextStatus === "completed" && previousStatus === "playing") {
            this.clearTimer();
        }
    }
    clearTimer() {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }
}
function clampWpm(value) {
    return Math.min(Math.max(Math.round(value), TpsSpec.minimumWpm), TpsSpec.maximumWpm);
}
function createWordView(word, state) {
    return {
        word,
        isActive: word.id === state.currentWord?.id,
        isRead: word.endMs <= state.elapsedMs,
        isUpcoming: word.startMs > state.elapsedMs,
        emotion: word.metadata.inlineEmotionHint ?? word.metadata.emotionHint ?? state.currentBlock?.emotion ?? state.currentSegment?.emotion ?? TpsSpec.defaultEmotion,
        speaker: word.metadata.speaker ?? state.currentBlock?.speaker ?? state.currentSegment?.speaker,
        emphasisLevel: word.metadata.emphasisLevel,
        isHighlighted: word.metadata.isHighlight,
        deliveryMode: word.metadata.deliveryMode,
        volumeLevel: word.metadata.volumeLevel
    };
}
function flattenBlocks(script) {
    return script.segments.flatMap((segment) => segment.blocks);
}
function hasStateChanged(previousState, nextState) {
    return previousState.elapsedMs !== nextState.elapsedMs
        || previousState.remainingMs !== nextState.remainingMs
        || previousState.progress !== nextState.progress
        || previousState.isComplete !== nextState.isComplete
        || previousState.currentWord?.id !== nextState.currentWord?.id
        || previousState.currentPhrase?.id !== nextState.currentPhrase?.id
        || previousState.currentBlock?.id !== nextState.currentBlock?.id
        || previousState.currentSegment?.id !== nextState.currentSegment?.id;
}
function normalizeBaseWpm(value) {
    if (!Number.isFinite(value)) {
        return TpsSpec.defaultBaseWpm;
    }
    return clampWpm(value);
}
function normalizeSpeedOffset(baseWpm, offsetWpm) {
    if (!Number.isFinite(offsetWpm)) {
        return 0;
    }
    return clampWpm(baseWpm + offsetWpm) - baseWpm;
}
function normalizeSpeedStep(value) {
    if (value === undefined) {
        return TpsPlaybackDefaults.defaultSpeedStepWpm;
    }
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError("speedStepWpm must be greater than 0.");
    }
    return Math.max(TpsPlaybackDefaults.minimumSpeedStepWpm, Math.round(value));
}
function normalizeTickInterval(value) {
    if (value === undefined) {
        return TpsPlaybackDefaults.defaultTickIntervalMs;
    }
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError("tickIntervalMs must be greater than 0.");
    }
    return Math.max(TpsPlaybackDefaults.minimumTickIntervalMs, Math.round(value));
}
function resolveStatusAfterSeek(previousStatus, totalDurationMs, elapsedMs) {
    if (totalDurationMs === 0 || elapsedMs >= totalDurationMs) {
        return "completed";
    }
    if (elapsedMs <= 0 && previousStatus === "idle") {
        return "idle";
    }
    return "paused";
}
function resolveNow() {
    const performanceNow = globalThis.performance?.now?.bind(globalThis.performance);
    return performanceNow ?? Date.now;
}
//# sourceMappingURL=playback-session.js.map
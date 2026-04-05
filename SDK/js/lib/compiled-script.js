export function normalizeCompiledScript(script) {
    validateCompiledScript(script);
    const words = script.words.map(cloneWord);
    const wordById = new Map(words.map((word) => [word.id, word]));
    const segments = script.segments.map((segment) => normalizeSegment(segment, wordById));
    return deepFreeze({
        metadata: deepFreeze({ ...script.metadata }),
        totalDurationMs: script.totalDurationMs,
        segments: freezeArray(segments),
        words: freezeArray(words)
    });
}
export function parseCompiledScriptJson(json) {
    if (!json.trim()) {
        throw new TypeError("Compiled TPS JSON must be a non-empty string.");
    }
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new TypeError("Compiled TPS JSON did not produce a script object.");
    }
    return normalizeCompiledScript(parsed);
}
export function validateCompiledScript(script) {
    assertObject(script, "Compiled TPS script must be an object.");
    assertArray(script.segments, "Compiled TPS script must expose a segments array.");
    assertArray(script.words, "Compiled TPS script must expose a words array.");
    assertRecord(script.metadata, "Compiled TPS script metadata must be an object.");
    assertInteger(script.totalDurationMs, "Compiled TPS script totalDurationMs must be an integer.");
    if (script.totalDurationMs < 0) {
        throw new RangeError("Compiled TPS script cannot have a negative total duration.");
    }
    if (script.segments.length === 0) {
        throw new TypeError("Compiled TPS script must contain at least one segment.");
    }
    if (script.words.length === 0) {
        if (script.totalDurationMs !== 0) {
            throw new RangeError("Compiled TPS script with no words must have zero total duration.");
        }
    }
    else if (script.totalDurationMs !== script.words.at(-1)?.endMs) {
        throw new RangeError("Compiled TPS script total duration must match the end of the final word.");
    }
    const segmentIds = new Set();
    const blockIds = new Set();
    const phraseIds = new Set();
    const wordIds = new Set();
    validateWords(script.words, wordIds);
    let expectedSegmentStartWordIndex = 0;
    for (const segment of script.segments) {
        validateIdentifier(segment.id, "segment", segmentIds);
        validateTimeRange("segment", segment.startWordIndex, segment.endWordIndex, segment.startMs, segment.endMs, script.words.length);
        validateCanonicalScopeWords("segment", segment.id, segment.words, segment.startWordIndex, segment.endWordIndex, segment.startMs, segment.endMs, script.words, segment.id);
        if (script.words.length > 0 && segment.startWordIndex !== expectedSegmentStartWordIndex) {
            throw new RangeError("Compiled TPS segments must be ordered by their canonical timeline.");
        }
        if (script.words.length > 0 && segment.words.length > 0 && segment.blocks.length === 0) {
            throw new TypeError("Compiled TPS segments with words must expose at least one block.");
        }
        let expectedBlockStartWordIndex = script.words.length === 0 ? 0 : segment.startWordIndex;
        for (const block of segment.blocks) {
            validateIdentifier(block.id, "block", blockIds);
            validateTimeRange("block", block.startWordIndex, block.endWordIndex, block.startMs, block.endMs, script.words.length);
            validateCanonicalScopeWords("block", block.id, block.words, block.startWordIndex, block.endWordIndex, block.startMs, block.endMs, script.words, segment.id, block.id);
            if (block.words.length > 0 && (block.startMs < segment.startMs || block.endMs > segment.endMs)) {
                throw new RangeError("Compiled TPS blocks must stay inside their parent segment range.");
            }
            if (script.words.length > 0 && block.words.length > 0 && block.startWordIndex !== expectedBlockStartWordIndex) {
                throw new RangeError("Compiled TPS blocks must be ordered by their canonical timeline.");
            }
            let previousPhraseEndWordIndex = block.startWordIndex - 1;
            for (const phrase of block.phrases) {
                validateIdentifier(phrase.id, "phrase", phraseIds);
                validateTimeRange("phrase", phrase.startWordIndex, phrase.endWordIndex, phrase.startMs, phrase.endMs, script.words.length);
                validateCanonicalScopeWords("phrase", phrase.id, phrase.words, phrase.startWordIndex, phrase.endWordIndex, phrase.startMs, phrase.endMs, script.words, segment.id, block.id, phrase.id);
                if (phrase.words.length > 0 && (phrase.startMs < block.startMs || phrase.endMs > block.endMs)) {
                    throw new RangeError("Compiled TPS phrases must stay inside their parent block range.");
                }
                if (script.words.length > 0 && phrase.words.length > 0 && phrase.startWordIndex <= previousPhraseEndWordIndex) {
                    throw new RangeError("Compiled TPS phrases must be ordered by their canonical timeline.");
                }
                if (phrase.words.length > 0) {
                    previousPhraseEndWordIndex = phrase.endWordIndex;
                }
            }
            if (block.words.length > 0) {
                expectedBlockStartWordIndex = block.endWordIndex + 1;
            }
        }
        expectedSegmentStartWordIndex = segment.words.length === 0 ? segment.startWordIndex : segment.endWordIndex + 1;
        if (script.words.length > 0 && segment.blocks.length > 0 && expectedBlockStartWordIndex !== segment.endWordIndex + 1) {
            throw new RangeError("Compiled TPS blocks must cover the full segment word timeline.");
        }
    }
    if (script.words.length > 0 && expectedSegmentStartWordIndex !== script.words.length) {
        throw new RangeError("Compiled TPS segments do not cover the full word timeline.");
    }
    validateWordReferences(script.words, segmentIds, blockIds, phraseIds);
}
function normalizeSegment(segment, wordById) {
    const blocks = segment.blocks.map((block) => normalizeBlock(block, wordById));
    const words = segment.words.map((word) => getNormalizedWord(word.id, wordById));
    return deepFreeze({
        id: segment.id,
        name: segment.name,
        targetWpm: segment.targetWpm,
        emotion: segment.emotion,
        speaker: segment.speaker,
        archetype: segment.archetype,
        timing: segment.timing,
        backgroundColor: segment.backgroundColor,
        textColor: segment.textColor,
        accentColor: segment.accentColor,
        startWordIndex: segment.startWordIndex,
        endWordIndex: segment.endWordIndex,
        startMs: segment.startMs,
        endMs: segment.endMs,
        blocks: freezeArray(blocks),
        words: freezeArray(words)
    });
}
function normalizeBlock(block, wordById) {
    const phrases = block.phrases.map((phrase) => normalizePhrase(phrase, wordById));
    const words = block.words.map((word) => getNormalizedWord(word.id, wordById));
    return deepFreeze({
        id: block.id,
        name: block.name,
        targetWpm: block.targetWpm,
        emotion: block.emotion,
        speaker: block.speaker,
        archetype: block.archetype,
        isImplicit: block.isImplicit,
        startWordIndex: block.startWordIndex,
        endWordIndex: block.endWordIndex,
        startMs: block.startMs,
        endMs: block.endMs,
        phrases: freezeArray(phrases),
        words: freezeArray(words)
    });
}
function normalizePhrase(phrase, wordById) {
    const words = phrase.words.map((word) => getNormalizedWord(word.id, wordById));
    return deepFreeze({
        id: phrase.id,
        text: phrase.text,
        startWordIndex: phrase.startWordIndex,
        endWordIndex: phrase.endWordIndex,
        startMs: phrase.startMs,
        endMs: phrase.endMs,
        words: freezeArray(words)
    });
}
function cloneWord(word) {
    return deepFreeze({
        id: word.id,
        index: word.index,
        kind: word.kind,
        cleanText: word.cleanText,
        characterCount: word.characterCount,
        orpPosition: word.orpPosition,
        displayDurationMs: word.displayDurationMs,
        startMs: word.startMs,
        endMs: word.endMs,
        metadata: deepFreeze(cloneWordMetadata(word.metadata)),
        segmentId: word.segmentId,
        blockId: word.blockId,
        phraseId: word.phraseId
    });
}
function cloneWordMetadata(metadata) {
    return {
        isEmphasis: metadata.isEmphasis,
        emphasisLevel: metadata.emphasisLevel,
        isPause: metadata.isPause,
        pauseDurationMs: metadata.pauseDurationMs,
        isHighlight: metadata.isHighlight,
        isBreath: metadata.isBreath,
        isEditPoint: metadata.isEditPoint,
        editPointPriority: metadata.editPointPriority,
        emotionHint: metadata.emotionHint,
        inlineEmotionHint: metadata.inlineEmotionHint,
        volumeLevel: metadata.volumeLevel,
        deliveryMode: metadata.deliveryMode,
        articulationStyle: metadata.articulationStyle,
        energyLevel: metadata.energyLevel,
        melodyLevel: metadata.melodyLevel,
        phoneticGuide: metadata.phoneticGuide,
        pronunciationGuide: metadata.pronunciationGuide,
        stressText: metadata.stressText,
        stressGuide: metadata.stressGuide,
        speedOverride: metadata.speedOverride,
        speedMultiplier: metadata.speedMultiplier,
        speaker: metadata.speaker,
        headCue: metadata.headCue
    };
}
function validateWords(words, seenIds) {
    let previousWord;
    for (const [index, word] of words.entries()) {
        validateIdentifier(word.id, "word", seenIds);
        assertInteger(word.index, "Compiled TPS word indexes must be integers.");
        if (word.index !== index) {
            throw new RangeError("Compiled TPS words must have sequential indexes that match their order.");
        }
        if (!word.segmentId || !word.blockId) {
            throw new TypeError("Compiled TPS words must reference a segment and block.");
        }
        if (word.kind === "word" && !word.phraseId) {
            throw new TypeError("Compiled TPS spoken words must reference a phrase.");
        }
        assertInteger(word.startMs, "Compiled TPS word startMs values must be integers.");
        assertInteger(word.endMs, "Compiled TPS word endMs values must be integers.");
        assertInteger(word.displayDurationMs, "Compiled TPS word displayDurationMs values must be integers.");
        if (word.startMs < 0 || word.endMs < word.startMs) {
            throw new RangeError("Compiled TPS words must define a non-negative time range.");
        }
        if (word.endMs - word.startMs !== word.displayDurationMs) {
            throw new RangeError("Compiled TPS words must keep display duration aligned with their start and end timestamps.");
        }
        if (previousWord && word.startMs !== previousWord.endMs) {
            throw new RangeError("Compiled TPS words must form a contiguous timeline.");
        }
        previousWord = word;
    }
}
function validateTimeRange(scope, startWordIndex, endWordIndex, startMs, endMs, wordCount) {
    assertInteger(startWordIndex, `Compiled TPS ${scope} startWordIndex values must be integers.`);
    assertInteger(endWordIndex, `Compiled TPS ${scope} endWordIndex values must be integers.`);
    assertInteger(startMs, `Compiled TPS ${scope} startMs values must be integers.`);
    assertInteger(endMs, `Compiled TPS ${scope} endMs values must be integers.`);
    if (startWordIndex < 0 || endWordIndex < startWordIndex || startMs < 0 || endMs < startMs) {
        throw new RangeError(`Compiled TPS ${scope} ranges must be non-negative and ordered.`);
    }
    if (wordCount === 0) {
        if (startWordIndex !== 0 || endWordIndex !== 0 || startMs !== 0 || endMs !== 0) {
            throw new RangeError(`Compiled TPS empty ${scope} ranges must stay at zero.`);
        }
        return;
    }
    if (startWordIndex >= wordCount || endWordIndex >= wordCount) {
        throw new RangeError(`Compiled TPS ${scope} ranges must reference words inside the canonical timeline.`);
    }
}
function validateCanonicalScopeWords(scope, ownerId, scopeWords, startWordIndex, endWordIndex, startMs, endMs, canonicalWords, expectedSegmentId, expectedBlockId, expectedPhraseId) {
    if (canonicalWords.length === 0) {
        if (scopeWords.length !== 0) {
            throw new TypeError(`Compiled TPS ${scope} '${ownerId}' cannot reference words when the canonical timeline is empty.`);
        }
        return;
    }
    if (scopeWords.length === 0) {
        if (startWordIndex !== 0 || endWordIndex !== 0 || startMs !== 0 || endMs !== 0) {
            throw new RangeError(`Compiled TPS empty ${scope} '${ownerId}' ranges must stay at zero.`);
        }
        return;
    }
    const expectedWordCount = endWordIndex - startWordIndex + 1;
    if (scopeWords.length !== expectedWordCount) {
        throw new TypeError(`Compiled TPS ${scope} '${ownerId}' words must match the canonical range they claim to cover.`);
    }
    if (startMs !== canonicalWords[startWordIndex]?.startMs || endMs !== canonicalWords[endWordIndex]?.endMs) {
        throw new RangeError(`Compiled TPS ${scope} '${ownerId}' timestamps must match the canonical word range they claim to cover.`);
    }
    for (let offset = 0; offset < scopeWords.length; offset += 1) {
        const actualWord = scopeWords[offset];
        const expectedWord = canonicalWords[startWordIndex + offset];
        if (actualWord.id !== expectedWord.id ||
            actualWord.index !== expectedWord.index ||
            actualWord.startMs !== expectedWord.startMs ||
            actualWord.endMs !== expectedWord.endMs) {
            throw new TypeError(`Compiled TPS ${scope} '${ownerId}' words must stay aligned with the canonical word timeline.`);
        }
        if (actualWord.segmentId !== expectedSegmentId) {
            throw new TypeError(`Compiled TPS ${scope} '${ownerId}' words must reference segment '${expectedSegmentId}'.`);
        }
        if (expectedBlockId && actualWord.blockId !== expectedBlockId) {
            throw new TypeError(`Compiled TPS ${scope} '${ownerId}' words must reference block '${expectedBlockId}'.`);
        }
        if (expectedPhraseId && actualWord.phraseId !== expectedPhraseId) {
            throw new TypeError(`Compiled TPS ${scope} '${ownerId}' words must reference phrase '${expectedPhraseId}'.`);
        }
    }
}
function validateWordReferences(words, segmentIds, blockIds, phraseIds) {
    for (const word of words) {
        if (!segmentIds.has(word.segmentId)) {
            throw new TypeError(`Compiled TPS word '${word.id}' references an unknown segment '${word.segmentId}'.`);
        }
        if (!blockIds.has(word.blockId)) {
            throw new TypeError(`Compiled TPS word '${word.id}' references an unknown block '${word.blockId}'.`);
        }
        if (word.phraseId && !phraseIds.has(word.phraseId)) {
            throw new TypeError(`Compiled TPS word '${word.id}' references an unknown phrase '${word.phraseId}'.`);
        }
    }
}
function validateIdentifier(id, scope, seen) {
    if (!id.trim()) {
        throw new TypeError(`Compiled TPS ${scope} identifiers cannot be empty.`);
    }
    if (seen.has(id)) {
        throw new TypeError(`Compiled TPS ${scope} identifiers must be unique.`);
    }
    seen.add(id);
}
function getNormalizedWord(id, wordById) {
    const word = wordById.get(id);
    if (!word) {
        throw new TypeError(`Compiled TPS graph references an unknown canonical word '${id}'.`);
    }
    return word;
}
function freezeArray(items) {
    for (const item of items) {
        deepFreeze(item);
    }
    return Object.freeze(items);
}
function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        for (const entry of value) {
            deepFreeze(entry);
        }
    }
    else {
        for (const entry of Object.values(value)) {
            deepFreeze(entry);
        }
    }
    return Object.freeze(value);
}
function assertObject(value, message) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError(message);
    }
}
function assertRecord(value, message) {
    assertObject(value, message);
}
function assertArray(value, message) {
    if (!Array.isArray(value)) {
        throw new TypeError(message);
    }
}
function assertInteger(value, message) {
    if (!Number.isInteger(value)) {
        throw new TypeError(message);
    }
}
//# sourceMappingURL=compiled-script.js.map
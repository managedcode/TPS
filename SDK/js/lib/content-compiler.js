import { TpsDiagnosticCodes, TpsSpec, TpsTags } from "./constants.js";
import { createDiagnostic } from "./diagnostics.js";
import { normalizeValue, resolveEffectiveWpm, resolveSpeedMultiplier, tryParseAbsoluteWpm, tryResolvePauseMilliseconds } from "./runtime-helpers.js";
import { buildStandalonePunctuationSuffix, isStandalonePunctuationToken } from "./text-rules.js";
import { protectEscapes, restoreEscapes } from "./escaping.js";
import { calculateOrpIndex, calculateWordDurationMs, isSentenceEndingPunctuation } from "./runtime-helpers.js";
export function compileContent(rawText, startOffset, inherited, lineStarts, diagnostics) {
    const protectedText = protectEscapes(rawText);
    const words = [];
    const phrases = [];
    const currentPhrase = [];
    const scopes = [];
    const literalScopes = [];
    let builder = "";
    let token;
    for (let index = 0; index < protectedText.length; index += 1) {
        const currentCharacter = protectedText[index];
        if (tryHandleMarkdownMarker(protectedText, index, scopes)) {
            ({ builder, token } = finalizeToken(words, phrases, currentPhrase, builder, token, inherited));
            index += index + 1 < protectedText.length && protectedText[index + 1] === "*" ? 1 : 0;
            continue;
        }
        if (currentCharacter === "[") {
            const tag = readTagToken(protectedText, index);
            if (!tag) {
                diagnostics.push(createDiagnostic(TpsDiagnosticCodes.unterminatedTag, "Tag is missing a closing ] bracket.", startOffset + index, startOffset + protectedText.length, lineStarts));
                ({ builder, token } = appendLiteral(protectedText.slice(index), scopes, inherited, builder, token));
                break;
            }
            if (requiresTokenBoundary(tag.name)) {
                ({ builder, token } = finalizeToken(words, phrases, currentPhrase, builder, token, inherited));
            }
            if (handleTagToken(tag, literalScopes, scopes, words, phrases, currentPhrase, inherited, startOffset + index, lineStarts, diagnostics)) {
                index += tag.raw.length - 1;
                continue;
            }
            ({ builder, token } = appendLiteral(tag.raw, scopes, inherited, builder, token));
            index += tag.raw.length - 1;
            continue;
        }
        if (tryHandleSlashPause(protectedText, index, builder, token)) {
            ({ builder, token } = finalizeToken(words, phrases, currentPhrase, builder, token, inherited));
            flushPhrase(phrases, currentPhrase);
            words.push(createControlWord("pause", inherited, protectedText[index + 1] === "/" ? TpsSpec.mediumPauseDurationMs : TpsSpec.shortPauseDurationMs));
            if (protectedText[index + 1] === "/") {
                index += 1;
            }
            continue;
        }
        if (/\s/u.test(currentCharacter)) {
            ({ builder, token } = finalizeToken(words, phrases, currentPhrase, builder, token, inherited));
            continue;
        }
        ({ builder, token } = appendCharacter(currentCharacter, scopes, inherited, builder, token));
    }
    ({ builder, token } = finalizeToken(words, phrases, currentPhrase, builder, token, inherited));
    flushPhrase(phrases, currentPhrase);
    for (const scope of scopes) {
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.unclosedTag, `Tag '${scope.name}' was opened but never closed.`, startOffset + rawText.length, startOffset + rawText.length, lineStarts));
    }
    return { words, phrases };
}
function handleTagToken(tag, literalScopes, scopes, words, phrases, currentPhrase, inherited, absoluteOffset, lineStarts, diagnostics) {
    if (tag.isClosing) {
        return handleClosingTag(tag, literalScopes, scopes, absoluteOffset, lineStarts, diagnostics);
    }
    if (tag.name === TpsTags.pause) {
        const pauseDuration = tryResolvePauseMilliseconds(tag.argument);
        if (typeof pauseDuration !== "number") {
            diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidPause, "Pause duration must use Ns or Nms syntax.", absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
            return false;
        }
        flushPhrase(phrases, currentPhrase);
        words.push(createControlWord("pause", inherited, pauseDuration));
        return true;
    }
    if (tag.name === TpsTags.breath) {
        words.push(createControlWord("breath", inherited));
        return true;
    }
    if (tag.name === TpsTags.editPoint) {
        if (tag.argument && !TpsSpec.editPointPriorities.includes(tag.argument)) {
            diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidTagArgument, `Edit point priority '${tag.argument}' is not supported.`, absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
            return false;
        }
        words.push(createControlWord("edit-point", inherited, undefined, tag.argument));
        return true;
    }
    const scope = createScope(tag, inherited.speedOffsets, absoluteOffset, lineStarts, diagnostics);
    if (!scope) {
        if (isPairedScope(tag.name)) {
            literalScopes.push({ name: tag.name });
        }
        return false;
    }
    scopes.push(scope);
    return true;
}
function handleClosingTag(tag, literalScopes, scopes, absoluteOffset, lineStarts, diagnostics) {
    const literalIndex = findLastIndex(literalScopes, (scope) => scope.name === tag.name);
    if (literalIndex >= 0) {
        literalScopes.splice(literalIndex, 1);
        return false;
    }
    const scopeIndex = findLastIndex(scopes, (scope) => scope.name === tag.name);
    if (scopeIndex < 0) {
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.mismatchedClosingTag, `Closing tag '${tag.name}' does not match any open scope.`, absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
        return false;
    }
    scopes.splice(scopeIndex, 1);
    return true;
}
function createScope(tag, speedOffsets, absoluteOffset, lineStarts, diagnostics) {
    if (tag.name === TpsTags.phonetic || tag.name === TpsTags.pronunciation) {
        if (!tag.argument) {
            diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidTagArgument, `Tag '${tag.name}' requires a pronunciation parameter.`, absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
            return undefined;
        }
        return {
            name: tag.name,
            phoneticGuide: tag.name === TpsTags.phonetic ? tag.argument : undefined,
            pronunciationGuide: tag.name === TpsTags.pronunciation ? tag.argument : undefined
        };
    }
    if (tag.name === TpsTags.stress) {
        return { name: tag.name, stressGuide: tag.argument, stressWrap: !tag.argument };
    }
    if (tag.name === TpsTags.emphasis) {
        return { name: tag.name, emphasisLevel: 1 };
    }
    if (tag.name === TpsTags.highlight) {
        return { name: tag.name, highlight: true };
    }
    if (TpsSpec.volumeLevels.includes(tag.name)) {
        return { name: tag.name, volumeLevel: tag.name };
    }
    if (TpsSpec.deliveryModes.includes(tag.name)) {
        return { name: tag.name, deliveryMode: tag.name };
    }
    if (TpsSpec.emotions.includes(tag.name)) {
        return { name: tag.name, inlineEmotion: tag.name };
    }
    const absoluteSpeed = tryParseAbsoluteWpm(tag.name);
    if (typeof absoluteSpeed === "number") {
        return { name: tag.name, absoluteSpeed };
    }
    const multiplier = resolveSpeedMultiplier(tag.name, speedOffsets);
    if (typeof multiplier === "number") {
        return { name: tag.name, relativeSpeedMultiplier: multiplier };
    }
    if (tag.name === TpsTags.normal) {
        return { name: tag.name, resetSpeed: true };
    }
    diagnostics.push(createDiagnostic(TpsDiagnosticCodes.unknownTag, `Tag '${tag.name}' is not part of the TPS specification.`, absoluteOffset, absoluteOffset + tag.raw.length, lineStarts));
    return undefined;
}
function tryHandleMarkdownMarker(text, index, scopes) {
    if (text[index] !== "*") {
        return false;
    }
    const markerLength = text[index + 1] === "*" ? 2 : 1;
    const marker = "*".repeat(markerLength);
    const scopeName = markerLength === 2 ? "__markdown-strong__" : TpsTags.emphasis;
    const existingIndex = findLastIndex(scopes, (scope) => scope.name === scopeName);
    if (existingIndex >= 0) {
        scopes.splice(existingIndex, 1);
        return true;
    }
    if (text.indexOf(marker, index + markerLength) < 0) {
        return false;
    }
    scopes.push({ name: scopeName, emphasisLevel: markerLength === 2 ? 2 : 1 });
    return true;
}
function readTagToken(text, index) {
    const endIndex = text.indexOf("]", index + 1);
    if (endIndex < 0) {
        return undefined;
    }
    const raw = text.slice(index, endIndex + 1);
    const inner = restoreEscapes(raw.slice(1, -1)).trim();
    const isClosing = inner.startsWith("/");
    const body = isClosing ? inner.slice(1).trim() : inner;
    const separatorIndex = body.indexOf(":");
    const name = (separatorIndex >= 0 ? body.slice(0, separatorIndex) : body).trim().toLowerCase();
    const argument = separatorIndex >= 0 ? normalizeValue(body.slice(separatorIndex + 1)) : undefined;
    return { raw, inner, name, argument, isClosing };
}
function requiresTokenBoundary(tagName) {
    return [TpsTags.pause, TpsTags.breath, TpsTags.editPoint].includes(tagName);
}
function tryHandleSlashPause(text, index, builder, token) {
    const currentCharacter = text[index];
    const nextCharacter = index + 1 < text.length ? text[index + 1] : "";
    const previousCharacter = index > 0 ? text[index - 1] : "";
    const nextIndex = nextCharacter === "/" ? index + 2 : index + 1;
    const previousIsBoundary = index === 0 || /\s/u.test(previousCharacter);
    const nextIsBoundary = nextIndex >= text.length || /\s/u.test(text[nextIndex]);
    return currentCharacter === "/" && !builder && !token && previousIsBoundary && nextIsBoundary;
}
function appendLiteral(literal, scopes, inherited, builder, token) {
    let activeBuilder = builder;
    let activeToken = token;
    for (const character of literal) {
        ({ builder: activeBuilder, token: activeToken } = appendCharacter(character, scopes, inherited, activeBuilder, activeToken));
    }
    return { builder: activeBuilder, token: activeToken };
}
function appendCharacter(character, scopes, inherited, builder, token) {
    const nextToken = token ?? new TokenAccumulator();
    nextToken.apply(resolveActiveState(scopes, inherited), character);
    return { builder: `${builder}${character}`, token: nextToken };
}
function finalizeToken(words, phrases, currentPhrase, builder, token, inherited) {
    if (!builder || !token) {
        return { builder: "", token: undefined };
    }
    const text = restoreEscapes(builder).trim();
    /* c8 ignore next 3 */
    if (!text) {
        return { builder: "", token: undefined };
    }
    if (isStandalonePunctuationToken(text)) {
        if (attachStandalonePunctuation(words, currentPhrase, text) && isSentenceEndingPunctuation(text)) {
            flushPhrase(phrases, currentPhrase);
        }
        return { builder: "", token: undefined };
    }
    const metadata = token.buildWordMetadata(inherited.targetWpm);
    const effectiveWpm = resolveEffectiveWpm(inherited.targetWpm, metadata.speedOverride, metadata.speedMultiplier);
    const word = {
        kind: "word",
        cleanText: text,
        characterCount: text.length,
        orpPosition: calculateOrpIndex(text),
        displayDurationMs: calculateWordDurationMs(text, effectiveWpm),
        metadata
    };
    words.push(word);
    currentPhrase.push(word);
    if (isSentenceEndingPunctuation(text)) {
        flushPhrase(phrases, currentPhrase);
    }
    return { builder: "", token: undefined };
}
function attachStandalonePunctuation(words, currentPhrase, punctuation) {
    const target = [...currentPhrase].reverse().find(isSpokenWord) ?? [...words].reverse().find(isSpokenWord);
    if (!target) {
        return false;
    }
    target.cleanText = `${target.cleanText}${buildStandalonePunctuationSuffix(punctuation)}`;
    target.characterCount = target.cleanText.length;
    target.orpPosition = calculateOrpIndex(target.cleanText);
    return true;
}
function flushPhrase(phrases, currentPhrase) {
    if (currentPhrase.length === 0) {
        return;
    }
    phrases.push({
        words: [...currentPhrase],
        text: currentPhrase.filter(isSpokenWord).map((word) => word.cleanText).join(" ")
    });
    currentPhrase.length = 0;
}
function createControlWord(kind, inherited, pauseDurationMs, editPointPriority) {
    const metadata = {
        isEmphasis: false,
        emphasisLevel: 0,
        isPause: kind === "pause",
        pauseDurationMs,
        isHighlight: false,
        isBreath: kind === "breath",
        isEditPoint: kind === "edit-point",
        editPointPriority,
        emotionHint: inherited.emotion,
        speaker: inherited.speaker,
        headCue: TpsSpec.emotionHeadCues[inherited.emotion]
    };
    return {
        kind,
        cleanText: "",
        characterCount: 0,
        orpPosition: 0,
        displayDurationMs: pauseDurationMs ?? 0,
        metadata
    };
}
function resolveActiveState(scopes, inherited) {
    let absoluteSpeed = inherited.targetWpm;
    let hasAbsoluteSpeed = false;
    let hasRelativeSpeed = false;
    let relativeSpeedMultiplier = 1;
    let emphasisLevel = 0;
    let highlight = false;
    let emotion = inherited.emotion;
    let inlineEmotion;
    let volumeLevel;
    let deliveryMode;
    let phoneticGuide;
    let pronunciationGuide;
    let stressGuide;
    let stressWrap = false;
    for (const scope of scopes) {
        if (typeof scope.absoluteSpeed === "number") {
            absoluteSpeed = scope.absoluteSpeed;
            hasAbsoluteSpeed = true;
            hasRelativeSpeed = false;
            relativeSpeedMultiplier = 1;
        }
        if (scope.resetSpeed) {
            hasRelativeSpeed = false;
            relativeSpeedMultiplier = 1;
        }
        if (typeof scope.relativeSpeedMultiplier === "number") {
            hasRelativeSpeed = true;
            relativeSpeedMultiplier *= scope.relativeSpeedMultiplier;
        }
        emphasisLevel = Math.max(emphasisLevel, scope.emphasisLevel ?? 0);
        highlight ||= Boolean(scope.highlight);
        if (scope.inlineEmotion) {
            emotion = scope.inlineEmotion;
            inlineEmotion = scope.inlineEmotion;
        }
        volumeLevel = scope.volumeLevel ?? volumeLevel;
        deliveryMode = scope.deliveryMode ?? deliveryMode;
        phoneticGuide = scope.phoneticGuide ?? phoneticGuide;
        pronunciationGuide = scope.pronunciationGuide ?? pronunciationGuide;
        stressGuide = scope.stressGuide ?? stressGuide;
        stressWrap ||= Boolean(scope.stressWrap);
    }
    return {
        emotion,
        inlineEmotion,
        speaker: inherited.speaker,
        emphasisLevel,
        highlight,
        volumeLevel,
        deliveryMode,
        phoneticGuide,
        pronunciationGuide,
        stressGuide,
        stressWrap,
        hasAbsoluteSpeed,
        absoluteSpeed,
        hasRelativeSpeed,
        relativeSpeedMultiplier
    };
}
function isPairedScope(tagName) {
    return ![TpsTags.pause, TpsTags.breath, TpsTags.editPoint].includes(tagName);
}
function isSpokenWord(word) {
    return word.kind === "word" && Boolean(word.cleanText);
}
function findLastIndex(items, predicate) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];
        if (item !== undefined && predicate(item)) {
            return index;
        }
    }
    return -1;
}
class TokenAccumulator {
    stressText = [];
    emphasisLevel = 0;
    isHighlight = false;
    emotionHint = "";
    inlineEmotionHint;
    volumeLevel;
    deliveryMode;
    phoneticGuide;
    pronunciationGuide;
    stressGuide;
    hasAbsoluteSpeed = false;
    absoluteSpeed = 0;
    hasRelativeSpeed = false;
    relativeSpeedMultiplier = 1;
    speaker;
    apply(state, character) {
        this.emphasisLevel = Math.max(this.emphasisLevel, state.emphasisLevel);
        this.isHighlight ||= state.highlight;
        this.emotionHint = state.emotion;
        this.inlineEmotionHint = state.inlineEmotion ?? this.inlineEmotionHint;
        this.volumeLevel = state.volumeLevel ?? this.volumeLevel;
        this.deliveryMode = state.deliveryMode ?? this.deliveryMode;
        this.phoneticGuide = state.phoneticGuide ?? this.phoneticGuide;
        this.pronunciationGuide = state.pronunciationGuide ?? this.pronunciationGuide;
        this.stressGuide = state.stressGuide ?? this.stressGuide;
        this.speaker = state.speaker;
        if (state.stressWrap) {
            this.stressText.push(character);
        }
        if (!/\s/u.test(character) && !isStandalonePunctuationToken(character)) {
            this.hasAbsoluteSpeed = state.hasAbsoluteSpeed;
            this.absoluteSpeed = state.absoluteSpeed;
            this.hasRelativeSpeed = state.hasRelativeSpeed;
            this.relativeSpeedMultiplier = state.relativeSpeedMultiplier;
        }
    }
    buildWordMetadata(inheritedWpm) {
        const metadata = {
            isEmphasis: this.emphasisLevel > 0,
            emphasisLevel: this.emphasisLevel,
            isPause: false,
            isHighlight: this.isHighlight,
            isBreath: false,
            isEditPoint: false,
            emotionHint: this.emotionHint,
            inlineEmotionHint: this.inlineEmotionHint,
            volumeLevel: this.volumeLevel,
            deliveryMode: this.deliveryMode,
            phoneticGuide: this.phoneticGuide,
            pronunciationGuide: this.pronunciationGuide,
            stressText: this.stressText.length > 0 ? this.stressText.join("") : undefined,
            stressGuide: this.stressGuide,
            speaker: this.speaker,
            headCue: TpsSpec.emotionHeadCues[(this.emotionHint || TpsSpec.defaultEmotion)]
        };
        if (this.hasAbsoluteSpeed) {
            const effectiveWpm = this.hasRelativeSpeed ? Math.max(1, Math.round(this.absoluteSpeed * this.relativeSpeedMultiplier)) : this.absoluteSpeed;
            if (effectiveWpm !== inheritedWpm) {
                metadata.speedOverride = effectiveWpm;
            }
        }
        else if (this.hasRelativeSpeed && Math.abs(this.relativeSpeedMultiplier - 1) > 0.0001) {
            metadata.speedMultiplier = this.relativeSpeedMultiplier;
        }
        return metadata;
    }
}
//# sourceMappingURL=content-compiler.js.map
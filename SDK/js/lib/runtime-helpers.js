import { TpsDiagnosticCodes, TpsEmotions, TpsFrontMatterKeys, TpsLegacyKeys, TpsSpec, TpsTags } from "./constants.js";
const trailingPunctuation = [".", "!", "?", ",", ";", ":", "\"", "'", ")", "]", "}"];
const timeFormats = [/^\d{1,2}:\d{2}$/u];
const legacyKeys = new Set(Object.values(TpsLegacyKeys));
const emotionSet = new Set(TpsEmotions);
const emotionPalettes = TpsSpec.emotionPalettes;
const knownTags = new Set(Object.values(TpsTags));
export function normalizeValue(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}
export function isLegacyMetadataKey(key) {
    return legacyKeys.has(key);
}
export function isKnownEmotion(value) {
    return value ? emotionSet.has(value.toLowerCase()) : false;
}
export function resolveEmotion(candidate, fallback = TpsSpec.defaultEmotion) {
    const normalized = normalizeValue(candidate)?.toLowerCase();
    return normalized && isKnownEmotion(normalized) ? normalized : fallback;
}
export function resolvePalette(emotion) {
    const key = resolveEmotion(emotion);
    return emotionPalettes[key];
}
export function resolveBaseWpm(metadata) {
    const value = metadata[TpsFrontMatterKeys.baseWpm];
    return clampWpm(value ? Number.parseInt(value, 10) : Number.NaN, TpsSpec.defaultBaseWpm);
}
export function resolveSpeedOffsets(metadata) {
    return {
        [TpsTags.xslow]: resolveSpeedOffset(metadata, TpsFrontMatterKeys.speedOffsetsXslow, TpsSpec.defaultSpeedOffsets[TpsTags.xslow]),
        [TpsTags.slow]: resolveSpeedOffset(metadata, TpsFrontMatterKeys.speedOffsetsSlow, TpsSpec.defaultSpeedOffsets[TpsTags.slow]),
        [TpsTags.fast]: resolveSpeedOffset(metadata, TpsFrontMatterKeys.speedOffsetsFast, TpsSpec.defaultSpeedOffsets[TpsTags.fast]),
        [TpsTags.xfast]: resolveSpeedOffset(metadata, TpsFrontMatterKeys.speedOffsetsXfast, TpsSpec.defaultSpeedOffsets[TpsTags.xfast])
    };
}
export function resolveSpeedMultiplier(tag, speedOffsets) {
    const offset = speedOffsets[tag];
    return typeof offset === "number" ? 1 + (offset / 100) : undefined;
}
export function tryParseAbsoluteWpm(tag) {
    if (!tag.toLowerCase().endsWith(TpsSpec.wpmSuffix.toLowerCase())) {
        return undefined;
    }
    const numeric = Number.parseInt(tag.slice(0, -TpsSpec.wpmSuffix.length), 10);
    return Number.isFinite(numeric) ? numeric : undefined;
}
export function isTimingToken(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return false;
    }
    const parts = trimmed.split("-");
    return parts.length <= 2 && parts.every(isTimeToken);
}
export function isSentenceEndingPunctuation(text) {
    const trimmed = text.trimEnd();
    return Boolean(trimmed) && [".", "!", "?"].includes(trimmed.slice(-1));
}
export function tryResolvePauseMilliseconds(argument) {
    const trimmed = normalizeValue(argument);
    if (!trimmed) {
        return undefined;
    }
    if (trimmed.toLowerCase().endsWith("ms")) {
        const milliseconds = Number.parseInt(trimmed.slice(0, -2), 10);
        return Number.isFinite(milliseconds) ? milliseconds : undefined;
    }
    if (!trimmed.toLowerCase().endsWith("s")) {
        return undefined;
    }
    const seconds = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(seconds) ? Math.round(seconds * 1000) : undefined;
}
export function calculateWordDurationMs(word, effectiveWpm) {
    const baseMilliseconds = 60_000 / Math.max(1, effectiveWpm);
    return Math.max(120, Math.round(baseMilliseconds * (0.8 + (word.length * 0.04))));
}
export function calculateOrpIndex(word) {
    if (!word) {
        return 0;
    }
    const cleanWord = trimTrailingPunctuation(word);
    const length = cleanWord.length;
    if (length <= 1) {
        return 0;
    }
    const ratio = length <= 5 ? 0.3 : length <= 9 ? 0.35 : 0.4;
    return Math.max(0, Math.min(Math.floor(length * ratio), length - 1));
}
export function resolveEffectiveWpm(inheritedWpm, speedOverride, speedMultiplier) {
    if (typeof speedOverride === "number") {
        return Math.max(1, speedOverride);
    }
    if (typeof speedMultiplier === "number") {
        return Math.max(1, Math.round(inheritedWpm * speedMultiplier));
    }
    return Math.max(1, inheritedWpm);
}
export function isKnownInlineTag(tag) {
    const lower = tag.toLowerCase();
    return knownTags.has(lower) || isKnownEmotion(lower) || typeof tryParseAbsoluteWpm(lower) === "number";
}
export function buildInvalidWpmMessage(value) {
    return `WPM '${value}' must be between ${TpsSpec.minimumWpm} and ${TpsSpec.maximumWpm}.`;
}
export function isInvalidWpm(value) {
    return value < TpsSpec.minimumWpm || value > TpsSpec.maximumWpm;
}
export function isValidationErrorCode(code) {
    return code !== TpsDiagnosticCodes.invalidHeaderParameter;
}
function resolveSpeedOffset(metadata, key, fallback) {
    const parsed = Number.parseInt(metadata[key] ?? "", 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function clampWpm(candidate, fallback) {
    if (!Number.isFinite(candidate)) {
        return fallback;
    }
    return Math.min(Math.max(candidate, TpsSpec.minimumWpm), TpsSpec.maximumWpm);
}
function isTimeToken(value) {
    const trimmed = value.trim();
    return timeFormats.some((format) => format.test(trimmed));
}
function trimTrailingPunctuation(word) {
    let trimmed = word;
    while (trimmed.length > 0 && trailingPunctuation.includes(trimmed.slice(-1))) {
        trimmed = trimmed.slice(0, -1);
    }
    return trimmed;
}

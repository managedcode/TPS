import { TpsDiagnosticCodes, TpsFrontMatterKeys, TpsHeaderTokens, TpsSpec } from "./constants.js";
import { createDiagnostic, createLineStarts, hasErrors, normalizeLineEndings } from "./diagnostics.js";
import { splitHeaderPartsDetailed } from "./escaping.js";
import { buildInvalidWpmMessage, isInvalidWpm, isKnownArchetype, isKnownEmotion, isLegacyMetadataKey, isTimingToken, normalizeValue, resolveArchetypeWpm, resolveBaseWpm, resolveEmotion, resolvePalette } from "./runtime-helpers.js";
export function parseDocument(source) {
    const normalized = normalizeLineEndings(source);
    const lineStarts = createLineStarts(normalized);
    const diagnostics = [];
    const { metadata, body, bodyStartOffset } = extractFrontMatter(normalized, lineStarts, diagnostics);
    const titledBody = extractTitleHeader(body, bodyStartOffset, metadata);
    const parsedSegments = parseSegments(titledBody.body, titledBody.startOffset, metadata, lineStarts, diagnostics);
    return {
        source: normalized,
        lineStarts,
        diagnostics,
        document: {
            metadata,
            segments: parsedSegments.map((entry) => entry.segment)
        },
        parsedSegments
    };
}
export function createParseResult(analysis) {
    return {
        ok: !hasErrors(analysis.diagnostics),
        diagnostics: analysis.diagnostics,
        document: analysis.document
    };
}
export function createValidationResult(analysis) {
    return {
        ok: !hasErrors(analysis.diagnostics),
        diagnostics: analysis.diagnostics
    };
}
function extractFrontMatter(source, lineStarts, diagnostics) {
    if (!source.startsWith("---\n")) {
        return { metadata: {}, body: source, bodyStartOffset: 0 };
    }
    const closing = findFrontMatterClosing(source);
    if (!closing) {
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, "Front matter must be closed by a terminating --- line.", 0, Math.min(source.length, 3), lineStarts));
        return { metadata: {}, body: source, bodyStartOffset: 0 };
    }
    return {
        metadata: parseMetadata(source.slice(4, closing.index), 4, lineStarts, diagnostics),
        body: source.slice(closing.index + closing.length),
        bodyStartOffset: closing.index + closing.length
    };
}
function parseMetadata(frontMatterText, startOffset, lineStarts, diagnostics) {
    const metadata = {};
    let currentSection;
    let lineOffset = startOffset;
    for (const rawLine of frontMatterText.split("\n")) {
        const entryStart = lineOffset;
        const entryEnd = lineOffset + rawLine.length;
        lineOffset = entryEnd + 1;
        if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) {
            continue;
        }
        const indentation = rawLine.length - rawLine.trimStart().length;
        const line = rawLine.trim();
        const separatorIndex = line.indexOf(":");
        if (separatorIndex <= 0) {
            continue;
        }
        const key = line.slice(0, separatorIndex).trim();
        const value = normalizeMetadataValue(line.slice(separatorIndex + 1));
        if (indentation > 0 && currentSection) {
            const compositeKey = `${currentSection}.${key}`;
            if (!isLegacyMetadataKey(compositeKey)) {
                metadata[compositeKey] = value;
                validateMetadataEntry(compositeKey, value, entryStart, entryEnd, lineStarts, diagnostics);
            }
            continue;
        }
        currentSection = value ? undefined : key;
        if (value && !isLegacyMetadataKey(key)) {
            metadata[key] = value;
            validateMetadataEntry(key, value, entryStart, entryEnd, lineStarts, diagnostics);
        }
    }
    return metadata;
}
function extractTitleHeader(body, bodyStartOffset, metadata) {
    const lines = splitLines(body, bodyStartOffset);
    for (const line of lines) {
        if (!line.text.trim()) {
            continue;
        }
        const trimmed = line.text.trim();
        if (!trimmed.startsWith(TpsHeaderTokens.title) || trimmed.startsWith(TpsHeaderTokens.segment)) {
            break;
        }
        metadata[TpsFrontMatterKeys.title] = trimmed.slice(TpsHeaderTokens.title.length).trim();
        const consumedLength = line.startOffset - bodyStartOffset + line.text.length;
        const trailingNewlineLength = body[consumedLength] === "\n" ? 1 : 0;
        const bodyOffset = consumedLength + trailingNewlineLength;
        return { body: body.slice(bodyOffset), startOffset: bodyStartOffset + bodyOffset };
    }
    return { body, startOffset: bodyStartOffset };
}
function parseSegments(body, bodyStartOffset, metadata, lineStarts, diagnostics) {
    const lines = splitLines(body, bodyStartOffset);
    const segments = [];
    const preamble = [];
    let current;
    let currentBlock;
    let segmentLeading = [];
    let blockLines = [];
    for (const line of lines) {
        const segmentHeader = tryParseHeader(line, "segment", lineStarts, diagnostics);
        if (segmentHeader) {
            finalizeBlock(current, currentBlock, blockLines);
            finalizeSegment(segments, current, segmentLeading);
            current = createSegment(segmentHeader, metadata, segments.length + 1);
            currentBlock = undefined;
            if (preamble.length > 0) {
                segmentLeading = preamble.splice(0, preamble.length);
            }
            continue;
        }
        const blockHeader = tryParseHeader(line, "block", lineStarts, diagnostics);
        if (blockHeader) {
            if (!current) {
                current = createImplicitSegment(metadata, segments.length + 1);
                if (preamble.length > 0) {
                    segmentLeading = preamble.splice(0, preamble.length);
                }
            }
            finalizeBlock(current, currentBlock, blockLines);
            currentBlock = createBlock(blockHeader, current.parsedBlocks.length + 1, current.segment.id);
            blockLines = [];
            continue;
        }
        pushContentLine(current, currentBlock, line, preamble, segmentLeading, blockLines);
    }
    if (!current) {
        const implicit = createImplicitSegment(metadata, 1);
        implicit.directContent = createContentSection(preamble);
        implicit.segment.leadingContent = implicit.directContent?.text;
        implicit.segment.content = implicit.directContent?.text ?? "";
        return [implicit];
    }
    finalizeBlock(current, currentBlock, blockLines);
    finalizeSegment(segments, current, segmentLeading);
    return segments;
}
function finalizeBlock(current, block, lines) {
    if (!current || !block) {
        return;
    }
    block.content = createContentSection(lines);
    block.block.content = block.content?.text ?? "";
    current.segment.blocks.push(block.block);
    current.parsedBlocks.push(block);
}
function finalizeSegment(target, segment, lines) {
    if (!segment) {
        return;
    }
    segment.leadingContent = createContentSection(lines);
    segment.segment.leadingContent = segment.leadingContent?.text;
    segment.segment.content = segment.parsedBlocks.length === 0 ? segment.leadingContent?.text ?? "" : "";
    if (segment.parsedBlocks.length === 0) {
        segment.directContent = segment.leadingContent;
    }
    target.push(segment);
}
function pushContentLine(current, currentBlock, line, preamble, segmentLeading, blockLines) {
    if (currentBlock) {
        blockLines.push(line);
        return;
    }
    if (current) {
        segmentLeading.push(line);
        return;
    }
    preamble.push(line);
}
function tryParseHeader(line, level, lineStarts, diagnostics) {
    const hashPrefix = level === "segment" ? "##" : "###";
    const trimmedStart = line.text.trimStart();
    if (!trimmedStart.startsWith(hashPrefix)) {
        return undefined;
    }
    const afterHashes = trimmedStart.slice(hashPrefix.length);
    if (afterHashes && !afterHashes.startsWith(" ")) {
        return undefined;
    }
    const headerContent = afterHashes.trim();
    if (!headerContent) {
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidHeader, "Header cannot be empty.", line.startOffset, line.startOffset + line.text.length, lineStarts));
        return undefined;
    }
    if (!headerContent.startsWith("[") || !headerContent.endsWith("]")) {
        return {
            name: headerContent,
            headerStart: line.startOffset,
            headerEnd: line.startOffset + line.text.length
        };
    }
    const parsed = parseBracketHeader(headerContent.slice(1, -1), line.startOffset + line.text.indexOf("[") + 1, lineStarts, diagnostics);
    return parsed
        ? {
            ...parsed,
            headerStart: line.startOffset,
            headerEnd: line.startOffset + line.text.length
        }
        : undefined;
}
function parseBracketHeader(headerContent, contentOffset, lineStarts, diagnostics) {
    const parts = splitHeaderPartsDetailed(headerContent);
    if (parts.length === 0 || !parts[0]?.value) {
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidHeader, "Header name is required.", contentOffset, contentOffset + headerContent.length, lineStarts));
        return undefined;
    }
    const parsed = {
        name: parts[0].value,
        headerStart: contentOffset,
        headerEnd: contentOffset + headerContent.length
    };
    for (const part of parts.slice(1)) {
        const normalized = normalizeValue(part.value);
        if (!normalized) {
            continue;
        }
        const tokenRangeStart = contentOffset + part.start;
        const tokenRangeEnd = contentOffset + part.end;
        if (normalized.toLowerCase().startsWith(TpsSpec.speakerPrefix.toLowerCase())) {
            parsed.speaker = normalizeValue(normalized.slice(TpsSpec.speakerPrefix.length));
            continue;
        }
        if (normalized.toLowerCase().startsWith(TpsSpec.headerTokens.archetypePrefix.toLowerCase())) {
            const archetypeValue = normalizeValue(normalized.slice(TpsSpec.headerTokens.archetypePrefix.length));
            if (archetypeValue && isKnownArchetype(archetypeValue)) {
                parsed.archetype = archetypeValue.toLowerCase();
            }
            else {
                diagnostics.push(createDiagnostic(TpsDiagnosticCodes.unknownArchetype, `Archetype '${archetypeValue ?? ""}' is not a known vocal archetype.`, tokenRangeStart, tokenRangeEnd, lineStarts, "Use one of: Friend, Motivator, Educator, Coach, Storyteller, Entertainer."));
            }
            continue;
        }
        if (isTimingToken(normalized)) {
            parsed.timing = normalized;
            continue;
        }
        if (applyHeaderWpm(parsed, normalized, tokenRangeStart, tokenRangeEnd, lineStarts, diagnostics)) {
            continue;
        }
        if (isKnownEmotion(normalized)) {
            parsed.emotion = normalized.toLowerCase();
            continue;
        }
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidHeaderParameter, `Header parameter '${normalized}' is not a known TPS header token.`, tokenRangeStart, tokenRangeEnd, lineStarts, "Use a speaker, emotion, timing, or WPM value."));
    }
    return parsed;
}
function applyHeaderWpm(parsed, token, start, end, lineStarts, diagnostics) {
    const normalized = token.replace(/\s+/gu, "");
    if (!/^\d+(wpm)?$/iu.test(normalized)) {
        return false;
    }
    const candidate = normalized.toLowerCase().endsWith(TpsSpec.wpmSuffix.toLowerCase())
        ? Number.parseInt(normalized.slice(0, -TpsSpec.wpmSuffix.length), 10)
        : Number.parseInt(normalized, 10);
    if (isInvalidWpm(candidate)) {
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidWpm, buildInvalidWpmMessage(token), start, end, lineStarts));
        return true;
    }
    parsed.targetWpm = candidate;
    return true;
}
function createSegment(header, metadata, index) {
    const emotion = resolveEmotion(header.emotion);
    const palette = resolvePalette(emotion);
    const archetypeWpm = resolveArchetypeWpm(header.archetype);
    const segment = {
        id: `segment-${index}`,
        name: header.name,
        content: "",
        targetWpm: header.targetWpm ?? archetypeWpm ?? resolveBaseWpm(metadata),
        emotion,
        speaker: header.speaker,
        archetype: header.archetype,
        timing: header.timing,
        backgroundColor: palette.background,
        textColor: palette.text,
        accentColor: palette.accent,
        blocks: []
    };
    return {
        segment,
        headerStart: header.headerStart,
        headerEnd: header.headerEnd,
        parsedBlocks: []
    };
}
function createImplicitSegment(metadata, index) {
    return createSegment({
        name: metadata[TpsFrontMatterKeys.title] ?? TpsSpec.defaultImplicitSegmentName,
        headerStart: 0,
        headerEnd: 0,
        targetWpm: resolveBaseWpm(metadata),
        emotion: TpsSpec.defaultEmotion
    }, metadata, index);
}
function createBlock(header, blockIndex, segmentId) {
    return {
        headerStart: header.headerStart,
        headerEnd: header.headerEnd,
        block: {
            id: `${segmentId}-block-${blockIndex}`,
            name: header.name,
            content: "",
            targetWpm: header.targetWpm,
            emotion: header.emotion,
            speaker: header.speaker,
            archetype: header.archetype
        }
    };
}
function createContentSection(lines) {
    if (lines.length === 0) {
        return undefined;
    }
    return {
        text: lines.map((line) => line.text).join("\n"),
        startOffset: lines[0].startOffset
    };
}
function splitLines(text, startOffset) {
    if (!text) {
        return [];
    }
    const records = [];
    let lineStart = startOffset;
    for (const line of text.split("\n")) {
        records.push({ text: line, startOffset: lineStart });
        lineStart += line.length + 1;
    }
    if (text.endsWith("\n")) {
        records.pop();
    }
    return records;
}
function normalizeMetadataValue(value) {
    return value.trim().replace(/^"(.*)"$/u, "$1");
}
function findFrontMatterClosing(source) {
    const blockClosingIndex = source.indexOf("\n---\n", 4);
    if (blockClosingIndex >= 0) {
        return { index: blockClosingIndex, length: 5 };
    }
    if (source.endsWith("\n---")) {
        return { index: source.length - 4, length: 4 };
    }
    return undefined;
}
function validateMetadataEntry(key, value, start, end, lineStarts, diagnostics) {
    if (key === TpsFrontMatterKeys.baseWpm) {
        const parsed = Number.parseInt(value, 10);
        if (!/^-?\d+$/u.test(value)) {
            diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, "Front matter field 'base_wpm' must be an integer.", start, end, lineStarts));
            return;
        }
        if (isInvalidWpm(parsed)) {
            diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidWpm, buildInvalidWpmMessage(value), start, end, lineStarts));
        }
        return;
    }
    if (key.startsWith("speed_offsets.") && !/^-?\d+$/u.test(value)) {
        diagnostics.push(createDiagnostic(TpsDiagnosticCodes.invalidFrontMatter, `Front matter field '${key}' must be an integer.`, start, end, lineStarts));
    }
}
//# sourceMappingURL=parser.js.map
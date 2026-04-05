import { compileContent } from "./content-compiler.js";
import { normalizeCompiledScript } from "./compiled-script.js";
import { hasErrors } from "./diagnostics.js";
import { createParseResult, createValidationResult, parseDocument } from "./parser.js";
import { resolveArchetypeWpm, resolveBaseWpm, resolveEmotion, resolveSpeedOffsets } from "./runtime-helpers.js";
export function validateTps(source) {
    const analysis = parseDocument(source);
    compileAnalysis(analysis);
    return createValidationResult(analysis);
}
export function parseTps(source) {
    const analysis = parseDocument(source);
    compileAnalysis(analysis);
    return createParseResult(analysis);
}
export function compileTps(source) {
    const analysis = parseDocument(source);
    const script = compileAnalysis(analysis);
    return {
        ok: !hasErrors(analysis.diagnostics),
        diagnostics: analysis.diagnostics,
        document: analysis.document,
        script: normalizeCompiledScript(script)
    };
}
function compileAnalysis(analysis) {
    const baseWpm = resolveBaseWpm(analysis.document.metadata);
    const speedOffsets = resolveSpeedOffsets(analysis.document.metadata);
    const candidates = analysis.parsedSegments.map((parsedSegment) => compileSegment(parsedSegment, baseWpm, speedOffsets, analysis));
    return finalizeScript(analysis.document.metadata, candidates);
}
function compileSegment(parsedSegment, baseWpm, speedOffsets, analysis) {
    const segmentEmotion = resolveEmotion(parsedSegment.segment.emotion);
    const inherited = {
        targetWpm: parsedSegment.segment.targetWpm,
        emotion: segmentEmotion,
        speaker: parsedSegment.segment.speaker,
        archetype: parsedSegment.segment.archetype,
        speedOffsets
    };
    const blocks = buildBlocks(parsedSegment).map((entry) => compileBlock(entry, inherited, analysis));
    return {
        segment: {
            ...parsedSegment.segment,
            targetWpm: inherited.targetWpm,
            emotion: segmentEmotion,
            archetype: parsedSegment.segment.archetype,
            backgroundColor: parsedSegment.segment.backgroundColor,
            textColor: parsedSegment.segment.textColor,
            accentColor: parsedSegment.segment.accentColor,
            startWordIndex: 0,
            endWordIndex: 0,
            startMs: 0,
            endMs: 0,
            blocks: [],
            words: []
        },
        blocks
    };
}
function buildBlocks(parsedSegment) {
    const blocks = [];
    if (parsedSegment.leadingContent?.text && parsedSegment.parsedBlocks.length > 0) {
        blocks.push({
            block: {
                id: `${parsedSegment.segment.id}-implicit-lead`,
                name: `${parsedSegment.segment.name} Lead`,
                content: parsedSegment.leadingContent.text,
                targetWpm: parsedSegment.segment.targetWpm,
                emotion: parsedSegment.segment.emotion,
                speaker: parsedSegment.segment.speaker,
                archetype: parsedSegment.segment.archetype
            },
            isImplicit: true,
            content: parsedSegment.leadingContent
        });
    }
    if (parsedSegment.parsedBlocks.length === 0) {
        blocks.push({
            block: {
                id: `${parsedSegment.segment.id}-implicit-body`,
                name: parsedSegment.segment.name,
                content: parsedSegment.directContent?.text ?? "",
                targetWpm: parsedSegment.segment.targetWpm,
                emotion: parsedSegment.segment.emotion,
                speaker: parsedSegment.segment.speaker,
                archetype: parsedSegment.segment.archetype
            },
            isImplicit: true,
            content: parsedSegment.directContent
        });
    }
    for (const parsedBlock of parsedSegment.parsedBlocks) {
        blocks.push({ block: parsedBlock.block, isImplicit: false, content: parsedBlock.content });
    }
    return blocks;
}
function compileBlock(entry, inherited, analysis) {
    const resolvedArchetype = entry.block.archetype ?? inherited.archetype;
    const blockWpm = entry.block.targetWpm ?? resolveArchetypeWpm(resolvedArchetype) ?? inherited.targetWpm;
    const blockInherited = {
        targetWpm: blockWpm,
        emotion: resolveEmotion(entry.block.emotion, inherited.emotion),
        speaker: entry.block.speaker ?? inherited.speaker,
        archetype: resolvedArchetype,
        speedOffsets: inherited.speedOffsets
    };
    const content = compileContent(entry.content?.text ?? "", entry.content?.startOffset ?? 0, blockInherited, analysis.lineStarts, analysis.diagnostics);
    return {
        block: {
            ...entry.block,
            targetWpm: blockInherited.targetWpm,
            emotion: blockInherited.emotion,
            speaker: blockInherited.speaker,
            archetype: resolvedArchetype,
            isImplicit: entry.isImplicit,
            startWordIndex: 0,
            endWordIndex: 0,
            startMs: 0,
            endMs: 0,
            phrases: [],
            words: []
        },
        content
    };
}
function finalizeScript(metadata, candidates) {
    const script = {
        metadata: { ...metadata },
        totalDurationMs: 0,
        segments: [],
        words: []
    };
    let elapsedMs = 0;
    let wordIndex = 0;
    for (const segmentCandidate of candidates) {
        const segment = segmentCandidate.segment;
        const segmentWords = [];
        for (const blockCandidate of segmentCandidate.blocks) {
            const { block, words, phrases, elapsed, nextWordIndex } = finalizeBlock(blockCandidate.block, blockCandidate.content.words, blockCandidate.content.phrases, segment.id, elapsedMs, wordIndex);
            block.words = words;
            block.phrases = phrases;
            segment.blocks.push(block);
            segmentWords.push(...words);
            script.words.push(...words);
            elapsedMs = elapsed;
            wordIndex = nextWordIndex;
        }
        segment.words = segmentWords;
        finalizeTimeRange(segment, segmentWords);
        script.segments.push(segment);
    }
    script.totalDurationMs = elapsedMs;
    return script;
}
function finalizeBlock(block, seeds, phraseSeeds, segmentId, elapsedMs, wordIndex) {
    const wordMap = new Map();
    const words = [];
    for (const seed of seeds) {
        const compiledWord = finalizeWord(seed, segmentId, block.id, elapsedMs, wordIndex);
        wordMap.set(seed, compiledWord);
        words.push(compiledWord);
        elapsedMs = compiledWord.endMs;
        wordIndex += 1;
    }
    const phrases = phraseSeeds.map((phraseSeed, index) => finalizePhrase(phraseSeed, wordMap, block.id, index + 1));
    finalizeTimeRange(block, words);
    return { block, words, phrases, elapsed: elapsedMs, nextWordIndex: wordIndex };
}
function finalizeWord(seed, segmentId, blockId, elapsedMs, index) {
    return {
        ...seed,
        id: `word-${index + 1}`,
        index,
        startMs: elapsedMs,
        endMs: elapsedMs + seed.displayDurationMs,
        segmentId,
        blockId,
        phraseId: ""
    };
}
function finalizePhrase(seed, wordMap, blockId, index) {
    const words = seed.words.map((word) => wordMap.get(word)).filter((word) => Boolean(word));
    const firstWord = words[0];
    const lastWord = words.at(-1);
    /* c8 ignore next 11 */
    if (!firstWord || !lastWord) {
        return {
            id: `${blockId}-phrase-${index}`,
            text: seed.text,
            startWordIndex: 0,
            endWordIndex: 0,
            startMs: 0,
            endMs: 0,
            words: []
        };
    }
    const phrase = {
        id: `${blockId}-phrase-${index}`,
        text: seed.text,
        startWordIndex: firstWord.index,
        endWordIndex: lastWord.index,
        startMs: firstWord.startMs,
        endMs: lastWord.endMs,
        words
    };
    for (const word of words) {
        word.phraseId = phrase.id;
    }
    return phrase;
}
function finalizeTimeRange(target, words) {
    target.startWordIndex = words[0]?.index ?? 0;
    target.endWordIndex = words.at(-1)?.index ?? target.startWordIndex;
    target.startMs = words[0]?.startMs ?? 0;
    target.endMs = words.at(-1)?.endMs ?? target.startMs;
}
//# sourceMappingURL=compiler.js.map
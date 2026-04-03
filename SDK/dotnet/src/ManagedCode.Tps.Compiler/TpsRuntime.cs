using ManagedCode.Tps.Compiler.Internal;
using ManagedCode.Tps.Compiler.Models;

namespace ManagedCode.Tps.Compiler;

public static class TpsRuntime
{
    public static TpsValidationResult Validate(string source)
    {
        var analysis = new TpsParser().Parse(source);
        CompileAnalysis(analysis);
        return new TpsValidationResult
        {
            Ok = !TpsSupport.HasErrors(analysis.Diagnostics),
            Diagnostics = analysis.Diagnostics
        };
    }

    public static TpsParseResult Parse(string source)
    {
        var analysis = new TpsParser().Parse(source);
        CompileAnalysis(analysis);
        return new TpsParseResult
        {
            Ok = !TpsSupport.HasErrors(analysis.Diagnostics),
            Diagnostics = analysis.Diagnostics,
            Document = analysis.Document
        };
    }

    public static TpsCompilationResult Compile(string source)
    {
        var analysis = new TpsParser().Parse(source);
        var script = CompileAnalysis(analysis);
        return new TpsCompilationResult
        {
            Ok = !TpsSupport.HasErrors(analysis.Diagnostics),
            Diagnostics = analysis.Diagnostics,
            Document = analysis.Document,
            Script = script
        };
    }

    private static CompiledScript CompileAnalysis(DocumentAnalysis analysis)
    {
        var baseWpm = TpsSupport.ResolveBaseWpm(analysis.Document.Metadata);
        var speedOffsets = TpsSupport.ResolveSpeedOffsets(analysis.Document.Metadata);
        var candidates = analysis.ParsedSegments
            .Select(parsedSegment => CompileSegment(parsedSegment, baseWpm, speedOffsets, analysis))
            .ToList();
        return FinalizeScript(analysis.Document.Metadata, candidates);
    }

    private static SegmentCandidate CompileSegment(
        ParsedSegmentInternal parsedSegment,
        int baseWpm,
        IReadOnlyDictionary<string, int> speedOffsets,
        DocumentAnalysis analysis)
    {
        var segmentEmotion = TpsSupport.ResolveEmotion(parsedSegment.Segment.Emotion);
        var inherited = new InheritedFormattingState(parsedSegment.Segment.TargetWpm ?? baseWpm, segmentEmotion, parsedSegment.Segment.Speaker, speedOffsets);
        var blocks = BuildBlocks(parsedSegment).Select(entry => CompileBlock(entry, inherited, analysis)).ToList();
        return new SegmentCandidate(
            new CompiledSegment
            {
                Id = parsedSegment.Segment.Id,
                Name = parsedSegment.Segment.Name,
                TargetWpm = inherited.TargetWpm,
                Emotion = segmentEmotion,
                Speaker = parsedSegment.Segment.Speaker,
                Timing = parsedSegment.Segment.Timing,
                BackgroundColor = parsedSegment.Segment.BackgroundColor!,
                TextColor = parsedSegment.Segment.TextColor!,
                AccentColor = parsedSegment.Segment.AccentColor!
            },
            blocks);
    }

    private static IEnumerable<BlockDefinition> BuildBlocks(ParsedSegmentInternal parsedSegment)
    {
        if (parsedSegment.LeadingContent?.Text is { Length: > 0 } leadingContent)
        {
            yield return new BlockDefinition(
                new TpsBlock
                {
                    Id = $"{parsedSegment.Segment.Id}-implicit-lead",
                    Name = $"{parsedSegment.Segment.Name} Lead",
                    Content = leadingContent,
                    TargetWpm = parsedSegment.Segment.TargetWpm,
                    Emotion = parsedSegment.Segment.Emotion,
                    Speaker = parsedSegment.Segment.Speaker
                },
                true,
                parsedSegment.LeadingContent);
        }

        if (parsedSegment.ParsedBlocks.Count == 0)
        {
            yield return new BlockDefinition(
                new TpsBlock
                {
                    Id = $"{parsedSegment.Segment.Id}-implicit-body",
                    Name = parsedSegment.Segment.Name,
                    Content = parsedSegment.DirectContent?.Text ?? string.Empty,
                    TargetWpm = parsedSegment.Segment.TargetWpm,
                    Emotion = parsedSegment.Segment.Emotion,
                    Speaker = parsedSegment.Segment.Speaker
                },
                true,
                parsedSegment.DirectContent);
        }

        foreach (var parsedBlock in parsedSegment.ParsedBlocks)
        {
            yield return new BlockDefinition(parsedBlock.Block, false, parsedBlock.Content);
        }
    }

    private static BlockCandidate CompileBlock(BlockDefinition definition, InheritedFormattingState inherited, DocumentAnalysis analysis)
    {
        var blockInherited = new InheritedFormattingState(
            definition.Block.TargetWpm ?? inherited.TargetWpm,
            TpsSupport.ResolveEmotion(definition.Block.Emotion, inherited.Emotion),
            definition.Block.Speaker ?? inherited.Speaker,
            inherited.SpeedOffsets);

        var content = new TpsContentCompiler().Compile(
            definition.Content?.Text ?? string.Empty,
            definition.Content?.StartOffset ?? 0,
            blockInherited,
            analysis.LineStarts,
            analysis.Diagnostics);

        return new BlockCandidate(
            new CompiledBlock
            {
                Id = definition.Block.Id,
                Name = definition.Block.Name,
                TargetWpm = blockInherited.TargetWpm,
                Emotion = blockInherited.Emotion,
                Speaker = blockInherited.Speaker,
                IsImplicit = definition.IsImplicit
            },
            content);
    }

    private static CompiledScript FinalizeScript(IReadOnlyDictionary<string, string> metadata, IEnumerable<SegmentCandidate> candidates)
    {
        var script = new CompiledScript
        {
            Metadata = new Dictionary<string, string>(metadata, StringComparer.OrdinalIgnoreCase)
        };
        var elapsedMs = 0;
        var wordIndex = 0;

        foreach (var segmentCandidate in candidates)
        {
            var segmentWords = new List<CompiledWord>();
            foreach (var blockCandidate in segmentCandidate.Blocks)
            {
                var finalizedBlock = FinalizeBlock(blockCandidate.Block, blockCandidate.Content, segmentCandidate.Segment.Id, elapsedMs, wordIndex);
                blockCandidate.Block.Words.AddRange(finalizedBlock.Words);
                blockCandidate.Block.Phrases.AddRange(finalizedBlock.Phrases);
                segmentCandidate.Segment.Blocks.Add(blockCandidate.Block);
                segmentWords.AddRange(finalizedBlock.Words);
                script.Words.AddRange(finalizedBlock.Words);
                elapsedMs = finalizedBlock.ElapsedMs;
                wordIndex = finalizedBlock.NextWordIndex;
            }

            segmentCandidate.Segment.Words.AddRange(segmentWords);
            ApplyTimeRange(segmentCandidate.Segment, segmentWords);
            script.Segments.Add(segmentCandidate.Segment);
        }

        script.TotalDurationMs = elapsedMs;
        return script;
    }

    private static FinalizedBlock FinalizeBlock(
        CompiledBlock block,
        ContentCompilationResult content,
        string segmentId,
        int elapsedMs,
        int wordIndex)
    {
        var wordMap = new Dictionary<WordSeed, CompiledWord>();
        var words = new List<CompiledWord>();
        foreach (var seed in content.Words)
        {
            var word = new CompiledWord
            {
                Id = $"word-{wordIndex + 1}",
                Index = wordIndex,
                Kind = seed.Kind,
                CleanText = seed.CleanText,
                CharacterCount = seed.CharacterCount,
                OrpPosition = seed.OrpPosition,
                DisplayDurationMs = seed.DisplayDurationMs,
                StartMs = elapsedMs,
                EndMs = elapsedMs + seed.DisplayDurationMs,
                Metadata = seed.Metadata,
                SegmentId = segmentId,
                BlockId = block.Id,
                PhraseId = string.Empty
            };
            wordMap[seed] = word;
            words.Add(word);
            elapsedMs = word.EndMs;
            wordIndex++;
        }

        var phrases = new List<CompiledPhrase>();
        for (var index = 0; index < content.Phrases.Count; index++)
        {
            var phraseWords = content.Phrases[index].Words.Select(word => wordMap[word]).ToList();
            var phrase = new CompiledPhrase
            {
                Id = $"{block.Id}-phrase-{index + 1}",
                Text = content.Phrases[index].Text,
                StartWordIndex = phraseWords[0].Index,
                EndWordIndex = phraseWords[^1].Index,
                StartMs = phraseWords[0].StartMs,
                EndMs = phraseWords[^1].EndMs,
                Words = phraseWords
            };

            foreach (var word in phraseWords)
            {
                word.PhraseId = phrase.Id;
            }

            phrases.Add(phrase);
        }

        ApplyTimeRange(block, words);
        return new FinalizedBlock(words, phrases, elapsedMs, wordIndex);
    }

    private static void ApplyTimeRange(dynamic target, IReadOnlyList<CompiledWord> words)
    {
        target.StartWordIndex = words.Count == 0 ? 0 : words[0].Index;
        target.EndWordIndex = words.Count == 0 ? target.StartWordIndex : words[^1].Index;
        target.StartMs = words.Count == 0 ? 0 : words[0].StartMs;
        target.EndMs = words.Count == 0 ? target.StartMs : words[^1].EndMs;
    }
}

internal sealed record SegmentCandidate(CompiledSegment Segment, List<BlockCandidate> Blocks);

internal sealed record BlockCandidate(CompiledBlock Block, ContentCompilationResult Content);

internal sealed record BlockDefinition(TpsBlock Block, bool IsImplicit, ContentSection? Content);

internal sealed record FinalizedBlock(List<CompiledWord> Words, List<CompiledPhrase> Phrases, int ElapsedMs, int NextWordIndex);

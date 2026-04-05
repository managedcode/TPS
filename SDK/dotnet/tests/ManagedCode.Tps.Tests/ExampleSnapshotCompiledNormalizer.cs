using System.Text.Json.Nodes;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

internal static class ExampleSnapshotCompiledNormalizer
{
    public static JsonObject NormalizeCompiledScript(CompiledScript script)
    {
        var metadata = new JsonObject();
        foreach (var entry in script.Metadata.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            metadata[entry.Key] = entry.Value;
        }

        var segments = new JsonArray();
        foreach (var segment in script.Segments)
        {
            segments.Add(NormalizeCompiledSegment(segment));
        }

        var words = new JsonArray();
        foreach (var word in script.Words)
        {
            words.Add(NormalizeCompiledWord(word));
        }

        return new JsonObject
        {
            ["metadata"] = metadata,
            ["totalDurationMs"] = script.TotalDurationMs,
            ["segments"] = segments,
            ["words"] = words
        };
    }

    public static JsonObject NormalizeCompiledSegment(CompiledSegment segment)
    {
        var blocks = new JsonArray();
        foreach (var block in segment.Blocks)
        {
            blocks.Add(NormalizeCompiledBlock(block));
        }

        return ExampleSnapshotSupport.Compact(new JsonObject
        {
            ["id"] = segment.Id,
            ["name"] = segment.Name,
            ["targetWpm"] = segment.TargetWpm,
            ["emotion"] = segment.Emotion,
            ["speaker"] = segment.Speaker,
            ["timing"] = segment.Timing,
            ["backgroundColor"] = segment.BackgroundColor,
            ["textColor"] = segment.TextColor,
            ["accentColor"] = segment.AccentColor,
            ["startWordIndex"] = segment.StartWordIndex,
            ["endWordIndex"] = segment.EndWordIndex,
            ["startMs"] = segment.StartMs,
            ["endMs"] = segment.EndMs,
            ["wordIds"] = ExampleSnapshotSupport.ToJsonArray(segment.Words.Select(word => word.Id)),
            ["blocks"] = blocks
        });
    }

    public static JsonObject NormalizeCompiledBlock(CompiledBlock block)
    {
        var phrases = new JsonArray();
        foreach (var phrase in block.Phrases)
        {
            phrases.Add(NormalizeCompiledPhrase(phrase));
        }

        return ExampleSnapshotSupport.Compact(new JsonObject
        {
            ["id"] = block.Id,
            ["name"] = block.Name,
            ["targetWpm"] = block.TargetWpm,
            ["emotion"] = block.Emotion,
            ["speaker"] = block.Speaker,
            ["isImplicit"] = block.IsImplicit,
            ["startWordIndex"] = block.StartWordIndex,
            ["endWordIndex"] = block.EndWordIndex,
            ["startMs"] = block.StartMs,
            ["endMs"] = block.EndMs,
            ["wordIds"] = ExampleSnapshotSupport.ToJsonArray(block.Words.Select(word => word.Id)),
            ["phrases"] = phrases
        });
    }

    public static JsonObject NormalizeCompiledPhrase(CompiledPhrase phrase) =>
        ExampleSnapshotSupport.Compact(new JsonObject
        {
            ["id"] = phrase.Id,
            ["text"] = phrase.Text,
            ["startWordIndex"] = phrase.StartWordIndex,
            ["endWordIndex"] = phrase.EndWordIndex,
            ["startMs"] = phrase.StartMs,
            ["endMs"] = phrase.EndMs,
            ["wordIds"] = ExampleSnapshotSupport.ToJsonArray(phrase.Words.Select(word => word.Id))
        });

    public static JsonObject NormalizeCompiledWord(CompiledWord word) =>
        ExampleSnapshotSupport.Compact(new JsonObject
        {
            ["id"] = word.Id,
            ["index"] = word.Index,
            ["kind"] = word.Kind,
            ["cleanText"] = word.CleanText,
            ["characterCount"] = word.CharacterCount,
            ["orpPosition"] = word.OrpPosition,
            ["displayDurationMs"] = word.DisplayDurationMs,
            ["startMs"] = word.StartMs,
            ["endMs"] = word.EndMs,
            ["metadata"] = NormalizeWordMetadata(word.Metadata),
            ["segmentId"] = word.SegmentId,
            ["blockId"] = word.BlockId,
            ["phraseId"] = word.PhraseId
        });

    public static JsonObject NormalizeWordMetadata(WordMetadata metadata) =>
        ExampleSnapshotSupport.Compact(new JsonObject
        {
            ["isEmphasis"] = metadata.IsEmphasis,
            ["emphasisLevel"] = metadata.EmphasisLevel,
            ["isPause"] = metadata.IsPause,
            ["pauseDurationMs"] = metadata.PauseDurationMs,
            ["isHighlight"] = metadata.IsHighlight,
            ["isBreath"] = metadata.IsBreath,
            ["isEditPoint"] = metadata.IsEditPoint,
            ["editPointPriority"] = metadata.EditPointPriority,
            ["emotionHint"] = metadata.EmotionHint,
            ["inlineEmotionHint"] = metadata.InlineEmotionHint,
            ["volumeLevel"] = metadata.VolumeLevel,
            ["deliveryMode"] = metadata.DeliveryMode,
            ["phoneticGuide"] = metadata.PhoneticGuide,
            ["pronunciationGuide"] = metadata.PronunciationGuide,
            ["stressText"] = metadata.StressText,
            ["stressGuide"] = metadata.StressGuide,
            ["speedOverride"] = metadata.SpeedOverride,
            ["speedMultiplier"] = metadata.SpeedMultiplier is null ? null : ExampleSnapshotSupport.NormalizeNumber(metadata.SpeedMultiplier.Value),
            ["speaker"] = metadata.Speaker,
            ["headCue"] = metadata.HeadCue
        });
}

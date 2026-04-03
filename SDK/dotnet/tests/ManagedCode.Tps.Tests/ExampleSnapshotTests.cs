using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class ExampleSnapshotTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true
    };

    [Fact]
    public void Compile_Examples_MatchSharedCompiledAndPlayerSnapshots()
    {
        foreach (var fileName in ExampleFiles)
        {
            var source = File.ReadAllText(Path.Combine(ExamplesRoot, fileName));
            var result = TpsRuntime.Compile(source);

            Assert.True(result.Ok, fileName);

            var expected = JsonNode.Parse(File.ReadAllText(Path.Combine(ExampleSnapshotsRoot, $"{Path.GetFileNameWithoutExtension(fileName)}.snapshot.json")));
            var actual = BuildExampleSnapshot(fileName, result.Script);

            Assert.True(
                JsonNode.DeepEquals(expected, actual),
                $"Snapshot mismatch for {fileName}{Environment.NewLine}Expected:{Environment.NewLine}{expected!.ToJsonString(JsonOptions)}{Environment.NewLine}{Environment.NewLine}Actual:{Environment.NewLine}{actual.ToJsonString(JsonOptions)}");
        }
    }

    [Fact]
    public void Player_EnumerateStates_WalksThePlaybackTimeline()
    {
        var compiled = TpsRuntime.Compile(File.ReadAllText(Path.Combine(ExamplesRoot, "basic.tps"))).Script;
        var player = new TpsPlayer(compiled);

        var states = player.EnumerateStates(Math.Max(1, compiled.TotalDurationMs / 4)).ToArray();

        Assert.True(states.Length >= 2);
        Assert.Equal(0, states[0].ElapsedMs);
        Assert.Equal(compiled.TotalDurationMs, states[^1].ElapsedMs);
        Assert.True(states[^1].IsComplete);
        Assert.Throws<ArgumentOutOfRangeException>(() => player.EnumerateStates(0).ToArray());
    }

    private static JsonObject BuildExampleSnapshot(string fileName, CompiledScript script)
    {
        var player = new TpsPlayer(script);
        var checkpoints = new JsonArray();
        foreach (var checkpoint in CreateCheckpointTimes(script.TotalDurationMs))
        {
            checkpoints.Add(NormalizePlayerState(checkpoint.Label, player.GetState(checkpoint.ElapsedMs)));
        }

        return new JsonObject
        {
            ["fileName"] = fileName,
            ["source"] = $"examples/{fileName}",
            ["compiled"] = NormalizeCompiledScript(script),
            ["player"] = new JsonObject
            {
                ["checkpoints"] = checkpoints
            }
        };
    }

    private static JsonObject NormalizeCompiledScript(CompiledScript script)
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

    private static JsonObject NormalizeCompiledSegment(CompiledSegment segment)
    {
        var blocks = new JsonArray();
        foreach (var block in segment.Blocks)
        {
            blocks.Add(NormalizeCompiledBlock(block));
        }

        return Compact(new JsonObject
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
            ["wordIds"] = ToJsonArray(segment.Words.Select(word => word.Id)),
            ["blocks"] = blocks
        });
    }

    private static JsonObject NormalizeCompiledBlock(CompiledBlock block)
    {
        var phrases = new JsonArray();
        foreach (var phrase in block.Phrases)
        {
            phrases.Add(NormalizeCompiledPhrase(phrase));
        }

        return Compact(new JsonObject
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
            ["wordIds"] = ToJsonArray(block.Words.Select(word => word.Id)),
            ["phrases"] = phrases
        });
    }

    private static JsonObject NormalizeCompiledPhrase(CompiledPhrase phrase) =>
        Compact(new JsonObject
        {
            ["id"] = phrase.Id,
            ["text"] = phrase.Text,
            ["startWordIndex"] = phrase.StartWordIndex,
            ["endWordIndex"] = phrase.EndWordIndex,
            ["startMs"] = phrase.StartMs,
            ["endMs"] = phrase.EndMs,
            ["wordIds"] = ToJsonArray(phrase.Words.Select(word => word.Id))
        });

    private static JsonObject NormalizeCompiledWord(CompiledWord word) =>
        Compact(new JsonObject
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

    private static JsonObject NormalizeWordMetadata(WordMetadata metadata) =>
        Compact(new JsonObject
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
            ["speedMultiplier"] = metadata.SpeedMultiplier is null ? null : NormalizeNumber(metadata.SpeedMultiplier.Value),
            ["speaker"] = metadata.Speaker,
            ["headCue"] = metadata.HeadCue
        });

    private static JsonObject NormalizePlayerState(string label, PlayerState state) =>
        Compact(new JsonObject
        {
            ["label"] = label,
            ["elapsedMs"] = state.ElapsedMs,
            ["remainingMs"] = state.RemainingMs,
            ["progress"] = NormalizeNumber(state.Progress),
            ["isComplete"] = state.IsComplete,
            ["currentWordIndex"] = state.CurrentWordIndex,
            ["currentWordId"] = state.CurrentWord?.Id,
            ["currentWordText"] = state.CurrentWord?.CleanText,
            ["currentWordKind"] = state.CurrentWord?.Kind,
            ["previousWordId"] = state.PreviousWord?.Id,
            ["nextWordId"] = state.NextWord?.Id,
            ["currentSegmentId"] = state.CurrentSegment?.Id,
            ["currentBlockId"] = state.CurrentBlock?.Id,
            ["currentPhraseId"] = state.CurrentPhrase?.Id,
            ["nextTransitionMs"] = state.NextTransitionMs,
            ["presentation"] = Compact(new JsonObject
            {
                ["segmentName"] = state.Presentation.SegmentName,
                ["blockName"] = state.Presentation.BlockName,
                ["phraseText"] = state.Presentation.PhraseText,
                ["visibleWordIds"] = ToJsonArray(state.Presentation.VisibleWords.Select(word => word.Id)),
                ["visibleWordTexts"] = ToJsonArray(state.Presentation.VisibleWords.Select(word => word.CleanText)),
                ["activeWordInPhrase"] = state.Presentation.ActiveWordInPhrase
            })
        });

    private static JsonArray ToJsonArray(IEnumerable<string> values)
    {
        var array = new JsonArray();
        foreach (var value in values)
        {
            array.Add(value);
        }

        return array;
    }

    private static JsonObject Compact(JsonObject value)
    {
        var toRemove = new List<string>();
        foreach (var property in value)
        {
            if (property.Value is null)
            {
                toRemove.Add(property.Key);
                continue;
            }

            if (property.Value is JsonObject childObject)
            {
                Compact(childObject);
            }
        }

        foreach (var propertyName in toRemove)
        {
            value.Remove(propertyName);
        }

        return value;
    }

    private static double NormalizeNumber(double value) =>
        double.Parse(value.ToString("0.000000", CultureInfo.InvariantCulture), CultureInfo.InvariantCulture);

    private static IEnumerable<(string Label, int ElapsedMs)> CreateCheckpointTimes(int totalDurationMs)
    {
        var checkpoints = new[]
        {
            ("start", 0),
            ("quarter", (int)Math.Round(totalDurationMs * 0.25d, MidpointRounding.AwayFromZero)),
            ("middle", (int)Math.Round(totalDurationMs * 0.5d, MidpointRounding.AwayFromZero)),
            ("threeQuarter", (int)Math.Round(totalDurationMs * 0.75d, MidpointRounding.AwayFromZero)),
            ("complete", totalDurationMs)
        };

        var seen = new HashSet<int>();
        foreach (var checkpoint in checkpoints)
        {
            if (seen.Add(checkpoint.Item2))
            {
                yield return checkpoint;
            }
        }
    }

    private static string ExamplesRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../examples"));

    private static string ExampleSnapshotsRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../SDK/fixtures/examples"));

    private static string[] ExampleFiles => ["basic.tps", "advanced.tps", "multi-segment.tps"];
}

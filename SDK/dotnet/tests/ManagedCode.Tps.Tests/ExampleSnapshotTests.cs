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
        using var session = new TpsPlaybackSession(script);
        using var standalone = TpsStandalonePlayer.FromCompiledScript(script);
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
            },
            ["playback"] = new JsonObject
            {
                ["session"] = BuildPlaybackSequence(session),
                ["standalone"] = BuildPlaybackSequence(standalone)
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

    private static JsonArray BuildPlaybackSequence(TpsPlaybackSession session)
    {
        var checkpoints = new JsonArray
        {
            NormalizePlaybackSnapshot("initial", session.Snapshot)
        };

        session.NextWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextWord", session.Snapshot));
        session.PreviousWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousWord", session.Snapshot));
        session.NextBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextBlock", session.Snapshot));
        session.PreviousBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousBlock", session.Snapshot));
        session.IncreaseSpeed();
        checkpoints.Add(NormalizePlaybackSnapshot("afterIncreaseSpeed", session.Snapshot));
        session.DecreaseSpeed(session.Snapshot.Tempo.SpeedStepWpm);
        checkpoints.Add(NormalizePlaybackSnapshot("afterDecreaseSpeed", session.Snapshot));

        return checkpoints;
    }

    private static JsonArray BuildPlaybackSequence(TpsStandalonePlayer player)
    {
        var checkpoints = new JsonArray
        {
            NormalizePlaybackSnapshot("initial", player.Snapshot)
        };

        player.NextWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextWord", player.Snapshot));
        player.PreviousWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousWord", player.Snapshot));
        player.NextBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextBlock", player.Snapshot));
        player.PreviousBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousBlock", player.Snapshot));
        player.IncreaseSpeed();
        checkpoints.Add(NormalizePlaybackSnapshot("afterIncreaseSpeed", player.Snapshot));
        player.DecreaseSpeed(player.Snapshot.Tempo.SpeedStepWpm);
        checkpoints.Add(NormalizePlaybackSnapshot("afterDecreaseSpeed", player.Snapshot));

        return checkpoints;
    }

    private static JsonObject NormalizePlaybackSnapshot(string label, TpsPlaybackSnapshot snapshot) =>
        Compact(new JsonObject
        {
            ["label"] = label,
            ["status"] = snapshot.Status.ToString().ToLowerInvariant(),
            ["state"] = NormalizePlayerState("state", snapshot.State),
            ["tempo"] = Compact(new JsonObject
            {
                ["baseWpm"] = snapshot.Tempo.BaseWpm,
                ["effectiveBaseWpm"] = snapshot.Tempo.EffectiveBaseWpm,
                ["speedOffsetWpm"] = snapshot.Tempo.SpeedOffsetWpm,
                ["speedStepWpm"] = snapshot.Tempo.SpeedStepWpm,
                ["playbackRate"] = NormalizeNumber(snapshot.Tempo.PlaybackRate)
            }),
            ["controls"] = Compact(new JsonObject
            {
                ["canPlay"] = snapshot.Controls.CanPlay,
                ["canPause"] = snapshot.Controls.CanPause,
                ["canStop"] = snapshot.Controls.CanStop,
                ["canNextWord"] = snapshot.Controls.CanNextWord,
                ["canPreviousWord"] = snapshot.Controls.CanPreviousWord,
                ["canNextBlock"] = snapshot.Controls.CanNextBlock,
                ["canPreviousBlock"] = snapshot.Controls.CanPreviousBlock,
                ["canIncreaseSpeed"] = snapshot.Controls.CanIncreaseSpeed,
                ["canDecreaseSpeed"] = snapshot.Controls.CanDecreaseSpeed
            }),
            ["focusedWordId"] = snapshot.FocusedWord?.Word.Id,
            ["focusedWordText"] = snapshot.FocusedWord?.Word.CleanText,
            ["currentWordDurationMs"] = snapshot.CurrentWordDurationMs,
            ["currentWordRemainingMs"] = snapshot.CurrentWordRemainingMs,
            ["currentSegmentIndex"] = snapshot.CurrentSegmentIndex,
            ["currentBlockIndex"] = snapshot.CurrentBlockIndex,
            ["visibleWords"] = new JsonArray(snapshot.VisibleWords
                .Select(word => Compact(new JsonObject
                {
                    ["id"] = word.Word.Id,
                    ["text"] = word.Word.CleanText,
                    ["isActive"] = word.IsActive,
                    ["isRead"] = word.IsRead,
                    ["isUpcoming"] = word.IsUpcoming,
                    ["emotion"] = word.Emotion,
                    ["speaker"] = word.Speaker,
                    ["emphasisLevel"] = word.EmphasisLevel,
                    ["isHighlighted"] = word.IsHighlighted,
                    ["deliveryMode"] = word.DeliveryMode,
                    ["volumeLevel"] = word.VolumeLevel
                }))
                .ToArray())
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

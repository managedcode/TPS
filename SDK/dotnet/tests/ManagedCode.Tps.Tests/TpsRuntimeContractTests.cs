using System.Text.Json;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsRuntimeContractTests
{
    [Fact]
    public void PublicSurface_ExposesConstantsAndContracts()
    {
        Assert.Equal(140, TpsSpec.DefaultBaseWpm);
        Assert.Equal(TpsSpec.EmotionNames.Neutral, TpsSpec.DefaultEmotion);
        Assert.Equal("WPM", TpsSpec.WpmSuffix);
        Assert.Equal(10, TpsPlaybackDefaults.DefaultSpeedStepWpm);
        Assert.Equal(16, TpsPlaybackDefaults.DefaultTickIntervalMs);
        Assert.Equal(TpsPlaybackEventNames.SnapshotChanged, TpsPlaybackEventNames.SnapshotChanged);
        Assert.Equal(TpsSpec.ArchetypeArticulationExpectations.Legato, TpsSpec.ArchetypeProfiles[TpsSpec.ArchetypeNames.Friend].Articulation);
        Assert.Equal(12, TpsSpec.ArchetypeRhythmMinimumWords);
        Assert.Contains(TpsSpec.DiagnosticCodes.ArchetypeRhythmPauseFrequency, TpsSpec.WarningDiagnosticCodes);
        Assert.Contains(TpsSpec.Tags.Building, TpsSpec.DeliveryModes);
        Assert.Contains(TpsSpec.Tags.Loud, TpsSpec.VolumeLevels);
        Assert.Contains(TpsSpec.Tags.Normal, TpsSpec.RelativeSpeedTags);
        Assert.Contains(TpsSpec.EmotionNames.Motivational, TpsSpec.Emotions);
        Assert.Equal(TpsSpec.SpeedOffsetValues.Xslow, TpsSpec.DefaultSpeedOffsets[TpsSpec.Tags.Xslow]);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Motivator, TpsSpec.ArchetypeRecommendedWpm[TpsSpec.ArchetypeNames.Motivator]);
        Assert.Equal(TpsSpec.EmotionPaletteValues.Warm, TpsSpec.EmotionPalettes[TpsSpec.EmotionNames.Warm]);
        Assert.Equal(TpsSpec.HeadCueCodes.H4, TpsSpec.EmotionHeadCues[TpsSpec.EmotionNames.Urgent]);

        var diagnostic = new TpsDiagnostic(
            TpsSpec.DiagnosticCodes.InvalidHeader,
            TpsSeverity.Error,
            "Invalid header",
            new TpsRange(new TpsPosition(1, 1, 0), new TpsPosition(1, 2, 1)),
            "Fix it");

        Assert.Equal("Invalid header", diagnostic.Message);
        Assert.Equal("Fix it", diagnostic.Suggestion);

        var serializedDiagnostic = JsonSerializer.Serialize(diagnostic);
        Assert.Contains("\"severity\":\"error\"", serializedDiagnostic, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void JsonConverters_RoundTripPortableSeverityAndPlaybackStatusValues()
    {
        Assert.Equal("\"info\"", JsonSerializer.Serialize(TpsSeverity.Info));
        Assert.Equal("\"warning\"", JsonSerializer.Serialize(TpsSeverity.Warning));
        Assert.Equal("\"error\"", JsonSerializer.Serialize(TpsSeverity.Error));
        Assert.Equal(TpsSeverity.Info, JsonSerializer.Deserialize<TpsSeverity>("\"info\""));
        Assert.Equal(TpsSeverity.Warning, JsonSerializer.Deserialize<TpsSeverity>("\"warning\""));
        Assert.Equal(TpsSeverity.Error, JsonSerializer.Deserialize<TpsSeverity>("\"error\""));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<TpsSeverity>("\"mystery\""));

        Assert.Equal("\"idle\"", JsonSerializer.Serialize(TpsPlaybackStatus.Idle));
        Assert.Equal("\"playing\"", JsonSerializer.Serialize(TpsPlaybackStatus.Playing));
        Assert.Equal("\"paused\"", JsonSerializer.Serialize(TpsPlaybackStatus.Paused));
        Assert.Equal("\"completed\"", JsonSerializer.Serialize(TpsPlaybackStatus.Completed));
        Assert.Equal(TpsPlaybackStatus.Idle, JsonSerializer.Deserialize<TpsPlaybackStatus>("\"idle\""));
        Assert.Equal(TpsPlaybackStatus.Playing, JsonSerializer.Deserialize<TpsPlaybackStatus>("\"playing\""));
        Assert.Equal(TpsPlaybackStatus.Paused, JsonSerializer.Deserialize<TpsPlaybackStatus>("\"paused\""));
        Assert.Equal(TpsPlaybackStatus.Completed, JsonSerializer.Deserialize<TpsPlaybackStatus>("\"completed\""));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<TpsPlaybackStatus>("\"mystery\""));
        Assert.Throws<JsonException>(() => JsonSerializer.Serialize((TpsSeverity)999));
        Assert.Throws<JsonException>(() => JsonSerializer.Serialize((TpsPlaybackStatus)999));
    }

    [Fact]
    public void PlaybackOptions_RejectInvalidModernContractValues()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new TpsPlaybackSessionOptions { SpeedStepWpm = 0 });
        Assert.Throws<ArgumentOutOfRangeException>(() => new TpsPlaybackSessionOptions { SpeedStepWpm = -1 });
        Assert.Throws<ArgumentOutOfRangeException>(() => new TpsPlaybackSessionOptions { TickIntervalMs = 0 });
        Assert.Throws<ArgumentNullException>(() => new TpsPlaybackSessionOptions { TimeProvider = null! });
    }

    [Fact]
    public void RuntimeContracts_SerializeToPortableCamelCaseJsonByDefault()
    {
        var compilation = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.");
        using var player = TpsStandalonePlayer.FromCompiledScript(compilation.Script);

        var compilationJson = JsonSerializer.Serialize(compilation);
        var snapshotJson = JsonSerializer.Serialize(player.Snapshot);

        Assert.Contains("\"document\":", compilationJson, StringComparison.Ordinal);
        Assert.Contains("\"script\":", compilationJson, StringComparison.Ordinal);
        Assert.Contains("\"totalDurationMs\":", compilationJson, StringComparison.Ordinal);
        Assert.Contains("\"currentWordIndex\":0", snapshotJson, StringComparison.Ordinal);
        Assert.Contains("\"status\":\"idle\"", snapshotJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"TotalDurationMs\"", compilationJson, StringComparison.Ordinal);
        Assert.DoesNotContain("\"Status\":", snapshotJson, StringComparison.Ordinal);
    }

    [Fact]
    public void StandalonePlayer_CanStartFromCompiledScriptAndCompiledJson()
    {
        var compilation = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.");
        var compiledJson = JsonSerializer.Serialize(compilation.Script);

        using var fromScript = TpsStandalonePlayer.FromCompiledScript(compilation.Script);
        using var fromJson = TpsStandalonePlayer.FromCompiledJson(compiledJson);

        Assert.Equal(compilation.Script.TotalDurationMs, fromScript.Script.TotalDurationMs);
        Assert.Equal(compilation.Script.TotalDurationMs, fromJson.Script.TotalDurationMs);
        Assert.Equal("Ready", fromScript.Snapshot.State.CurrentWord?.CleanText);
        Assert.Equal("Ready", fromJson.Snapshot.State.CurrentWord?.CleanText);
        Assert.False(fromScript.HasSourceCompilation);
        Assert.True(fromScript.HasProjectedDocument);
        Assert.False(fromJson.HasSourceCompilation);
        Assert.Equal(compilation.Script.Metadata.Count, fromJson.Document.Metadata.Count);
        Assert.Equal(compilation.Script.Segments[0].Name, fromJson.Document.Segments[0].Name);
    }

    [Fact]
    public void StandalonePlayer_RestorePath_NormalizesDeserializedCompiledGraphs()
    {
        var compiledJson = JsonSerializer.Serialize(TpsRuntime.Compile("---\nbase_wpm: 150\n---\n## [Signal]\n### [Body]\nReady now.").Script);
        var deserialized = JsonSerializer.Deserialize<CompiledScript>(compiledJson)!;
        var mutableMetadata = Assert.IsType<Dictionary<string, string>>(deserialized.Metadata);
        var mutableSegments = Assert.IsType<List<CompiledSegment>>(deserialized.Segments);
        var mutableBlocks = Assert.IsType<List<CompiledBlock>>(mutableSegments[0].Blocks);

        using var player = TpsStandalonePlayer.FromCompiledScript(deserialized);

        mutableMetadata.Clear();
        mutableBlocks.Clear();
        mutableSegments.Clear();

        Assert.NotEmpty(player.Script.Metadata);
        Assert.NotEmpty(player.Script.Segments);
        Assert.NotEmpty(player.Script.Segments[0].Blocks);
        Assert.False(player.Script.Metadata is Dictionary<string, string>);
        Assert.False(player.Script.Segments is List<CompiledSegment>);
    }

    [Fact]
    public void StandalonePlayer_FromCompiledJson_RejectsEmptyAndMalformedPayloads()
    {
        Assert.Throws<ArgumentException>(() => TpsStandalonePlayer.FromCompiledJson(" "));
        Assert.Throws<JsonException>(() => TpsStandalonePlayer.FromCompiledJson("{"));
        Assert.Throws<JsonException>(() => TpsStandalonePlayer.FromCompiledJson("null"));
    }

}

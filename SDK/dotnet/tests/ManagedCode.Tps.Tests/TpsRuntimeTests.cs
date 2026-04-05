using System.Text.Json;
using System.Text.Json.Nodes;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsRuntimeTests
{
    [Fact]
    public void PublicSurface_ExposesConstantsAndContracts()
    {
        Assert.Equal(140, TpsSpec.DefaultBaseWpm);
        Assert.Equal("neutral", TpsSpec.DefaultEmotion);
        Assert.Equal("WPM", TpsSpec.WpmSuffix);
        Assert.Equal(10, TpsPlaybackDefaults.DefaultSpeedStepWpm);
        Assert.Equal(16, TpsPlaybackDefaults.DefaultTickIntervalMs);
        Assert.Equal("snapshotChanged", TpsPlaybackEventNames.SnapshotChanged);
        Assert.Contains(TpsSpec.Tags.Building, TpsSpec.DeliveryModes);
        Assert.Contains(TpsSpec.Tags.Loud, TpsSpec.VolumeLevels);
        Assert.Contains(TpsSpec.Tags.Normal, TpsSpec.RelativeSpeedTags);
        Assert.Contains("motivational", TpsSpec.Emotions);

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

    [Fact]
    public void RuntimeTransport_MatchesAndRestoresTheCanonicalCompiledJsonFixture()
    {
        var compiled = TpsRuntime.Compile(ReadFixture("valid", "runtime-parity.tps"));
        var serialized = JsonNode.Parse(JsonSerializer.Serialize(compiled.Script));
        var canonical = JsonNode.Parse(ReadFixture("transport", "runtime-parity.compiled.json"));

        Assert.True(JsonNode.DeepEquals(serialized, canonical));

        using var restored = TpsStandalonePlayer.FromCompiledJson(canonical!.ToJsonString());
        Assert.Equal("Call to Action", restored.Snapshot.State.CurrentSegment?.Name);
        Assert.Equal(compiled.Script.TotalDurationMs, restored.Script.TotalDurationMs);
    }

    [Fact]
    public void Validate_ReportsExpectedDiagnosticsForInvalidFixtures()
    {
        foreach (var (fileName, expectedCodes) in LoadInvalidExpectations())
        {
            var result = TpsRuntime.Validate(ReadFixture("invalid", fileName));

            Assert.Equal(expectedCodes, result.Diagnostics.Select(diagnostic => diagnostic.Code).ToArray());
            Assert.All(result.Diagnostics, diagnostic => Assert.True(diagnostic.Range.Start.Line >= 1));
        }
    }

    [Fact]
    public void Compile_RuntimeParityFixture_ProducesExpectedSignals()
    {
        var result = TpsRuntime.Compile(ReadFixture("valid", "runtime-parity.tps"));
        Assert.True(result.Ok);
        Assert.Empty(result.Diagnostics);

        var segment = Assert.Single(result.Script.Segments);
        Assert.Equal("Call to Action", segment.Name);
        Assert.Equal("motivational", segment.Emotion);
        Assert.Equal("Alex", segment.Speaker);

        var block = Assert.Single(segment.Blocks, candidate => candidate.Name == "Closing Block");
        Assert.Equal("energetic", block.Emotion);

        var words = result.Script.Words.Where(word => word.Kind == "word")
            .ToDictionary(word => word.CleanText.TrimEnd('.', '!', '?'), StringComparer.OrdinalIgnoreCase);
        Assert.Equal(180, words["teleprompter"].Metadata.SpeedOverride);
        Assert.Equal("TELE-promp-ter", words["teleprompter"].Metadata.PronunciationGuide);
        Assert.Equal(0.8d, words["carefully"].Metadata.SpeedMultiplier);
        Assert.Equal("loud", words["moment"].Metadata.VolumeLevel);
        Assert.Equal("building", words["moment"].Metadata.DeliveryMode);
        Assert.True(words["moment"].Metadata.IsHighlight);
        Assert.Equal("me", words["announcement"].Metadata.StressText);
        Assert.Equal("de-VE-lop-ment", words["development"].Metadata.StressGuide);

        var pause = Assert.Single(result.Script.Words, word => word.Kind == "pause");
        Assert.Equal(2000, pause.DisplayDurationMs);
        var editPoint = Assert.Single(result.Script.Words, word => word.Kind == "edit-point");
        Assert.Equal("high", editPoint.Metadata.EditPointPriority);
        Assert.Equal(result.Script.TotalDurationMs, result.Script.Words[^1].EndMs);
    }

    [Fact]
    public void ParseAndCompile_ExposeReadOnlyCollections()
    {
        var parsed = TpsRuntime.Parse("## [Signal]\n### [Body]\nReady.");
        var compiled = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady.");

        Assert.False(parsed.Document.Metadata is Dictionary<string, string>);
        Assert.False(parsed.Document.Segments is List<TpsSegment>);
        Assert.False(parsed.Document.Segments[0].Blocks is List<TpsBlock>);

        Assert.False(compiled.Script.Metadata is Dictionary<string, string>);
        Assert.False(compiled.Script.Segments is List<CompiledSegment>);
        Assert.False(compiled.Script.Words is List<CompiledWord>);
        Assert.False(compiled.Script.Segments[0].Blocks is List<CompiledBlock>);
        Assert.False(compiled.Script.Segments[0].Blocks[0].Phrases is List<CompiledPhrase>);
        Assert.False(compiled.Script.Segments[0].Blocks[0].Words is List<CompiledWord>);
    }

    [Fact]
    public void ParseAndCompile_ExposeNoPublicMutableSettersOnRuntimeModels()
    {
        AssertSetterIsNotPublic<TpsSegment>(nameof(TpsSegment.Content));
        AssertSetterIsNotPublic<TpsSegment>(nameof(TpsSegment.LeadingContent));
        AssertSetterIsNotPublic<TpsBlock>(nameof(TpsBlock.Content));
        AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.CleanText));
        AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.CharacterCount));
        AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.OrpPosition));
        AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.PhraseId));
        AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.StartWordIndex));
        AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.EndWordIndex));
        AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.StartMs));
        AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.EndMs));
        AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.StartWordIndex));
        AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.EndWordIndex));
        AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.StartMs));
        AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.EndMs));
        AssertSetterIsNotPublic<CompiledScript>(nameof(CompiledScript.TotalDurationMs));
    }

    [Fact]
    public void Compile_Examples_AreAcceptedWithoutDiagnostics()
    {
        foreach (var example in new[] { "basic.tps", "advanced.tps", "multi-segment.tps" })
        {
            var result = TpsRuntime.Compile(File.ReadAllText(Path.Combine(ExamplesRoot, example)));
            Assert.True(result.Ok, example);
            Assert.Empty(result.Diagnostics);
            Assert.NotEmpty(result.Script.Words);
        }
    }

    [Fact]
    public void Parse_PlainHeadersAndImplicitSegments_AreRecognized()
    {
        const string source = """
        ---
        title: "Front"
        base_wpm: 150
        ---

        # Display

        Intro words.

        ### Body
        Now read this.

        ## [Signal|0:30-1:10|Warm|Speaker:Alex]
        ### [Callout|160WPM]
        Message.
        """;

        var result = TpsRuntime.Parse(source);
        Assert.True(result.Ok);
        Assert.Equal("Display", result.Document.Metadata["title"]);
        Assert.Equal("Display", result.Document.Segments[0].Name);
        Assert.Equal("0:30-1:10", result.Document.Segments[1].Timing);
        Assert.Equal("Alex", result.Document.Segments[1].Speaker);
        Assert.Equal(160, result.Document.Segments[1].Blocks[0].TargetWpm);
    }

    [Fact]
    public void Parse_TrailingNewlines_DoNotLeakIntoSegmentOrBlockContent()
    {
        const string source = """
        ## [Signal|Warm]
        ### [Body]
        Ready.

        """;

        var result = TpsRuntime.Parse(source);

        Assert.True(result.Ok);
        Assert.Equal(string.Empty, result.Document.Segments[0].Content);
        Assert.Equal("Ready.", result.Document.Segments[0].Blocks[0].Content);
    }

    [Fact]
    public void Compile_SegmentBodyWithoutExplicitBlocks_DoesNotDuplicateWords()
    {
        const string source = """
        ## [Intro]
        Hello world.
        """;

        var result = TpsRuntime.Compile(source);

        Assert.True(result.Ok);
        Assert.Equal(["Hello", "world."], result.Script.Words.Select(word => word.CleanText).ToArray());
        Assert.Single(result.Script.Segments[0].Blocks);
        Assert.Equal("Hello world.", result.Script.Segments[0].Blocks[0].Phrases[0].Text);
    }

    [Fact]
    public void Player_ExposesPresentationStateAndCompletion()
    {
        var compiled = TpsRuntime.Compile(ReadFixture("valid", "runtime-parity.tps")).Script;
        var player = new TpsPlayer(compiled);

        var start = player.GetState(0);
        var middle = player.Seek(compiled.TotalDurationMs / 2);
        var done = player.GetState(compiled.TotalDurationMs);

        Assert.Equal("Join", start.CurrentWord?.CleanText);
        Assert.NotEmpty(middle.Presentation.VisibleWords);
        Assert.True(middle.Presentation.ActiveWordInPhrase >= 0);
        Assert.True(done.IsComplete);
        Assert.Equal(0, done.RemainingMs);
        Assert.Equal(compiled.TotalDurationMs, done.NextTransitionMs);
    }

    [Fact]
    public void Player_HandlesEmptyScriptsAndPauseOnlyBlocks()
    {
        var emptyCompiled = TpsRuntime.Compile(string.Empty).Script;
        Assert.Single(emptyCompiled.Segments);
        var emptyState = new TpsPlayer(emptyCompiled).GetState(0);
        Assert.Equal(1d, emptyState.Progress);
        Assert.Equal(-1, emptyState.CurrentWordIndex);
        Assert.Empty(emptyState.Presentation.VisibleWords);
        Assert.Null(emptyState.CurrentWord);

        var pauseOnlyScript = TpsRuntime.Compile("## [Signal]\n### [Body]\n[pause:1s]").Script;
        var pauseState = new TpsPlayer(pauseOnlyScript).GetState(100);
        Assert.Equal("pause", pauseState.CurrentWord?.Kind);
        Assert.Equal(1000, pauseState.NextTransitionMs);
        Assert.Equal(-1, pauseState.Presentation.ActiveWordInPhrase);
    }

    [Fact]
    public void Player_RejectsInvalidCompiledScripts()
    {
        Assert.Throws<ArgumentException>(() => new TpsPlayer(new CompiledScript()));

        var negativeDurationScript = new CompiledScript
        {
            TotalDurationMs = -1,
            Segments =
            [
                CreateSegment("segment-1")
            ]
        };

        Assert.Throws<ArgumentException>(() => new TpsPlayer(negativeDurationScript));

        var missingNestedGraph = new CompiledScript
        {
            TotalDurationMs = 100,
            Segments =
            [
                CreateSegment("segment-1")
            ],
            Words =
            [
                CreateWord("segment-1", "block-2", "phrase-2")
            ]
        };

        Assert.Throws<ArgumentException>(() => new TpsPlayer(missingNestedGraph));
    }

    [Fact]
    public void Player_RejectsNestedGraphsThatDoNotMatchCanonicalCollections()
    {
        var compiledJson = JsonSerializer.Serialize(TpsRuntime.Compile("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.").Script);

        var reorderedBlocks = JsonSerializer.Deserialize<CompiledScript>(compiledJson)!;
        var reorderedSegment = Assert.IsType<List<CompiledSegment>>(reorderedBlocks.Segments)[0];
        Assert.IsType<List<CompiledBlock>>(reorderedSegment.Blocks).Reverse();
        Assert.Throws<ArgumentException>(() => new TpsPlayer(reorderedBlocks));

        var mismatchedPhraseWords = JsonSerializer.Deserialize<CompiledScript>(compiledJson)!;
        var firstBlock = Assert.IsType<List<CompiledSegment>>(mismatchedPhraseWords.Segments)[0].Blocks[0];
        Assert.IsType<List<CompiledWord>>(firstBlock.Phrases[0].Words).Clear();
        Assert.Throws<ArgumentException>(() => new TpsPlayer(mismatchedPhraseWords));
    }

    [Fact]
    public void Player_RejectsAdditionalCompiledGraphDriftCases()
    {
        const string source = """
        ## [Intro]
        ### [Lead]
        Ready.
        ### [Close]
        Now.
        ## [Wrap]
        ### [Body]
        Done.
        """;
        var baseline = JsonNode.Parse(JsonSerializer.Serialize(TpsRuntime.Compile(source).Script))!.AsObject();

        var missingBlocks = MutateCompiledNode(baseline, root => root["segments"]![0]!["blocks"] = new JsonArray());
        Assert.Throws<ArgumentException>(() => new TpsPlayer(missingBlocks));

        var reorderedSegments = MutateCompiledNode(baseline, root =>
        {
            var segments = root["segments"]!.AsArray();
            var first = segments[0]!.DeepClone();
            var second = segments[1]!.DeepClone();
            segments[0] = second;
            segments[1] = first;
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(reorderedSegments));

        var wordMissingPhrase = MutateCompiledNode(baseline, root => root["words"]![0]!["phraseId"] = "");
        Assert.Throws<ArgumentException>(() => new TpsPlayer(wordMissingPhrase));

        var durationMismatch = MutateCompiledNode(baseline, root => root["totalDurationMs"] = 1);
        Assert.Throws<ArgumentException>(() => new TpsPlayer(durationMismatch));

        var blockTimelineGap = MutateCompiledNode(baseline, root =>
        {
            var block = root["segments"]![0]!["blocks"]![1]!;
            block["startWordIndex"] = block["startWordIndex"]!.GetValue<int>() + 1;
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(blockTimelineGap));

        var phraseOutsideBlock = MutateCompiledNode(baseline, root =>
        {
            var segment = root["segments"]![0]!;
            var block = segment["blocks"]![1]!;
            var phrase = block["phrases"]![0]!;
            phrase["endMs"] = block["endMs"]!.GetValue<int>() + 1;
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(phraseOutsideBlock));

        var nestedWordMismatch = MutateCompiledNode(baseline, root =>
        {
            var segment = root["segments"]![0]!;
            var block = segment["blocks"]![1]!;
            block["words"]![0]!["id"] = "ghost-word";
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(nestedWordMismatch));
    }

    [Fact]
    public void Compile_SupportsNestedSpeedScopesEscapesAndMalformedAuthoring()
    {
        var supported = TpsRuntime.Compile("""
        ---
        base_wpm: 140
        ---

        ## [Signal|focused]
        ### [Body]
        [180WPM][slow]*beta*[/slow][normal]**gamma**[/normal][/180WPM] [phonetic:ˈkæməl]camel[/phonetic] literal \/ slash \[tag\]
        """);

        Assert.True(supported.Ok);
        var spoken = supported.Script.Words.Where(word => word.Kind == "word").ToArray();
        Assert.Equal(144, spoken.Single(word => word.CleanText == "beta").Metadata.SpeedOverride);
        Assert.Equal(180, spoken.Single(word => word.CleanText == "gamma").Metadata.SpeedOverride);
        Assert.Equal(2, spoken.Single(word => word.CleanText == "gamma").Metadata.EmphasisLevel);
        Assert.Equal("ˈkæməl", spoken.Single(word => word.CleanText == "camel").Metadata.PhoneticGuide);
        Assert.Contains(spoken, word => word.CleanText == "/");
        Assert.Contains(spoken, word => word.CleanText == "[tag]");

        var malformed = TpsRuntime.Compile("""
        ## [Broken|260WPM|Mystery]

        ### [Body]
        [unknown]tag[/unknown] [edit_point:critical] [slow]dangling
        """);

        Assert.False(malformed.Ok);
        Assert.Equal(
            [
                TpsSpec.DiagnosticCodes.InvalidWpm,
                TpsSpec.DiagnosticCodes.InvalidHeaderParameter,
                TpsSpec.DiagnosticCodes.UnknownTag,
                TpsSpec.DiagnosticCodes.InvalidTagArgument,
                TpsSpec.DiagnosticCodes.UnclosedTag
            ],
            malformed.Diagnostics.Select(diagnostic => diagnostic.Code).ToArray());
        Assert.Contains(
            malformed.Script.Words.Where(word => word.Kind == "word"),
            word => word.CleanText.Contains("[unknown]tag[/unknown]", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_AttachesPunctuationAndDistinguishesSlashPauses()
    {
        var result = TpsRuntime.Compile("""
        ## [Signal|neutral]
        ### [Body]
        A/b stays literal. [emphasis]Done[/emphasis], / dash - restored.
        """);

        Assert.True(result.Ok);
        var spoken = result.Script.Words.Where(word => word.Kind == "word").Select(word => word.CleanText).ToArray();
        Assert.Contains("A/b", spoken);
        Assert.Contains("Done,", spoken);
        Assert.Contains("dash -", spoken);
        Assert.Single(result.Script.Words, word => word.Kind == "pause");
    }

    private static string FixturesRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../SDK/fixtures"));

    private static string ExamplesRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../examples"));

    private static string ReadFixture(string category, string fileName) =>
        File.ReadAllText(Path.Combine(FixturesRoot, category, fileName));

    private static IEnumerable<(string FileName, string[] Codes)> LoadInvalidExpectations()
    {
        using var document = JsonDocument.Parse(File.ReadAllText(Path.Combine(FixturesRoot, "runtime-expectations.json")));
        foreach (var property in document.RootElement.GetProperty("invalidDiagnostics").EnumerateObject())
        {
            yield return (property.Name, property.Value.EnumerateArray().Select(item => item.GetString()!).ToArray());
        }
    }

    private static CompiledScript MutateCompiledNode(JsonObject baseline, Action<JsonObject> mutate)
    {
        var clone = baseline.DeepClone().AsObject();
        mutate(clone);
        return JsonSerializer.Deserialize<CompiledScript>(clone.ToJsonString())!;
    }

    private static CompiledSegment CreateSegment(string id) =>
        new()
        {
            Id = id,
            Name = id,
            TargetWpm = TpsSpec.DefaultBaseWpm,
            Emotion = TpsSpec.DefaultEmotion,
            BackgroundColor = "#000000",
            TextColor = "#ffffff",
            AccentColor = "#cccccc"
        };

    private static CompiledWord CreateWord(string segmentId, string blockId, string phraseId) =>
        new()
        {
            Id = "word-1",
            Index = 0,
            Kind = "word",
            CleanText = "ghost",
            CharacterCount = 5,
            OrpPosition = 1,
            DisplayDurationMs = 100,
            StartMs = 0,
            EndMs = 100,
            Metadata = new WordMetadata { EmotionHint = TpsSpec.DefaultEmotion, HeadCue = TpsSpec.EmotionHeadCues[TpsSpec.DefaultEmotion] },
            SegmentId = segmentId,
            BlockId = blockId,
            PhraseId = phraseId
        };

    private static void AssertSetterIsNotPublic<TContract>(string propertyName)
    {
        var property = typeof(TContract).GetProperty(propertyName);
        Assert.NotNull(property);
        Assert.Null(property.GetSetMethod(nonPublic: false));
    }
}

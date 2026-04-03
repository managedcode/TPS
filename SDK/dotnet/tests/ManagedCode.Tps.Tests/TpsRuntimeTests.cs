using System.Text.Json;
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
        Assert.Contains("\"Severity\":\"error\"", serializedDiagnostic, StringComparison.OrdinalIgnoreCase);
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

        var noSegmentsState = new TpsPlayer(new CompiledScript()).GetState(0);
        Assert.Null(noSegmentsState.CurrentSegment);
        Assert.Null(noSegmentsState.CurrentBlock);
        Assert.Null(noSegmentsState.CurrentPhrase);

        var missingSegmentScript = new CompiledScript
        {
            TotalDurationMs = 100,
            Segments =
            [
                CreateSegment("segment-1")
            ],
            Words =
            [
                CreateWord("segment-2", "block-2", "phrase-2")
            ]
        };
        var missingSegmentState = new TpsPlayer(missingSegmentScript).GetState(0);
        Assert.Null(missingSegmentState.CurrentSegment);
        Assert.Null(missingSegmentState.CurrentBlock);
        Assert.Null(missingSegmentState.CurrentPhrase);

        var missingBlockScript = new CompiledScript
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
        var missingBlockState = new TpsPlayer(missingBlockScript).GetState(0);
        Assert.NotNull(missingBlockState.CurrentSegment);
        Assert.Null(missingBlockState.CurrentBlock);
        Assert.Null(missingBlockState.CurrentPhrase);
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
}

namespace ManagedCode.Tps.Tests;

public sealed class TpsRuntimeParsingTests
{
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
        var spoken = supported.Script.Words.Where(word => word.Kind == TpsSpec.WordKinds.Word).ToArray();
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
            malformed.Script.Words.Where(word => word.Kind == TpsSpec.WordKinds.Word),
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
        var spoken = result.Script.Words.Where(word => word.Kind == TpsSpec.WordKinds.Word).Select(word => word.CleanText).ToArray();
        Assert.Contains("A/b", spoken);
        Assert.Contains("Done,", spoken);
        Assert.Contains("dash -", spoken);
        Assert.Single(result.Script.Words, word => word.Kind == TpsSpec.WordKinds.Pause);
    }
}

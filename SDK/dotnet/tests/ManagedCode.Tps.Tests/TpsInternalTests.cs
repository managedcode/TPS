using ManagedCode.Tps.Internal;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsInternalTests
{
    [Fact]
    public void SupportHelpers_HandleNormalizationAndTiming()
    {
        Assert.Equal(string.Empty, TpsSupport.NormalizeLineEndings(null));
        Assert.Equal("a\nb\nc", TpsSupport.NormalizeLineEndings("a\r\nb\rc"));
        Assert.Equal(new[] { 0, 2 }, TpsSupport.CreateLineStarts("a\nb"));
        Assert.Equal(new TpsPosition(2, 1, 2), TpsSupport.PositionAt(2, [0, 2]));
        Assert.False(TpsSupport.HasErrors([TpsSupport.CreateDiagnostic(TpsSpec.DiagnosticCodes.InvalidHeaderParameter, "warn", 0, 1, [0])]));
        Assert.True(TpsSupport.HasErrors([TpsSupport.CreateDiagnostic(TpsSpec.DiagnosticCodes.InvalidPause, "err", 0, 1, [0])]));
        Assert.Equal("alpha", TpsSupport.NormalizeValue(" alpha "));
        Assert.Null(TpsSupport.NormalizeValue("   "));
        Assert.True(TpsSupport.IsLegacyMetadataKey(TpsSpec.LegacyKeys.XslowOffset));
        Assert.False(TpsSupport.IsKnownEmotion(null));
        Assert.True(TpsSupport.IsKnownEmotion("warm"));
        Assert.False(TpsSupport.IsKnownEmotion("mystery"));
        Assert.Equal("focused", TpsSupport.ResolveEmotion(null, "focused"));
        Assert.Equal(TpsSpec.EmotionPalettes[TpsSpec.DefaultEmotion], TpsSupport.ResolvePalette("mystery"));
        Assert.Equal(160, TpsSupport.ResolveBaseWpm(new Dictionary<string, string> { [TpsSpec.FrontMatterKeys.BaseWpm] = "160" }));
        Assert.Equal(TpsSpec.MinimumWpm, TpsSupport.ResolveBaseWpm(new Dictionary<string, string> { [TpsSpec.FrontMatterKeys.BaseWpm] = "10" }));
        Assert.Equal(TpsSpec.DefaultBaseWpm, TpsSupport.ResolveBaseWpm(new Dictionary<string, string>()));
        Assert.Equal(0.8d, TpsSupport.ResolveSpeedMultiplier("slow", TpsSupport.ResolveSpeedOffsets(new Dictionary<string, string>())));
        Assert.Equal(150, TpsSupport.TryParseAbsoluteWpm("150WPM"));
        Assert.Null(TpsSupport.TryParseAbsoluteWpm("WPM"));
        Assert.True(TpsSupport.IsTimingToken("1:20-2:40"));
        Assert.False(TpsSupport.IsTimingToken(string.Empty));
        Assert.False(TpsSupport.IsTimingToken("1:00-2:00-3:00"));
        Assert.Null(TpsSupport.TryResolvePauseMilliseconds(null));
        Assert.Equal(125, TpsSupport.TryResolvePauseMilliseconds("125ms"));
        Assert.Null(TpsSupport.TryResolvePauseMilliseconds("oopsms"));
        Assert.Equal(1500, TpsSupport.TryResolvePauseMilliseconds("1.5s"));
        Assert.Null(TpsSupport.TryResolvePauseMilliseconds("xs"));
        Assert.Null(TpsSupport.TryResolvePauseMilliseconds("later"));
        Assert.True(TpsSupport.CalculateWordDurationMs("teleprompter", 180) >= 120);
        Assert.Equal(0, TpsSupport.CalculateOrpIndex(string.Empty));
        Assert.Equal(0, TpsSupport.CalculateOrpIndex("a"));
        Assert.Equal(180, TpsSupport.ResolveEffectiveWpm(140, 180, null));
        Assert.Equal(112, TpsSupport.ResolveEffectiveWpm(140, null, 0.8d));
        Assert.True(TpsSupport.IsSentenceEndingPunctuation("ready?"));
        Assert.False(TpsSupport.IsSentenceEndingPunctuation("ready"));
    }

    [Fact]
    public void EscapingAndTextRules_HandleEscapesAndPunctuation()
    {
        Assert.Equal("[tag] / \\ *", TpsEscaping.Restore(TpsEscaping.Protect(@"\[tag\] \/ \\ \*")));
        Assert.Equal(
            [new HeaderPart("One", 0, 3), new HeaderPart("Two|Three", 4, 14)],
            TpsEscaping.SplitHeaderPartsDetailed(@"One|Two\|Three"));
        Assert.False(TpsTextRules.IsStandalonePunctuationToken(null));
        Assert.True(TpsTextRules.IsStandalonePunctuationToken("..."));
        Assert.False(TpsTextRules.IsStandalonePunctuationToken("word"));
        Assert.Equal(" --", TpsTextRules.BuildStandalonePunctuationSuffix("--"));
        Assert.Equal(",", TpsTextRules.BuildStandalonePunctuationSuffix(","));
        Assert.Equal(string.Empty, TpsTextRules.BuildStandalonePunctuationSuffix(""));
    }

    [Fact]
    public void Parser_HandlesImplicitSegmentsAndInvalidHeaders()
    {
        var parser = new TpsParser();
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidFrontMatter, parser.Parse("---\ntitle: Broken").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidHeader, parser.Parse("##").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidHeader, parser.Parse("## \n").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidHeader, parser.Parse("## []").Diagnostics[0].Code);

        var beforeBlock = parser.Parse("Lead text\n### Body\nCopy.");
        Assert.Equal(TpsSpec.DefaultImplicitSegmentName, beforeBlock.Document.Segments[0].Name);
        Assert.Equal("Lead text", beforeBlock.Document.Segments[0].LeadingContent);
        Assert.Equal("Lead text\n### Body\nCopy.", beforeBlock.Source);
        Assert.Equal("##Name", parser.Parse("##Name").Document.Segments[0].Content);
        Assert.Equal(string.Empty, parser.Parse("## [Name|140]\n### [Empty]\n## [Next]").Document.Segments[0].Blocks[0].Content);
        Assert.Single(parser.Parse(string.Empty).Document.Segments);

        var withComments = parser.Parse("---\n# note\nbad-line\nbase_wpm: 150\n---\n## [Name| ]");
        Assert.Equal("150", withComments.Document.Metadata[TpsSpec.FrontMatterKeys.BaseWpm]);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidWpm, parser.Parse("## [Fast|300WPM]").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidWpm, parser.Parse("## [Slow|10WPM]").Diagnostics[0].Code);
        Assert.Equal("150", parser.Parse("---\n\nbase_wpm: 150\n---\n").Document.Metadata[TpsSpec.FrontMatterKeys.BaseWpm]);
        Assert.Equal("Display", parser.Parse("---\nbase_wpm: 150\n---\n\n# Display").Document.Metadata[TpsSpec.FrontMatterKeys.Title]);
        Assert.Equal("150", parser.Parse("---\nbase_wpm: 150\n---").Document.Metadata[TpsSpec.FrontMatterKeys.BaseWpm]);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidFrontMatter, parser.Parse("---\nbase_wpm: fast\n---").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidWpm, parser.Parse("---\nbase_wpm: 10\n---").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidFrontMatter, parser.Parse("---\nspeed_offsets:\n  fast: quick\n---").Diagnostics[0].Code);
    }

    [Fact]
    public void ContentCompiler_HandlesInlineTagsAndDiagnostics()
    {
        var compiler = new TpsContentCompiler();
        var diagnostics = new List<TpsDiagnostic>();
        var inherited = new InheritedFormattingState(140, TpsSpec.DefaultEmotion, null, TpsSupport.ResolveSpeedOffsets(new Dictionary<string, string>()));

        var blank = compiler.Compile("   ", 0, inherited, [0], []);
        Assert.Empty(blank.Words);

        var punctuationOnly = compiler.Compile("...", 0, inherited, [0], []);
        Assert.Empty(punctuationOnly.Words);

        var punctuation = compiler.Compile("hello !", 0, inherited, [0], diagnostics);
        Assert.Equal("hello!", punctuation.Words[0].CleanText);
        Assert.Equal("hello!", punctuation.Phrases[0].Text);

        var afterPause = compiler.Compile("hello / !", 0, inherited, [0], []);
        Assert.Equal("hello!", afterPause.Words[0].CleanText);
        Assert.Contains(afterPause.Words, word => word.Kind == "pause");

        var broken = compiler.Compile("*literal [broken", 0, inherited, TpsSupport.CreateLineStarts("*literal [broken"), diagnostics);
        Assert.Contains(broken.Words, word => word.CleanText.Contains("*literal", StringComparison.Ordinal));
        Assert.Contains(diagnostics, diagnostic => diagnostic.Code == TpsSpec.DiagnosticCodes.UnterminatedTag);

        var missingArgument = compiler.Compile("[phonetic]camel[/phonetic]", 0, inherited, [0], []);
        Assert.Contains(missingArgument.Words, word => word.CleanText.Contains("[phonetic]camel[/phonetic]", StringComparison.Ordinal));

        var invalidEditPointDiagnostics = new List<TpsDiagnostic>();
        var invalidEditPoint = compiler.Compile("[edit_point:critical]", 0, inherited, [0], invalidEditPointDiagnostics);
        Assert.Contains(invalidEditPoint.Words, word => word.CleanText.Contains("[edit_point:critical]", StringComparison.Ordinal));
        Assert.Contains(invalidEditPointDiagnostics, diagnostic => diagnostic.Code == TpsSpec.DiagnosticCodes.InvalidTagArgument);

        var defaultEmotion = compiler.Compile("word", 0, new InheritedFormattingState(140, string.Empty, null, inherited.SpeedOffsets), [0], []);
        Assert.Equal(TpsSpec.EmotionHeadCues[TpsSpec.DefaultEmotion], defaultEmotion.Words[0].Metadata.HeadCue);

        var nestedSpeed = compiler.Compile("[180WPM][slow]*beta*[/slow][normal]**gamma**[/normal][/180WPM]", 0, inherited, [0], []);
        Assert.Equal(144, nestedSpeed.Words[0].Metadata.SpeedOverride);
        Assert.Equal(180, nestedSpeed.Words[1].Metadata.SpeedOverride);

        var controlWord = compiler.Compile("[pause:1s]", 0, new InheritedFormattingState(140, "mystery", null, inherited.SpeedOffsets), [0], []);
        Assert.Equal(TpsSpec.EmotionHeadCues[TpsSpec.DefaultEmotion], controlWord.Words[0].Metadata.HeadCue);

        var accumulator = new TokenAccumulator();
        accumulator.Apply(
            new ActiveInlineState(
                TpsSpec.DefaultEmotion,
                null,
                null,
                0,
                false,
                null,
                null,
                null,
                null,
                null,
                false,
                true,
                180,
                true,
                1.5d),
            ' ');
        Assert.Null(accumulator.BuildWordMetadata(140).SpeedOverride);
    }
}

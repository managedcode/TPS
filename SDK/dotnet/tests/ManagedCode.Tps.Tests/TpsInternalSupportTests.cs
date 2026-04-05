using ManagedCode.Tps.Internal;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsInternalSupportTests
{
    [Fact]
    public void Parser_HandlesImplicitSegmentsAndInvalidHeaders()
    {
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidFrontMatter, TpsParser.Parse("---\ntitle: Broken").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidHeader, TpsParser.Parse("##").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidHeader, TpsParser.Parse("## \n").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidHeader, TpsParser.Parse("## []").Diagnostics[0].Code);

        var beforeBlock = TpsParser.Parse("Lead text\n### Body\nCopy.");
        Assert.Equal(TpsSpec.DefaultImplicitSegmentName, beforeBlock.Document.Segments[0].Name);
        Assert.Equal("Lead text", beforeBlock.Document.Segments[0].LeadingContent);
        Assert.Equal("Lead text\n### Body\nCopy.", beforeBlock.Source);
        Assert.Equal("##Name", TpsParser.Parse("##Name").Document.Segments[0].Content);
        Assert.Equal(string.Empty, TpsParser.Parse("## [Name|140]\n### [Empty]\n## [Next]").Document.Segments[0].Blocks[0].Content);
        Assert.Single(TpsParser.Parse(string.Empty).Document.Segments);

        var withComments = TpsParser.Parse("---\n# note\nbad-line\nbase_wpm: 150\n---\n## [Name| ]");
        Assert.Equal("150", withComments.Document.Metadata[TpsSpec.FrontMatterKeys.BaseWpm]);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidWpm, TpsParser.Parse("## [Fast|300WPM]").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidWpm, TpsParser.Parse("## [Slow|10WPM]").Diagnostics[0].Code);
        Assert.Equal("150", TpsParser.Parse("---\n\nbase_wpm: 150\n---\n").Document.Metadata[TpsSpec.FrontMatterKeys.BaseWpm]);
        Assert.Equal("Display", TpsParser.Parse("---\nbase_wpm: 150\n---\n\n# Display").Document.Metadata[TpsSpec.FrontMatterKeys.Title]);
        Assert.Equal("150", TpsParser.Parse("---\nbase_wpm: 150\n---").Document.Metadata[TpsSpec.FrontMatterKeys.BaseWpm]);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidFrontMatter, TpsParser.Parse("---\nbase_wpm: fast\n---").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidWpm, TpsParser.Parse("---\nbase_wpm: 10\n---").Diagnostics[0].Code);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidFrontMatter, TpsParser.Parse("---\nspeed_offsets:\n  fast: quick\n---").Diagnostics[0].Code);
    }

    [Fact]
    public void ContentCompiler_HandlesInlineTagsAndDiagnostics()
    {
        var diagnostics = new List<TpsDiagnostic>();
        var inherited = new InheritedFormattingState(140, TpsSpec.DefaultEmotion, null, TpsSupport.ResolveSpeedOffsets(new Dictionary<string, string>()));

        var blank = TpsContentCompiler.Compile("   ", 0, inherited, [0], []);
        Assert.Empty(blank.Words);

        var punctuationOnly = TpsContentCompiler.Compile("...", 0, inherited, [0], []);
        Assert.Empty(punctuationOnly.Words);

        var punctuation = TpsContentCompiler.Compile("hello !", 0, inherited, [0], diagnostics);
        Assert.Equal("hello!", punctuation.Words[0].CleanText);
        Assert.Equal("hello!", punctuation.Phrases[0].Text);

        var afterPause = TpsContentCompiler.Compile("hello / !", 0, inherited, [0], []);
        Assert.Equal("hello!", afterPause.Words[0].CleanText);
        Assert.Contains(afterPause.Words, word => word.Kind == TpsSpec.WordKinds.Pause);

        var broken = TpsContentCompiler.Compile("*literal [broken", 0, inherited, TpsSupport.CreateLineStarts("*literal [broken"), diagnostics);
        Assert.Contains(broken.Words, word => word.CleanText.Contains("*literal", StringComparison.Ordinal));
        Assert.Contains(diagnostics, diagnostic => diagnostic.Code == TpsSpec.DiagnosticCodes.UnterminatedTag);

        var missingArgument = TpsContentCompiler.Compile("[phonetic]camel[/phonetic]", 0, inherited, [0], []);
        Assert.Contains(missingArgument.Words, word => word.CleanText.Contains("[phonetic]camel[/phonetic]", StringComparison.Ordinal));

        var invalidEditPointDiagnostics = new List<TpsDiagnostic>();
        var invalidEditPoint = TpsContentCompiler.Compile("[edit_point:critical]", 0, inherited, [0], invalidEditPointDiagnostics);
        Assert.Contains(invalidEditPoint.Words, word => word.CleanText.Contains("[edit_point:critical]", StringComparison.Ordinal));
        Assert.Contains(invalidEditPointDiagnostics, diagnostic => diagnostic.Code == TpsSpec.DiagnosticCodes.InvalidTagArgument);

        var defaultEmotion = TpsContentCompiler.Compile("word", 0, new InheritedFormattingState(140, string.Empty, null, inherited.SpeedOffsets), [0], []);
        Assert.Equal(TpsSpec.EmotionHeadCues[TpsSpec.DefaultEmotion], defaultEmotion.Words[0].Metadata.HeadCue);

        var nestedSpeed = TpsContentCompiler.Compile("[180WPM][slow]*beta*[/slow][normal]**gamma**[/normal][/180WPM]", 0, inherited, [0], []);
        Assert.Equal(144, nestedSpeed.Words[0].Metadata.SpeedOverride);
        Assert.Equal(180, nestedSpeed.Words[1].Metadata.SpeedOverride);

        var controlWord = TpsContentCompiler.Compile("[pause:1s]", 0, new InheritedFormattingState(140, "mystery", null, inherited.SpeedOffsets), [0], []);
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

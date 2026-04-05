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
        Assert.Contains(afterPause.Words, word => word.Kind == "pause");

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

    [Fact]
    public void Articulation_LegatoSetsArticulationStyle()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[legato]hello[/legato]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal("legato", word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_StaccatoSetsArticulationStyle()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[staccato]hello[/staccato]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal("staccato", word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_NoTagLeavesNull()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\nhello");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Null(word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_NestedInnermostWins()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[legato][staccato]inner[/staccato] outer[/legato]");
        var words = result.Script.Words.Where(w => w.Kind == "word").ToList();
        Assert.Equal("staccato", words.First(w => w.CleanText == "inner").Metadata.ArticulationStyle);
        Assert.Equal("legato", words.First(w => w.CleanText == "outer").Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_StacksWithVolume()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[staccato][loud]cmd[/loud][/staccato]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal("staccato", word.Metadata.ArticulationStyle);
        Assert.Equal("loud", word.Metadata.VolumeLevel);
    }

    [Fact]
    public void Articulation_CaseInsensitive()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[LEGATO]hello[/LEGATO]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal("legato", word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_UnclosedProducesDiagnostic()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[legato]hello");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.UnclosedTag);
    }

    [Fact]
    public void Energy_MinimumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:1]hello[/energy]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal(1, word.Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_MaximumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:10]hello[/energy]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal(10, word.Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_AppliedToAllWords()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:7]three words here[/energy]");
        var words = result.Script.Words.Where(w => w.Kind == "word").ToList();
        Assert.Equal(3, words.Count);
        Assert.All(words, w => Assert.Equal(7, w.Metadata.EnergyLevel));
    }

    [Fact]
    public void Energy_NestedInnermostWins()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:5][energy:9]inner[/energy] outer[/energy]");
        var words = result.Script.Words.Where(w => w.Kind == "word").ToList();
        Assert.Equal(9, words.First(w => w.CleanText == "inner").Metadata.EnergyLevel);
        Assert.Equal(5, words.First(w => w.CleanText == "outer").Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_NoTagLeavesNull()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\nhello");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Null(word.Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_InvalidAboveMax()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:11]hello[/energy]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
    }

    [Fact]
    public void Energy_InvalidZero()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:0]hello[/energy]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
    }

    [Fact]
    public void Energy_InvalidNegative()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:-1]hello[/energy]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
    }

    [Fact]
    public void Energy_InvalidNonNumeric()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:abc]hello[/energy]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
    }

    [Fact]
    public void Energy_InvalidNoArgument()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy]hello[/energy]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
    }

    [Fact]
    public void Energy_DecimalProducesDiagnostic()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:5.5]hello[/energy]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
    }

    [Fact]
    public void Melody_MinimumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:1]hello[/melody]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal(1, word.Metadata.MelodyLevel);
    }

    [Fact]
    public void Melody_MaximumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:10]hello[/melody]");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Equal(10, word.Metadata.MelodyLevel);
    }

    [Fact]
    public void Melody_NestedInnermostWins()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:3][melody:8]inner[/melody] outer[/melody]");
        var words = result.Script.Words.Where(w => w.Kind == "word").ToList();
        Assert.Equal(8, words.First(w => w.CleanText == "inner").Metadata.MelodyLevel);
        Assert.Equal(3, words.First(w => w.CleanText == "outer").Metadata.MelodyLevel);
    }

    [Fact]
    public void Melody_InvalidAboveMax()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:11]hello[/melody]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
    }

    [Fact]
    public void Melody_InvalidZero()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:0]hello[/melody]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
    }

    [Fact]
    public void Melody_InvalidNonNumeric()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:abc]hello[/melody]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
    }

    [Fact]
    public void Melody_InvalidNoArgument()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody]hello[/melody]");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
    }

    [Fact]
    public void Melody_NoTagLeavesNull()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\nhello");
        var word = result.Script.Words.First(w => w.Kind == "word");
        Assert.Null(word.Metadata.MelodyLevel);
    }

    [Fact]
    public void Archetype_SegmentCoach()
    {
        var result = TpsRuntime.Compile("## [Name|Archetype:Coach]\nhello");
        Assert.Equal("coach", result.Script.Segments[0].Archetype);
    }

    [Fact]
    public void Archetype_BlockFriend()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body|Archetype:Friend]\nhello");
        Assert.Equal("friend", result.Script.Segments[0].Blocks[0].Archetype);
    }

    [Fact]
    public void Archetype_BlockInheritsFromSegment()
    {
        var result = TpsRuntime.Compile("## [Seg|Archetype:Coach]\n### [Body]\nhello");
        Assert.Equal("coach", result.Script.Segments[0].Archetype);
        Assert.Equal("coach", result.Script.Segments[0].Blocks[0].Archetype);
    }

    [Fact]
    public void Archetype_BlockOverridesSegment()
    {
        var result = TpsRuntime.Compile("## [Seg|Archetype:Coach]\n### [Body|Archetype:Friend]\nhello");
        Assert.Equal("coach", result.Script.Segments[0].Archetype);
        Assert.Equal("friend", result.Script.Segments[0].Blocks[0].Archetype);
    }

    [Theory]
    [InlineData("Friend", "friend", 135)]
    [InlineData("Motivator", "motivator", 155)]
    [InlineData("Educator", "educator", 120)]
    [InlineData("Coach", "coach", 145)]
    [InlineData("Storyteller", "storyteller", 125)]
    [InlineData("Entertainer", "entertainer", 150)]
    public void Archetype_SetsRecommendedWpm(string input, string expected, int expectedWpm)
    {
        var result = TpsRuntime.Compile($"## [Name|Archetype:{input}]\nhello");
        Assert.Equal(expected, result.Script.Segments[0].Archetype);
        Assert.Equal(expectedWpm, result.Script.Segments[0].TargetWpm);
    }

    [Fact]
    public void Archetype_ExplicitWpmOverrides()
    {
        var result = TpsRuntime.Compile("## [Name|160|Archetype:Coach]\nhello");
        Assert.Equal("coach", result.Script.Segments[0].Archetype);
        Assert.Equal(160, result.Script.Segments[0].TargetWpm);
    }

    [Fact]
    public void Archetype_CaseInsensitive()
    {
        var result = TpsRuntime.Compile("## [Name|Archetype:COACH]\nhello");
        Assert.Equal("coach", result.Script.Segments[0].Archetype);
    }

    [Fact]
    public void Archetype_UnknownProducesDiagnostic()
    {
        var result = TpsRuntime.Compile("## [Name|Archetype:Unknown]\nhello");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.UnknownArchetype);
    }

    [Fact]
    public void Archetype_EmptyProducesDiagnostic()
    {
        var result = TpsRuntime.Compile("## [Name|Archetype:]\nhello");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.UnknownArchetype);
    }

    [Fact]
    public void Archetype_NoArchetypeLeavesNull()
    {
        var result = TpsRuntime.Compile("## [Name]\nhello");
        Assert.Null(result.Script.Segments[0].Archetype);
    }

    [Fact]
    public void Archetype_WithOtherParamsInAnyOrder()
    {
        var result = TpsRuntime.Compile("## [Name|warm|Archetype:Motivator|Speaker:Alice]\nhello");
        Assert.Equal("motivator", result.Script.Segments[0].Archetype);
        Assert.Equal("Alice", result.Script.Segments[0].Speaker);
        Assert.Equal("warm", result.Script.Segments[0].Emotion);
    }

    [Fact]
    public void Archetype_ImplicitBlocksInherit()
    {
        var result = TpsRuntime.Compile("## [Seg|Archetype:Educator]\nhello world");
        Assert.Equal("educator", result.Script.Segments[0].Archetype);
        Assert.Equal("educator", result.Script.Segments[0].Blocks[0].Archetype);
        Assert.Equal(120, result.Script.Segments[0].Blocks[0].TargetWpm);
    }

    [Fact]
    public void Combined_FullEndToEnd()
    {
        var result = TpsRuntime.Compile("## [Rally|Motivational|Archetype:Motivator]\n### [Body]\n[legato][energy:9][melody:8]Rise up.[/melody][/energy][/legato]");
        Assert.Equal("motivator", result.Script.Segments[0].Archetype);
        Assert.Equal(155, result.Script.Segments[0].TargetWpm);

        var words = result.Script.Words.Where(w => w.Kind == "word").ToList();
        Assert.True(words.Count >= 1);
        var firstWord = words[0];
        Assert.Equal("legato", firstWord.Metadata.ArticulationStyle);
        Assert.Equal(9, firstWord.Metadata.EnergyLevel);
        Assert.Equal(8, firstWord.Metadata.MelodyLevel);
    }

    [Fact]
    public void Constants_ArchetypesContainsAll()
    {
        Assert.Equal(6, TpsSpec.Archetypes.Count);
        Assert.Contains("friend", TpsSpec.Archetypes);
        Assert.Contains("motivator", TpsSpec.Archetypes);
        Assert.Contains("educator", TpsSpec.Archetypes);
        Assert.Contains("coach", TpsSpec.Archetypes);
        Assert.Contains("storyteller", TpsSpec.Archetypes);
        Assert.Contains("entertainer", TpsSpec.Archetypes);
    }

    [Fact]
    public void Constants_ArticulationStylesContainsLegatoAndStaccato()
    {
        Assert.Equal(2, TpsSpec.ArticulationStyles.Count);
        Assert.Contains(TpsSpec.Tags.Legato, TpsSpec.ArticulationStyles);
        Assert.Contains(TpsSpec.Tags.Staccato, TpsSpec.ArticulationStyles);
    }

    [Fact]
    public void Constants_ArchetypeRecommendedWpmValues()
    {
        Assert.Equal(135, TpsSpec.ArchetypeRecommendedWpm["friend"]);
        Assert.Equal(155, TpsSpec.ArchetypeRecommendedWpm["motivator"]);
        Assert.Equal(120, TpsSpec.ArchetypeRecommendedWpm["educator"]);
        Assert.Equal(145, TpsSpec.ArchetypeRecommendedWpm["coach"]);
        Assert.Equal(125, TpsSpec.ArchetypeRecommendedWpm["storyteller"]);
        Assert.Equal(150, TpsSpec.ArchetypeRecommendedWpm["entertainer"]);
    }

    [Fact]
    public void Constants_EnergyAndMelodyBounds()
    {
        Assert.Equal(1, TpsSpec.EnergyLevelMin);
        Assert.Equal(10, TpsSpec.EnergyLevelMax);
        Assert.Equal(1, TpsSpec.MelodyLevelMin);
        Assert.Equal(10, TpsSpec.MelodyLevelMax);
    }

    [Fact]
    public void Constants_TagsExist()
    {
        Assert.Equal("energy", TpsSpec.Tags.Energy);
        Assert.Equal("legato", TpsSpec.Tags.Legato);
        Assert.Equal("melody", TpsSpec.Tags.Melody);
        Assert.Equal("staccato", TpsSpec.Tags.Staccato);
    }

    [Fact]
    public void Constants_ArchetypePrefix()
    {
        Assert.Equal("Archetype:", TpsSpec.ArchetypePrefix);
    }

    [Fact]
    public void Constants_DiagnosticCodesExist()
    {
        Assert.Equal("invalid-energy-level", TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
        Assert.Equal("invalid-melody-level", TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
        Assert.Equal("unknown-archetype", TpsSpec.DiagnosticCodes.UnknownArchetype);
        Assert.Equal("unclosed-tag", TpsSpec.DiagnosticCodes.UnclosedTag);
    }
}

namespace ManagedCode.Tps.Tests;

public sealed class TpsInternalArchetypeTests
{
    [Fact]
    public void Archetype_SegmentAndBlockScopes_AreAssigned()
    {
        Assert.Equal(TpsSpec.ArchetypeNames.Coach, TpsRuntime.Compile("## [Name|Archetype:Coach]\nhello").Script.Segments[0].Archetype);
        Assert.Equal(TpsSpec.ArchetypeNames.Friend, TpsRuntime.Compile("## [Seg]\n### [Body|Archetype:Friend]\nhello").Script.Segments[0].Blocks[0].Archetype);

        var inherited = TpsRuntime.Compile("## [Seg|Archetype:Coach]\n### [Body]\nhello").Script;
        Assert.Equal(TpsSpec.ArchetypeNames.Coach, inherited.Segments[0].Archetype);
        Assert.Equal(TpsSpec.ArchetypeNames.Coach, inherited.Segments[0].Blocks[0].Archetype);

        var overridden = TpsRuntime.Compile("## [Seg|Archetype:Coach]\n### [Body|Archetype:Friend]\nhello").Script;
        Assert.Equal(TpsSpec.ArchetypeNames.Coach, overridden.Segments[0].Archetype);
        Assert.Equal(TpsSpec.ArchetypeNames.Friend, overridden.Segments[0].Blocks[0].Archetype);
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
    public void Archetype_MetadataBehavesConsistently()
    {
        var explicitWpm = TpsRuntime.Compile("## [Name|160|Archetype:Coach]\nhello");
        Assert.Equal(TpsSpec.ArchetypeNames.Coach, explicitWpm.Script.Segments[0].Archetype);
        Assert.Equal(160, explicitWpm.Script.Segments[0].TargetWpm);

        Assert.Equal(TpsSpec.ArchetypeNames.Coach, TpsRuntime.Compile("## [Name|Archetype:COACH]\nhello").Script.Segments[0].Archetype);
        Assert.Contains(TpsRuntime.Compile("## [Name|Archetype:Unknown]\nhello").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.UnknownArchetype);
        Assert.Contains(TpsRuntime.Compile("## [Name|Archetype:]\nhello").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.UnknownArchetype);
        Assert.Null(TpsRuntime.Compile("## [Name]\nhello").Script.Segments[0].Archetype);

        var mixed = TpsRuntime.Compile("## [Name|warm|Archetype:Motivator|Speaker:Alice]\nhello").Script.Segments[0];
        Assert.Equal(TpsSpec.ArchetypeNames.Motivator, mixed.Archetype);
        Assert.Equal("Alice", mixed.Speaker);
        Assert.Equal(TpsSpec.EmotionNames.Warm, mixed.Emotion);

        var implicitBlock = TpsRuntime.Compile("## [Seg|Archetype:Educator]\nhello world").Script.Segments[0];
        Assert.Equal(TpsSpec.ArchetypeNames.Educator, implicitBlock.Archetype);
        Assert.Equal(TpsSpec.ArchetypeNames.Educator, implicitBlock.Blocks[0].Archetype);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Educator, implicitBlock.Blocks[0].TargetWpm);
    }

    [Fact]
    public void Combined_FullEndToEnd()
    {
        var result = TpsRuntime.Compile("## [Rally|Motivational|Archetype:Motivator]\n### [Body]\n[legato][energy:9][melody:8]Rise up.[/melody][/energy][/legato]");
        Assert.Equal(TpsSpec.ArchetypeNames.Motivator, result.Script.Segments[0].Archetype);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Motivator, result.Script.Segments[0].TargetWpm);

        var firstWord = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(TpsSpec.Tags.Legato, firstWord.Metadata.ArticulationStyle);
        Assert.Equal(9, firstWord.Metadata.EnergyLevel);
        Assert.Equal(8, firstWord.Metadata.MelodyLevel);
    }

    [Fact]
    public void Constants_ExposeArchetypeCatalogsAndBounds()
    {
        Assert.Equal(6, TpsSpec.Archetypes.Count);
        Assert.Contains(TpsSpec.ArchetypeNames.Friend, TpsSpec.Archetypes);
        Assert.Contains(TpsSpec.ArchetypeNames.Motivator, TpsSpec.Archetypes);
        Assert.Contains(TpsSpec.ArchetypeNames.Educator, TpsSpec.Archetypes);
        Assert.Contains(TpsSpec.ArchetypeNames.Coach, TpsSpec.Archetypes);
        Assert.Contains(TpsSpec.ArchetypeNames.Storyteller, TpsSpec.Archetypes);
        Assert.Contains(TpsSpec.ArchetypeNames.Entertainer, TpsSpec.Archetypes);

        Assert.Equal(2, TpsSpec.ArticulationStyles.Count);
        Assert.Contains(TpsSpec.Tags.Legato, TpsSpec.ArticulationStyles);
        Assert.Contains(TpsSpec.Tags.Staccato, TpsSpec.ArticulationStyles);

        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Friend, TpsSpec.ArchetypeRecommendedWpm[TpsSpec.ArchetypeNames.Friend]);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Motivator, TpsSpec.ArchetypeRecommendedWpm[TpsSpec.ArchetypeNames.Motivator]);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Educator, TpsSpec.ArchetypeRecommendedWpm[TpsSpec.ArchetypeNames.Educator]);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Coach, TpsSpec.ArchetypeRecommendedWpm[TpsSpec.ArchetypeNames.Coach]);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Storyteller, TpsSpec.ArchetypeRecommendedWpm[TpsSpec.ArchetypeNames.Storyteller]);
        Assert.Equal(TpsSpec.ArchetypeRecommendedWpmValues.Entertainer, TpsSpec.ArchetypeRecommendedWpm[TpsSpec.ArchetypeNames.Entertainer]);

        Assert.Equal(TpsSpec.EnergyLevelMin, 1);
        Assert.Equal(TpsSpec.EnergyLevelMax, 10);
        Assert.Equal(TpsSpec.MelodyLevelMin, 1);
        Assert.Equal(TpsSpec.MelodyLevelMax, 10);
        Assert.Equal(TpsSpec.Tags.Energy, "energy");
        Assert.Equal(TpsSpec.Tags.Legato, "legato");
        Assert.Equal(TpsSpec.Tags.Melody, "melody");
        Assert.Equal(TpsSpec.Tags.Staccato, "staccato");
        Assert.Equal("Archetype:", TpsSpec.ArchetypePrefix);
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidEnergyLevel, "invalid-energy-level");
        Assert.Equal(TpsSpec.DiagnosticCodes.InvalidMelodyLevel, "invalid-melody-level");
        Assert.Equal(TpsSpec.DiagnosticCodes.UnknownArchetype, "unknown-archetype");
        Assert.Equal(TpsSpec.DiagnosticCodes.UnclosedTag, "unclosed-tag");
    }
}

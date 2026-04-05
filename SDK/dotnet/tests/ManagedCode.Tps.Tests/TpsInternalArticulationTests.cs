namespace ManagedCode.Tps.Tests;

public sealed class TpsInternalArticulationTests
{
    [Fact]
    public void Articulation_LegatoSetsArticulationStyle()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[legato]hello[/legato]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(TpsSpec.Tags.Legato, word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_StaccatoSetsArticulationStyle()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[staccato]hello[/staccato]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(TpsSpec.Tags.Staccato, word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_NoTagLeavesNull()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\nhello");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Null(word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_NestedInnermostWins()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[legato][staccato]inner[/staccato] outer[/legato]");
        var words = result.Script.Words.Where(w => w.Kind == TpsSpec.WordKinds.Word).ToList();
        Assert.Equal(TpsSpec.Tags.Staccato, words.First(w => w.CleanText == "inner").Metadata.ArticulationStyle);
        Assert.Equal(TpsSpec.Tags.Legato, words.First(w => w.CleanText == "outer").Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_StacksWithVolume()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[staccato][loud]cmd[/loud][/staccato]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(TpsSpec.Tags.Staccato, word.Metadata.ArticulationStyle);
        Assert.Equal(TpsSpec.Tags.Loud, word.Metadata.VolumeLevel);
    }

    [Fact]
    public void Articulation_CaseInsensitive()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[LEGATO]hello[/LEGATO]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(TpsSpec.Tags.Legato, word.Metadata.ArticulationStyle);
    }

    [Fact]
    public void Articulation_UnclosedProducesDiagnostic()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[legato]hello");
        Assert.Contains(result.Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.UnclosedTag);
    }
}

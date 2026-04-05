namespace ManagedCode.Tps.Tests;

public sealed class TpsInternalEnergyTests
{
    [Fact]
    public void Energy_MinimumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:1]hello[/energy]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(1, word.Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_MaximumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:10]hello[/energy]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(10, word.Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_AppliedToAllWords()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:7]three words here[/energy]");
        var words = result.Script.Words.Where(w => w.Kind == TpsSpec.WordKinds.Word).ToList();
        Assert.Equal(3, words.Count);
        Assert.All(words, w => Assert.Equal(7, w.Metadata.EnergyLevel));
    }

    [Fact]
    public void Energy_NestedInnermostWins()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:5][energy:9]inner[/energy] outer[/energy]");
        var words = result.Script.Words.Where(w => w.Kind == TpsSpec.WordKinds.Word).ToList();
        Assert.Equal(9, words.First(w => w.CleanText == "inner").Metadata.EnergyLevel);
        Assert.Equal(5, words.First(w => w.CleanText == "outer").Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_NoTagLeavesNull()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\nhello");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Null(word.Metadata.EnergyLevel);
    }

    [Fact]
    public void Energy_InvalidValuesProduceDiagnostics()
    {
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:11]hello[/energy]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:0]hello[/energy]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:-1]hello[/energy]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:abc]hello[/energy]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy]hello[/energy]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[energy:5.5]hello[/energy]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidEnergyLevel);
    }
}

namespace ManagedCode.Tps.Tests;

public sealed class TpsInternalMelodyTests
{
    [Fact]
    public void Melody_MinimumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:1]hello[/melody]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(1, word.Metadata.MelodyLevel);
    }

    [Fact]
    public void Melody_MaximumLevel()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:10]hello[/melody]");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Equal(10, word.Metadata.MelodyLevel);
    }

    [Fact]
    public void Melody_NestedInnermostWins()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:3][melody:8]inner[/melody] outer[/melody]");
        var words = result.Script.Words.Where(w => w.Kind == TpsSpec.WordKinds.Word).ToList();
        Assert.Equal(8, words.First(w => w.CleanText == "inner").Metadata.MelodyLevel);
        Assert.Equal(3, words.First(w => w.CleanText == "outer").Metadata.MelodyLevel);
    }

    [Fact]
    public void Melody_InvalidValuesProduceDiagnostics()
    {
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:11]hello[/melody]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:0]hello[/melody]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody:abc]hello[/melody]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
        Assert.Contains(TpsRuntime.Compile("## [Seg]\n### [Body]\n[melody]hello[/melody]").Diagnostics, d => d.Code == TpsSpec.DiagnosticCodes.InvalidMelodyLevel);
    }

    [Fact]
    public void Melody_NoTagLeavesNull()
    {
        var result = TpsRuntime.Compile("## [Seg]\n### [Body]\nhello");
        var word = result.Script.Words.First(w => w.Kind == TpsSpec.WordKinds.Word);
        Assert.Null(word.Metadata.MelodyLevel);
    }
}

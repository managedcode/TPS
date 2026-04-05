using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsRuntimeModelTests
{
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
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<TpsSegment>(nameof(TpsSegment.Content));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<TpsSegment>(nameof(TpsSegment.LeadingContent));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<TpsBlock>(nameof(TpsBlock.Content));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.CleanText));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.CharacterCount));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.OrpPosition));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledWord>(nameof(CompiledWord.PhraseId));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.StartWordIndex));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.EndWordIndex));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.StartMs));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledBlock>(nameof(CompiledBlock.EndMs));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.StartWordIndex));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.EndWordIndex));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.StartMs));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledSegment>(nameof(CompiledSegment.EndMs));
        TpsRuntimeTestSupport.AssertSetterIsNotPublic<CompiledScript>(nameof(CompiledScript.TotalDurationMs));
    }
}

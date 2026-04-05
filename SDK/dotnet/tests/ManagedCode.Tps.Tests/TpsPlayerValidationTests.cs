using System.Text.Json;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlayerValidationTests
{
    [Fact]
    public void Player_ExposesPresentationStateAndCompletion()
    {
        var compiled = TpsRuntime.Compile(TpsRuntimeTestSupport.ReadFixture("valid", "runtime-parity.tps")).Script;
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
        Assert.Equal(TpsSpec.WordKinds.Pause, pauseState.CurrentWord?.Kind);
        Assert.Equal(1000, pauseState.NextTransitionMs);
        Assert.Equal(-1, pauseState.Presentation.ActiveWordInPhrase);
    }

    [Fact]
    public void Player_RejectsInvalidCompiledScripts()
    {
        Assert.Throws<ArgumentException>(() => new TpsPlayer(new CompiledScript()));

        var negativeDurationScript = new CompiledScript
        {
            TotalDurationMs = -1,
            Segments =
            [
                TpsRuntimeTestSupport.CreateSegment("segment-1")
            ]
        };

        Assert.Throws<ArgumentException>(() => new TpsPlayer(negativeDurationScript));

        var missingNestedGraph = new CompiledScript
        {
            TotalDurationMs = 100,
            Segments =
            [
                TpsRuntimeTestSupport.CreateSegment("segment-1")
            ],
            Words =
            [
                TpsRuntimeTestSupport.CreateWord("segment-1", "block-2", "phrase-2")
            ]
        };

        Assert.Throws<ArgumentException>(() => new TpsPlayer(missingNestedGraph));
    }

    [Fact]
    public void Player_RejectsNestedGraphsThatDoNotMatchCanonicalCollections()
    {
        var compiledJson = JsonSerializer.Serialize(TpsRuntime.Compile("## [Intro]\n### [Lead]\nReady.\n### [Close]\nNow.").Script);

        var reorderedBlocks = JsonSerializer.Deserialize<CompiledScript>(compiledJson)!;
        var reorderedSegment = Assert.IsType<List<CompiledSegment>>(reorderedBlocks.Segments)[0];
        Assert.IsType<List<CompiledBlock>>(reorderedSegment.Blocks).Reverse();
        Assert.Throws<ArgumentException>(() => new TpsPlayer(reorderedBlocks));

        var mismatchedPhraseWords = JsonSerializer.Deserialize<CompiledScript>(compiledJson)!;
        var firstBlock = Assert.IsType<List<CompiledSegment>>(mismatchedPhraseWords.Segments)[0].Blocks[0];
        Assert.IsType<List<CompiledWord>>(firstBlock.Phrases[0].Words).Clear();
        Assert.Throws<ArgumentException>(() => new TpsPlayer(mismatchedPhraseWords));
    }

}

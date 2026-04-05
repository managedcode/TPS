using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsRuntimeFixtureTests
{
    [Fact]
    public void Validate_ReportsExpectedDiagnosticsForInvalidFixtures()
    {
        foreach (var (fileName, expectedCodes) in TpsRuntimeTestSupport.LoadInvalidExpectations())
        {
            var result = TpsRuntime.Validate(TpsRuntimeTestSupport.ReadFixture("invalid", fileName));

            Assert.Equal(expectedCodes, result.Diagnostics.Select(diagnostic => diagnostic.Code).ToArray());
            Assert.All(result.Diagnostics, diagnostic => Assert.True(diagnostic.Range.Start.Line >= 1));
        }
    }

    [Fact]
    public void Compile_RuntimeParityFixture_ProducesExpectedSignals()
    {
        var result = TpsRuntime.Compile(TpsRuntimeTestSupport.ReadFixture("valid", "runtime-parity.tps"));
        Assert.True(result.Ok);
        Assert.All(result.Diagnostics, diagnostic => Assert.Equal(TpsSeverity.Warning, diagnostic.Severity));

        var segment = Assert.Single(result.Script.Segments);
        Assert.Equal("Call to Action", segment.Name);
        Assert.Equal(TpsSpec.EmotionNames.Motivational, segment.Emotion);
        Assert.Equal("Alex", segment.Speaker);

        var block = Assert.Single(segment.Blocks, candidate => candidate.Name == "Closing Block");
        Assert.Equal(TpsSpec.EmotionNames.Energetic, block.Emotion);

        var words = result.Script.Words.Where(word => word.Kind == TpsSpec.WordKinds.Word)
            .ToDictionary(word => word.CleanText.TrimEnd('.', '!', '?'), StringComparer.OrdinalIgnoreCase);
        Assert.Equal(180, words["teleprompter"].Metadata.SpeedOverride);
        Assert.Equal("TELE-promp-ter", words["teleprompter"].Metadata.PronunciationGuide);
        Assert.Equal(0.8d, words["carefully"].Metadata.SpeedMultiplier);
        Assert.Equal(TpsSpec.Tags.Loud, words["moment"].Metadata.VolumeLevel);
        Assert.Equal(TpsSpec.Tags.Building, words["moment"].Metadata.DeliveryMode);
        Assert.True(words["moment"].Metadata.IsHighlight);
        Assert.Equal("me", words["announcement"].Metadata.StressText);
        Assert.Equal("de-VE-lop-ment", words["development"].Metadata.StressGuide);

        var pause = Assert.Single(result.Script.Words, word => word.Kind == TpsSpec.WordKinds.Pause);
        Assert.Equal(2000, pause.DisplayDurationMs);
        var editPoint = Assert.Single(result.Script.Words, word => word.Kind == TpsSpec.WordKinds.EditPoint);
        Assert.Equal(TpsSpec.EditPointPriorityNames.High, editPoint.Metadata.EditPointPriority);
        Assert.Equal(result.Script.TotalDurationMs, result.Script.Words[^1].EndMs);
    }

    [Fact]
    public void Compile_EmitsAdvisoryArchetypeDiagnosticsFromSharedFixtures()
    {
        var warned = TpsRuntime.Compile(TpsRuntimeTestSupport.ReadFixture("valid", "archetype-warnings.tps"));
        Assert.True(warned.Ok);
        Assert.Equal(TpsRuntimeTestSupport.LoadAdvisoryExpectations("archetype-warnings.tps"), warned.Diagnostics.Select(diagnostic => diagnostic.Code).ToArray());
        Assert.All(warned.Diagnostics, diagnostic => Assert.Equal(TpsSeverity.Warning, diagnostic.Severity));

        var clean = TpsRuntime.Compile(TpsRuntimeTestSupport.ReadFixture("valid", "archetype-clean.tps"));
        Assert.True(clean.Ok);
        Assert.Empty(clean.Diagnostics);
    }

    [Fact]
    public void Compile_Examples_AreAcceptedWithoutDiagnostics()
    {
        foreach (var example in new[] { "basic.tps", "advanced.tps", "multi-segment.tps" })
        {
            var result = TpsRuntime.Compile(File.ReadAllText(Path.Combine(TpsRuntimeTestSupport.ExamplesRoot, example)));
            Assert.True(result.Ok, example);
            Assert.Empty(result.Diagnostics);
            Assert.NotEmpty(result.Script.Words);
        }
    }
}

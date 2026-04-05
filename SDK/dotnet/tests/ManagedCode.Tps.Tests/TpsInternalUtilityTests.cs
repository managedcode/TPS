using ManagedCode.Tps.Internal;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsInternalUtilityTests
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
        Assert.True(TpsSupport.IsKnownEmotion(TpsSpec.EmotionNames.Warm));
        Assert.False(TpsSupport.IsKnownEmotion("mystery"));
        Assert.Equal(TpsSpec.EmotionNames.Focused, TpsSupport.ResolveEmotion(null, TpsSpec.EmotionNames.Focused));
        Assert.Equal(TpsSpec.EmotionPalettes[TpsSpec.DefaultEmotion], TpsSupport.ResolvePalette("mystery"));
        Assert.Equal(160, TpsSupport.ResolveBaseWpm(new Dictionary<string, string> { [TpsSpec.FrontMatterKeys.BaseWpm] = "160" }));
        Assert.Equal(TpsSpec.MinimumWpm, TpsSupport.ResolveBaseWpm(new Dictionary<string, string> { [TpsSpec.FrontMatterKeys.BaseWpm] = "10" }));
        Assert.Equal(TpsSpec.DefaultBaseWpm, TpsSupport.ResolveBaseWpm(new Dictionary<string, string>()));
        Assert.Equal(0.8d, TpsSupport.ResolveSpeedMultiplier(TpsSpec.Tags.Slow, TpsSupport.ResolveSpeedOffsets(new Dictionary<string, string>())));
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
        Assert.Equal(string.Empty, TpsTextRules.BuildStandalonePunctuationSuffix(string.Empty));
    }
}

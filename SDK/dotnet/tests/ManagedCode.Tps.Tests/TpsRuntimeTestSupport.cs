using System.Text.Json;
using System.Text.Json.Nodes;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

internal static class TpsRuntimeTestSupport
{
    private const string TestWordId = "word-1";
    private const string TestWordText = "ghost";

    public static string FixturesRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../SDK/fixtures"));

    public static string ExamplesRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../examples"));

    public static string ReadFixture(string category, string fileName) =>
        File.ReadAllText(Path.Combine(FixturesRoot, category, fileName));

    public static IEnumerable<(string FileName, string[] Codes)> LoadInvalidExpectations()
    {
        using var document = JsonDocument.Parse(File.ReadAllText(Path.Combine(FixturesRoot, "runtime-expectations.json")));
        foreach (var property in document.RootElement.GetProperty("invalidDiagnostics").EnumerateObject())
        {
            yield return (property.Name, property.Value.EnumerateArray().Select(item => item.GetString()!).ToArray());
        }
    }

    public static string[] LoadAdvisoryExpectations(string fileName)
    {
        using var document = JsonDocument.Parse(File.ReadAllText(Path.Combine(FixturesRoot, "runtime-expectations.json")));
        return document.RootElement.GetProperty("advisoryDiagnostics").GetProperty(fileName).EnumerateArray().Select(item => item.GetString()!).ToArray();
    }

    public static CompiledScript MutateCompiledNode(JsonObject baseline, Action<JsonObject> mutate)
    {
        var clone = baseline.DeepClone().AsObject();
        mutate(clone);
        return JsonSerializer.Deserialize<CompiledScript>(clone.ToJsonString())!;
    }

    public static CompiledSegment CreateSegment(string id) =>
        new()
        {
            Id = id,
            Name = id,
            TargetWpm = TpsSpec.DefaultBaseWpm,
            Emotion = TpsSpec.DefaultEmotion,
            BackgroundColor = TpsSpec.PaletteHex.TextSlate900,
            TextColor = TpsSpec.PaletteHex.TextWhite,
            AccentColor = TpsSpec.PaletteHex.BackgroundRed300
        };

    public static CompiledWord CreateWord(string segmentId, string blockId, string phraseId) =>
        new()
        {
            Id = TestWordId,
            Index = 0,
            Kind = TpsSpec.WordKinds.Word,
            CleanText = TestWordText,
            CharacterCount = TestWordText.Length,
            OrpPosition = 1,
            DisplayDurationMs = 100,
            StartMs = 0,
            EndMs = 100,
            Metadata = new WordMetadata { EmotionHint = TpsSpec.DefaultEmotion, HeadCue = TpsSpec.EmotionHeadCues[TpsSpec.DefaultEmotion] },
            SegmentId = segmentId,
            BlockId = blockId,
            PhraseId = phraseId
        };

    public static void AssertSetterIsNotPublic<TContract>(string propertyName)
    {
        var property = typeof(TContract).GetProperty(propertyName);
        Assert.NotNull(property);
        Assert.Null(property.GetSetMethod(nonPublic: false));
    }
}

using System.Text.Json;
using System.Text.Json.Nodes;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlayerValidationDriftTests
{
    [Fact]
    public void Player_RejectsAdditionalCompiledGraphDriftCases()
    {
        const string source = """
        ## [Intro]
        ### [Lead]
        Ready.
        ### [Close]
        Now.
        ## [Wrap]
        ### [Body]
        Done.
        """;
        var baseline = JsonNode.Parse(JsonSerializer.Serialize(TpsRuntime.Compile(source).Script))!.AsObject();

        var missingBlocks = TpsRuntimeTestSupport.MutateCompiledNode(baseline, root => root["segments"]![0]!["blocks"] = new JsonArray());
        Assert.Throws<ArgumentException>(() => new TpsPlayer(missingBlocks));

        var reorderedSegments = TpsRuntimeTestSupport.MutateCompiledNode(baseline, root =>
        {
            var segments = root["segments"]!.AsArray();
            var first = segments[0]!.DeepClone();
            var second = segments[1]!.DeepClone();
            segments[0] = second;
            segments[1] = first;
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(reorderedSegments));

        var wordMissingPhrase = TpsRuntimeTestSupport.MutateCompiledNode(baseline, root => root["words"]![0]!["phraseId"] = string.Empty);
        Assert.Throws<ArgumentException>(() => new TpsPlayer(wordMissingPhrase));

        var durationMismatch = TpsRuntimeTestSupport.MutateCompiledNode(baseline, root => root["totalDurationMs"] = 1);
        Assert.Throws<ArgumentException>(() => new TpsPlayer(durationMismatch));

        var blockTimelineGap = TpsRuntimeTestSupport.MutateCompiledNode(baseline, root =>
        {
            var block = root["segments"]![0]!["blocks"]![1]!;
            block["startWordIndex"] = block["startWordIndex"]!.GetValue<int>() + 1;
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(blockTimelineGap));

        var phraseOutsideBlock = TpsRuntimeTestSupport.MutateCompiledNode(baseline, root =>
        {
            var segment = root["segments"]![0]!;
            var block = segment["blocks"]![1]!;
            var phrase = block["phrases"]![0]!;
            phrase["endMs"] = block["endMs"]!.GetValue<int>() + 1;
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(phraseOutsideBlock));

        var nestedWordMismatch = TpsRuntimeTestSupport.MutateCompiledNode(baseline, root =>
        {
            var segment = root["segments"]![0]!;
            var block = segment["blocks"]![1]!;
            block["words"]![0]!["id"] = "ghost-word";
        });
        Assert.Throws<ArgumentException>(() => new TpsPlayer(nestedWordMismatch));
    }
}

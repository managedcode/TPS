using System.Text.Json.Nodes;

namespace ManagedCode.Tps.Tests;

public sealed class ExampleSnapshotIntegrationTests
{
    [Fact]
    public void Compile_Examples_MatchSharedCompiledAndPlayerSnapshots()
    {
        foreach (var fileName in ExampleSnapshotSupport.ExampleFiles)
        {
            var source = File.ReadAllText(Path.Combine(ExampleSnapshotSupport.ExamplesRoot, fileName));
            var result = TpsRuntime.Compile(source);

            Assert.True(result.Ok, fileName);

            var expected = JsonNode.Parse(File.ReadAllText(Path.Combine(ExampleSnapshotSupport.ExampleSnapshotsRoot, $"{Path.GetFileNameWithoutExtension(fileName)}.snapshot.json")));
            var actual = ExampleSnapshotSupport.BuildExampleSnapshot(fileName, result.Script);

            Assert.True(
                JsonNode.DeepEquals(expected, actual),
                $"Snapshot mismatch for {fileName}{Environment.NewLine}Expected:{Environment.NewLine}{expected!.ToJsonString(ExampleSnapshotSupport.JsonOptions)}{Environment.NewLine}{Environment.NewLine}Actual:{Environment.NewLine}{actual.ToJsonString(ExampleSnapshotSupport.JsonOptions)}");
        }
    }

    [Fact]
    public void Player_EnumerateStates_WalksThePlaybackTimeline()
    {
        var compiled = TpsRuntime.Compile(File.ReadAllText(Path.Combine(ExampleSnapshotSupport.ExamplesRoot, "basic.tps"))).Script;
        var player = new TpsPlayer(compiled);

        var states = player.EnumerateStates(Math.Max(1, compiled.TotalDurationMs / 4)).ToArray();

        Assert.True(states.Length >= 2);
        Assert.Equal(0, states[0].ElapsedMs);
        Assert.Equal(compiled.TotalDurationMs, states[^1].ElapsedMs);
        Assert.True(states[^1].IsComplete);
        Assert.Throws<ArgumentOutOfRangeException>(() => player.EnumerateStates(0).ToArray());
    }
}

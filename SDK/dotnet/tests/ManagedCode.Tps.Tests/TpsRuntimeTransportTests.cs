using System.Text.Json;
using System.Text.Json.Nodes;

namespace ManagedCode.Tps.Tests;

public sealed class TpsRuntimeTransportTests
{
    [Fact]
    public void RuntimeTransport_MatchesAndRestoresTheCanonicalCompiledJsonFixture()
    {
        var compiled = TpsRuntime.Compile(TpsRuntimeTestSupport.ReadFixture("valid", "runtime-parity.tps"));
        var serialized = JsonNode.Parse(JsonSerializer.Serialize(compiled.Script));
        var canonical = JsonNode.Parse(TpsRuntimeTestSupport.ReadFixture("transport", "runtime-parity.compiled.json"));

        Assert.True(JsonNode.DeepEquals(serialized, canonical));

        using var restored = TpsStandalonePlayer.FromCompiledJson(canonical!.ToJsonString());
        Assert.Equal("Call to Action", restored.Snapshot.State.CurrentSegment?.Name);
        Assert.Equal(compiled.Script.TotalDurationMs, restored.Script.TotalDurationMs);
    }
}

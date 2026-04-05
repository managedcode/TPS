using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

internal static class ExampleSnapshotSupport
{
    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true
    };

    public static string ExamplesRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../examples"));

    public static string ExampleSnapshotsRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../../../SDK/fixtures/examples"));

    public static string[] ExampleFiles => ["basic.tps", "advanced.tps", "multi-segment.tps"];

    public static JsonObject BuildExampleSnapshot(string fileName, CompiledScript script)
    {
        var player = new TpsPlayer(script);
        using var session = new TpsPlaybackSession(script);
        using var standalone = TpsStandalonePlayer.FromCompiledScript(script);
        var checkpoints = new JsonArray();
        foreach (var checkpoint in CreateCheckpointTimes(script.TotalDurationMs))
        {
            checkpoints.Add(ExampleSnapshotPlaybackNormalizer.NormalizePlayerState(checkpoint.Label, player.GetState(checkpoint.ElapsedMs)));
        }

        return new JsonObject
        {
            ["fileName"] = fileName,
            ["source"] = $"examples/{fileName}",
            ["compiled"] = ExampleSnapshotCompiledNormalizer.NormalizeCompiledScript(script),
            ["player"] = new JsonObject
            {
                ["checkpoints"] = checkpoints
            },
            ["playback"] = new JsonObject
            {
                ["session"] = ExampleSnapshotPlaybackNormalizer.BuildPlaybackSequence(session),
                ["standalone"] = ExampleSnapshotPlaybackNormalizer.BuildPlaybackSequence(standalone)
            }
        };
    }

    public static JsonArray ToJsonArray(IEnumerable<string> values)
    {
        var array = new JsonArray();
        foreach (var value in values)
        {
            array.Add(value);
        }

        return array;
    }

    public static JsonObject Compact(JsonObject value)
    {
        var toRemove = new List<string>();
        foreach (var property in value)
        {
            if (property.Value is null)
            {
                toRemove.Add(property.Key);
                continue;
            }

            if (property.Value is JsonObject childObject)
            {
                Compact(childObject);
            }
        }

        foreach (var propertyName in toRemove)
        {
            value.Remove(propertyName);
        }

        return value;
    }

    public static double NormalizeNumber(double value) =>
        double.Parse(value.ToString("0.000000", CultureInfo.InvariantCulture), CultureInfo.InvariantCulture);

    public static IEnumerable<(string Label, int ElapsedMs)> CreateCheckpointTimes(int totalDurationMs)
    {
        var checkpoints = new[]
        {
            ("start", 0),
            ("quarter", (int)Math.Round(totalDurationMs * 0.25d, MidpointRounding.AwayFromZero)),
            ("middle", (int)Math.Round(totalDurationMs * 0.5d, MidpointRounding.AwayFromZero)),
            ("threeQuarter", (int)Math.Round(totalDurationMs * 0.75d, MidpointRounding.AwayFromZero)),
            ("complete", totalDurationMs)
        };

        var seen = new HashSet<int>();
        foreach (var checkpoint in checkpoints)
        {
            if (seen.Add(checkpoint.Item2))
            {
                yield return checkpoint;
            }
        }
    }
}

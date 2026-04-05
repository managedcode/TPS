using ManagedCode.Tps.Models;
using Microsoft.Extensions.Time.Testing;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlaybackSessionConcurrencyTests
{
    [Fact]
    public async Task PlaybackSession_NavigationCommands_UseTheLiveClockBeforeTheNextTick()
    {
        var timeProvider = new FakeTimeProvider();
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now please.").Script;
        using var session = new TpsPlaybackSession(
            script,
            new TpsPlaybackSessionOptions
            {
                TickIntervalMs = 1_000,
                TimeProvider = timeProvider
            });

        session.Play();
        timeProvider.Advance(TimeSpan.FromMilliseconds(script.Words[1].StartMs + 25));
        await Task.Yield();

        var state = session.NextWord();

        Assert.Equal("please.", state.CurrentWord?.CleanText);
        Assert.Equal(script.Words[2].StartMs, state.ElapsedMs);
    }

    [Fact]
    public async Task PlaybackSession_ConcurrentControlCommands_KeepStateConsistent()
    {
        var script = TpsRuntime.Compile("""
        ## [Intro]
        ### [Lead]
        Ready now please stay focused for this longer playback sample.
        ### [Close]
        Done soon after another phrase lands safely.
        """).Script;
        using var session = new TpsPlaybackSession(
            script,
            new TpsPlaybackSessionOptions
            {
                TickIntervalMs = 1_000
            });

        session.Play();

        var tasks = Enumerable.Range(0, 4).Select(async lane =>
        {
            for (var iteration = 0; iteration < 40; iteration++)
            {
                switch ((lane + iteration) % 6)
                {
                    case 0:
                        session.Seek((iteration * 37) % Math.Max(1, script.TotalDurationMs));
                        break;
                    case 1:
                        session.NextWord();
                        break;
                    case 2:
                        session.PreviousWord();
                        break;
                    case 3:
                        session.NextBlock();
                        break;
                    case 4:
                        session.PreviousBlock();
                        break;
                    default:
                        session.SetSpeedOffsetWpm(((lane * 5) + iteration) % 41 - 20);
                        break;
                }

                await Task.Yield();
            }
        });

        await Task.WhenAll(tasks);

        var snapshot = session.CreateSnapshot();

        Assert.InRange(snapshot.State.ElapsedMs, 0, script.TotalDurationMs);
        Assert.InRange(snapshot.State.CurrentWordIndex, -1, script.Words.Count - 1);
        Assert.InRange(snapshot.Tempo.EffectiveBaseWpm, TpsSpec.MinimumWpm, TpsSpec.MaximumWpm);
        Assert.NotNull(snapshot.State.CurrentSegment);
    }
}

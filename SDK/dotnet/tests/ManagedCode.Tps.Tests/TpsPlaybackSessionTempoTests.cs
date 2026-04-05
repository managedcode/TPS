using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlaybackSessionTempoTests
{
    [Fact]
    public async Task PlaybackSession_ChangingSpeedDuringPlayback_RebasesTheRunningClock()
    {
        var script = TpsRuntime.Compile("""
        ---
        base_wpm: 140
        ---
        ## [Signal]
        ### [Body]
        Ready now for the cue.
        """).Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { TickIntervalMs = 5 });
        var snapshots = new List<TpsPlaybackSnapshot>();
        var snapshotLock = new object();

        session.SnapshotChanged += (_, args) =>
        {
            lock (snapshotLock)
            {
                snapshots.Add(args.Snapshot);
            }
        };

        session.Play();
        await Task.Delay(40);
        var beforeSpeedChange = session.CurrentState.ElapsedMs;

        var slower = session.DecreaseSpeed();

        Assert.Equal(130, slower.Tempo.EffectiveBaseWpm);
        Assert.Equal(TpsPlaybackStatus.Playing, slower.Status);

        await Task.Delay(40);
        var paused = session.Pause();

        Assert.True(paused.ElapsedMs >= beforeSpeedChange);
        Assert.Equal(TpsPlaybackStatus.Paused, session.Status);
        lock (snapshotLock)
        {
            Assert.Contains(snapshots, snapshot => snapshot.Tempo.EffectiveBaseWpm == 130);
        }
    }

    [Fact]
    public void PlaybackSession_ChangingSpeedWhilePaused_EmitsSnapshotChangedImmediately()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script);
        var snapshots = new List<TpsPlaybackSnapshot>();

        session.SnapshotChanged += (_, args) => snapshots.Add(args.Snapshot);
        session.NextWord();

        var slowed = session.DecreaseSpeed(15);

        Assert.Equal(125, slowed.Tempo.EffectiveBaseWpm);
        Assert.Contains(snapshots, snapshot => snapshot.Tempo.EffectiveBaseWpm == 125);
        Assert.Equal("now.", session.Snapshot.State.CurrentWord?.CleanText);
    }

    [Fact]
    public void PlaybackSession_PauseWhileIdle_IsANoOp()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script);
        var statuses = new List<TpsPlaybackStatus>();

        session.StatusChanged += (_, args) => statuses.Add(args.Status);

        var paused = session.Pause();

        Assert.Equal(TpsPlaybackStatus.Idle, session.Status);
        Assert.Equal(0, paused.ElapsedMs);
        Assert.Empty(statuses);
    }

    [Fact]
    public void PlaybackSession_SetSpeedOffsetWpm_WithTheCurrentOffset_DoesNotRepublish()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { InitialSpeedOffsetWpm = -10 });
        var snapshots = new List<TpsPlaybackSnapshot>();

        session.SnapshotChanged += (_, args) => snapshots.Add(args.Snapshot);

        var snapshot = session.SetSpeedOffsetWpm(-10);

        Assert.Equal(130, snapshot.Tempo.EffectiveBaseWpm);
        Assert.Equal("Ready", snapshot.State.CurrentWord?.CleanText);
        Assert.Empty(snapshots);
    }
}

using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsStandalonePlayerTests
{
    [Fact]
    public void StandalonePlayer_CompilesSourceAndExposesRuntimeSnapshotAndControls()
    {
        using var player = TpsStandalonePlayer.Compile("""
        ## [Signal]
        ### [Body]
        Ready now.
        ### [Close]
        Done.
        """);
        var snapshots = new List<TpsPlaybackSnapshot>();

        player.SnapshotChanged += (_, args) => snapshots.Add(args.Snapshot);

        Assert.True(player.Ok);
        Assert.True(player.Compilation.Ok);
        Assert.Equal(player.Script, player.Compilation.Script);
        Assert.Equal(player.Document, player.Compilation.Document);
        Assert.Empty(player.Diagnostics);
        Assert.Equal(TpsPlaybackStatus.Idle, player.Status);
        Assert.False(player.IsPlaying);
        Assert.Equal(3, player.Script.Words.Count);
        Assert.Equal("Ready", player.Snapshot.State.CurrentWord?.CleanText);

        player.AdvanceBy(10);
        player.NextWord();

        Assert.Equal("now.", player.Snapshot.State.CurrentWord?.CleanText);
        Assert.Equal(player.CurrentState, player.Snapshot.State);

        player.NextBlock();
        Assert.Equal("Close", player.Snapshot.State.CurrentBlock?.Name);

        player.IncreaseSpeed();
        Assert.Equal(150, player.Snapshot.Tempo.EffectiveBaseWpm);

        player.DecreaseSpeed(20);
        Assert.Equal(130, player.Snapshot.Tempo.EffectiveBaseWpm);

        player.PreviousBlock();
        Assert.Equal("Body", player.Snapshot.State.CurrentBlock?.Name);

        player.Stop();
        Assert.Equal(TpsPlaybackStatus.Idle, player.Status);
        Assert.True(snapshots.Count >= 1);
    }

    [Fact]
    public void StandalonePlayer_ObserveSnapshot_ReplaysTheCurrentSnapshotForUiHosts()
    {
        using var player = TpsStandalonePlayer.Compile("## [Signal]\n### [Body]\nReady now.");
        var snapshots = new List<TpsPlaybackSnapshot>();

        using var subscription = player.ObserveSnapshot(snapshots.Add);
        player.NextWord();

        Assert.Equal("Ready", snapshots[0].State.CurrentWord?.CleanText);
        Assert.Contains(snapshots, snapshot => snapshot.State.CurrentWord?.CleanText == "now.");
    }

    [Fact]
    public async Task StandalonePlayer_AutoPlay_StartsTheRuntimeAndEmitsSnapshots()
    {
        var context = new QueuedSynchronizationContext();
        using var player = TpsStandalonePlayer.Compile(
            "## [Signal]\n### [Body]\nReady now.",
            new TpsStandalonePlayerOptions
            {
                AutoPlay = true,
                TickIntervalMs = 5,
                EventSynchronizationContext = context
            });
        var playing = new TaskCompletionSource<TpsPlaybackStatus>(TaskCreationOptions.RunContinuationsAsynchronously);
        var snapshotChanged = new TaskCompletionSource<TpsPlaybackSnapshot>(TaskCreationOptions.RunContinuationsAsynchronously);
        var observedSnapshots = new List<TpsPlaybackSnapshot>();

        player.StatusChanged += (_, args) =>
        {
            if (args.Status == TpsPlaybackStatus.Playing)
            {
                playing.TrySetResult(args.Status);
            }
        };
        player.SnapshotChanged += (_, args) => snapshotChanged.TrySetResult(args.Snapshot);
        using var subscription = player.ObserveSnapshot(observedSnapshots.Add);

        context.Drain();

        await playing.Task.WaitAsync(TimeSpan.FromSeconds(2));
        Assert.True(player.IsPlaying);
        Assert.Equal(TpsPlaybackStatus.Playing, player.Status);

        var initialSnapshot = player.Snapshot;
        Assert.True(initialSnapshot.Controls.CanPause);
        Assert.True(observedSnapshots.Count >= 1);

        var emittedSnapshot = await snapshotChanged.Task.WaitAsync(TimeSpan.FromSeconds(2));
        Assert.True(emittedSnapshot.State.ElapsedMs >= 0);

        var paused = player.Pause();
        Assert.Equal(TpsPlaybackStatus.Paused, player.Status);
        Assert.True(paused.ElapsedMs >= 0);
    }

    [Fact]
    public async Task StandalonePlayer_AutoPlay_WithoutASynchronizationContext_UsesBackgroundDispatch()
    {
        using var player = TpsStandalonePlayer.Compile(
            "## [Signal]\n### [Body]\nReady now.",
            new TpsStandalonePlayerOptions
            {
                AutoPlay = true,
                TickIntervalMs = 5
            });

        var timeoutAt = DateTime.UtcNow.AddSeconds(2);
        while (!player.IsPlaying && DateTime.UtcNow < timeoutAt)
        {
            await Task.Delay(10);
        }

        Assert.True(player.IsPlaying);
        Assert.Equal(TpsPlaybackStatus.Playing, player.Status);
    }
}

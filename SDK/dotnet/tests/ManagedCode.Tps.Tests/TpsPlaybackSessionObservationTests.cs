using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlaybackSessionObservationTests
{
    [Fact]
    public void PlaybackSession_ObserveSnapshot_ReplaysTheCurrentSnapshotForUiHosts()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script);
        var snapshots = new List<TpsPlaybackSnapshot>();

        using var subscription = session.ObserveSnapshot(snapshots.Add);
        session.NextWord();

        Assert.Equal("Ready", snapshots[0].State.CurrentWord?.CleanText);
        Assert.Contains(snapshots, snapshot => snapshot.State.CurrentWord?.CleanText == "now.");
    }

    [Fact]
    public void PlaybackSession_ObserveSnapshot_UsesTheConfiguredSynchronizationContextForInitialReplay()
    {
        var context = new RecordingSynchronizationContext();
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(
            script,
            new TpsPlaybackSessionOptions
            {
                EventSynchronizationContext = context
            });
        TpsPlaybackSnapshot? snapshot = null;

        using var subscription = session.ObserveSnapshot(candidate => snapshot = candidate);

        Assert.True(context.PostCount >= 1);
        Assert.Equal("Ready", snapshot?.State.CurrentWord?.CleanText);
    }

    [Fact]
    public void PlaybackSession_ObserveSnapshot_DoesNotReplayAfterImmediateDispose()
    {
        var context = new QueuedSynchronizationContext();
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(
            script,
            new TpsPlaybackSessionOptions
            {
                EventSynchronizationContext = context
            });
        var snapshots = new List<TpsPlaybackSnapshot>();

        var subscription = session.ObserveSnapshot(snapshots.Add);
        subscription.Dispose();
        context.Drain();

        Assert.Empty(snapshots);
    }

    [Fact]
    public void PlaybackSession_ObserveSnapshot_CanSkipInitialReplay_AndExplicitOffStopsFurtherEvents()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script);
        var snapshots = new List<TpsPlaybackSnapshot>();
        var statuses = new List<TpsPlaybackStatus>();

        using var subscription = session.ObserveSnapshot(snapshots.Add, emitCurrent: false);
        EventHandler<TpsPlaybackSnapshotChangedEventArgs> handler = (_, args) => statuses.Add(args.Snapshot.Status);
        session.SnapshotChanged += handler;

        session.NextWord();
        session.SnapshotChanged -= handler;
        session.PreviousWord();

        Assert.Equal("now.", snapshots[0].State.CurrentWord?.CleanText);
        Assert.Equal([TpsPlaybackStatus.Paused], statuses);
    }
}

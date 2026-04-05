using ManagedCode.Tps.Models;
using Microsoft.Extensions.Time.Testing;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlaybackSessionDispatchTests
{
    [Fact]
    public async Task PlaybackSession_ThrowingSubscribers_DoNotStopTimedPlayback()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { TickIntervalMs = 5 });
        var completed = new TaskCompletionSource<PlayerState>(TaskCreationOptions.RunContinuationsAsynchronously);

        session.SnapshotChanged += (_, _) => throw new InvalidOperationException("boom");
        session.Completed += (_, args) => completed.TrySetResult(args.State);

        session.Play();

        var finalState = await completed.Task.WaitAsync(TimeSpan.FromSeconds(3));
        Assert.True(finalState.IsComplete);
        Assert.Equal(TpsPlaybackStatus.Completed, session.Status);
    }

    [Fact]
    public void PlaybackSession_ReportsThrowingListeners_ThroughListenerException()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script);
        TpsPlaybackListenerExceptionEventArgs? reported = null;

        session.SnapshotChanged += (_, _) => throw new InvalidOperationException("boom");
        session.ListenerException += (_, args) => reported = args;

        session.NextWord();

        Assert.NotNull(reported);
        Assert.Equal(TpsPlaybackEventNames.SnapshotChanged, reported.EventName);
        Assert.Equal("boom", reported.Message);
        Assert.Equal("now.", reported.Snapshot.State.CurrentWord?.CleanText);
    }

    [Fact]
    public void PlaybackSession_UsesConfiguredEventSynchronizationContext()
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

        session.SnapshotChanged += (_, args) => snapshot = args.Snapshot;

        session.NextWord();

        Assert.True(context.PostCount >= 1);
        Assert.Equal("now.", snapshot?.State.CurrentWord?.CleanText);
    }

    [Fact]
    public void PlaybackSession_Dispose_PreventsFurtherUse()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady.").Script;
        var session = new TpsPlaybackSession(script);

        session.Dispose();

        Assert.Throws<ObjectDisposedException>(session.Play);
        Assert.Throws<ObjectDisposedException>(session.CreateSnapshot);
    }

    [Fact]
    public void PlaybackSession_ReplayingACompletedScript_GoesStraightBackToPlaying()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script);
        var transitions = new List<(TpsPlaybackStatus Previous, TpsPlaybackStatus Current)>();

        session.Seek(script.TotalDurationMs);
        transitions.Clear();
        session.StatusChanged += (_, args) => transitions.Add((args.PreviousStatus, args.Status));

        var restarted = session.Play();

        Assert.Equal(0, restarted.ElapsedMs);
        Assert.Equal(TpsPlaybackStatus.Playing, session.Status);
        Assert.Equal([(TpsPlaybackStatus.Completed, TpsPlaybackStatus.Playing)], transitions);
    }

    [Fact]
    public async Task PlaybackSession_CanRunDeterministicallyWithFakeTimeProvider()
    {
        var timeProvider = new FakeTimeProvider();
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(
            script,
            new TpsPlaybackSessionOptions
            {
                TickIntervalMs = 10,
                TimeProvider = timeProvider
            });
        var completed = new TaskCompletionSource<PlayerState>(TaskCreationOptions.RunContinuationsAsynchronously);

        session.Completed += (_, args) => completed.TrySetResult(args.State);

        session.Play();
        timeProvider.Advance(TimeSpan.FromSeconds(5));

        var finalState = await completed.Task.WaitAsync(TimeSpan.FromSeconds(1));
        Assert.True(finalState.IsComplete);
        Assert.Equal(script.TotalDurationMs, finalState.ElapsedMs);
        Assert.Equal(TpsPlaybackStatus.Completed, session.Status);
    }
}

using Microsoft.Extensions.Time.Testing;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlaybackSessionTests
{
    [Fact]
    public void PlaybackSession_DefaultConstruction_StartsIdleAndSupportsNoOpSeek()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady.").Script;
        using var session = new TpsPlaybackSession(script);

        Assert.False(session.IsPlaying);
        Assert.Equal(TpsPlaybackStatus.Idle, session.Status);

        var initial = session.Seek(0);

        Assert.Equal(0, initial.ElapsedMs);
        Assert.Equal(TpsPlaybackStatus.Idle, session.Status);
    }

    [Fact]
    public void PlaybackSession_RaisesWordAndCompletionEventsForDeterministicSeeking()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { TickIntervalMs = 5 });
        var statuses = new List<TpsPlaybackStatus>();
        var words = new List<string?>();
        var completedCount = 0;

        session.StatusChanged += (_, args) => statuses.Add(args.Status);
        session.WordChanged += (_, args) => words.Add(args.State.CurrentWord?.CleanText);
        session.Completed += (_, _) => completedCount++;

        var secondWord = session.Seek(script.Words[0].EndMs);
        var done = session.Seek(script.TotalDurationMs);

        Assert.Equal("now.", secondWord.CurrentWord?.CleanText);
        Assert.True(done.IsComplete);
        Assert.Equal(TpsPlaybackStatus.Completed, session.Status);
        Assert.Equal(["now."], words);
        Assert.Equal([TpsPlaybackStatus.Paused, TpsPlaybackStatus.Completed], statuses);
        Assert.Equal(1, completedCount);
    }

    [Fact]
    public async Task PlaybackSession_PlayPauseStopAndAdvanceBy_AreUsableAsync()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { TickIntervalMs = 10 });

        var firstPlay = session.Play();
        var secondPlay = session.Play();
        Assert.Equal(firstPlay.ElapsedMs, secondPlay.ElapsedMs);
        Assert.True(session.IsPlaying);

        await Task.Delay(40);

        var paused = session.Pause();
        Assert.Equal(TpsPlaybackStatus.Paused, session.Status);
        Assert.True(paused.ElapsedMs > 0);

        var advanced = session.AdvanceBy(25);
        Assert.True(advanced.ElapsedMs >= paused.ElapsedMs);
        Assert.Equal(TpsPlaybackStatus.Paused, session.Status);

        var stopped = session.Stop();
        Assert.Equal(0, stopped.ElapsedMs);
        Assert.Equal(TpsPlaybackStatus.Idle, session.Status);
        Assert.False(session.IsPlaying);
    }

    [Fact]
    public void PlaybackSession_RaisesPhraseBlockAndSegmentEventsAcrossBoundaries()
    {
        var script = TpsRuntime.Compile("""
        ## [Intro]
        ### [Lead]
        Ready.
        ### [Close]
        Now.
        ## [Wrap]
        ### [Body]
        Done.
        """).Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { TickIntervalMs = 5 });
        var phraseChanges = 0;
        var blockChanges = 0;
        var segmentChanges = 0;

        session.PhraseChanged += (_, _) => phraseChanges++;
        session.BlockChanged += (_, _) => blockChanges++;
        session.SegmentChanged += (_, _) => segmentChanges++;

        session.Seek(script.Words[0].EndMs);
        session.Seek(script.Words[1].EndMs);

        Assert.True(phraseChanges >= 2);
        Assert.True(blockChanges >= 2);
        Assert.True(segmentChanges >= 1);
    }

    [Fact]
    public void PlaybackSession_PlayHandlesCompletedAndEmptyScripts()
    {
        var completedScript = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady.").Script;
        using var completedSession = new TpsPlaybackSession(completedScript, new TpsPlaybackSessionOptions { TickIntervalMs = 5 });
        completedSession.Seek(completedScript.TotalDurationMs);

        var restarted = completedSession.Play();

        Assert.Equal(TpsPlaybackStatus.Playing, completedSession.Status);
        Assert.Equal(0, restarted.ElapsedMs);
        completedSession.Stop();

        var emptyScript = TpsRuntime.Compile(string.Empty).Script;
        using var emptySession = new TpsPlaybackSession(emptyScript);

        var completed = emptySession.Play();

        Assert.True(completed.IsComplete);
        Assert.Equal(TpsPlaybackStatus.Completed, emptySession.Status);
    }

    [Fact]
    public async Task PlaybackSession_CompletesWithInternalTimerAsync()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady.").Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { TickIntervalMs = 10 });
        var completed = new TaskCompletionSource<PlayerState>(TaskCreationOptions.RunContinuationsAsynchronously);

        session.Completed += (_, args) => completed.TrySetResult(args.State);

        session.Play();

        var finalState = await completed.Task.WaitAsync(TimeSpan.FromSeconds(3));
        Assert.True(finalState.IsComplete);
        Assert.Equal(TpsPlaybackStatus.Completed, session.Status);
    }

    [Fact]
    public void PlaybackSession_ProvidesSnapshotNavigationAndSpeedControls()
    {
        var script = TpsRuntime.Compile("""
        ## [Intro]
        ### [Lead]
        Ready.
        ### [Close]
        Now.
        ## [Wrap]
        ### [Body]
        Done.
        """).Script;
        using var session = new TpsPlaybackSession(script, new TpsPlaybackSessionOptions { InitialSpeedOffsetWpm = -10 });
        var snapshots = new List<TpsPlaybackSnapshot>();

        session.SnapshotChanged += (_, args) => snapshots.Add(args.Snapshot);

        Assert.Equal(130, session.Snapshot.Tempo.EffectiveBaseWpm);

        session.NextBlock();
        Assert.Equal("Close", session.Snapshot.State.CurrentBlock?.Name);

        session.PreviousBlock();
        Assert.Equal("Lead", session.Snapshot.State.CurrentBlock?.Name);

        session.NextWord();
        Assert.Equal("Now.", session.Snapshot.State.CurrentWord?.CleanText);

        var faster = session.IncreaseSpeed(20);
        Assert.Equal(150, faster.Tempo.EffectiveBaseWpm);
        Assert.True(faster.FocusedWord?.IsActive);
        Assert.True(snapshots.Count >= 1);
    }

    [Fact]
    public void PlaybackSession_ControlsMatchRewindAndTempoCommands()
    {
        var script = TpsRuntime.Compile("""
        ## [Intro]
        ### [Lead]
        Ready now.
        ### [Close]
        Done.
        """).Script;
        using var session = new TpsPlaybackSession(script);

        var firstWordMidpoint = session.Seek(script.Words[0].StartMs + 10);
        Assert.True(session.Snapshot.Controls.CanPreviousWord);
        Assert.True(session.Snapshot.Controls.CanNextWord);

        var secondBlockMidpoint = session.Seek(script.Segments[0].Blocks[1].StartMs + 10);
        Assert.True(session.Snapshot.Controls.CanPreviousBlock);
        Assert.True(session.Snapshot.Controls.CanDecreaseSpeed);
        Assert.True(session.Snapshot.Controls.CanIncreaseSpeed);

        session.SetSpeedOffsetWpm(TpsSpec.MinimumWpm - session.BaseWpm);
        Assert.False(session.Snapshot.Controls.CanDecreaseSpeed);

        session.SetSpeedOffsetWpm(TpsSpec.MaximumWpm - session.BaseWpm);
        Assert.False(session.Snapshot.Controls.CanIncreaseSpeed);
        Assert.Equal("now.", firstWordMidpoint.NextWord?.CleanText);
    }

    [Fact]
    public void PlaybackSession_RewindsWordAndBlockBeforeSteppingFurtherBack()
    {
        var script = TpsRuntime.Compile("""
        ## [Intro]
        ### [Lead]
        Ready now.
        ### [Close]
        Done soon.
        """).Script;
        using var session = new TpsPlaybackSession(script);
        var secondWord = script.Words[1];
        var secondBlock = script.Segments[0].Blocks[1];

        var insideSecondWord = session.Seek(secondWord.StartMs + 20);
        Assert.Equal("now.", insideSecondWord.CurrentWord?.CleanText);

        var rewindToWordStart = session.PreviousWord();
        Assert.Equal(secondWord.StartMs, rewindToWordStart.ElapsedMs);
        Assert.Equal("now.", rewindToWordStart.CurrentWord?.CleanText);

        var rewindToFirstWord = session.PreviousWord();
        Assert.Equal(script.Words[0].StartMs, rewindToFirstWord.ElapsedMs);
        Assert.Equal("Ready", rewindToFirstWord.CurrentWord?.CleanText);

        session.Seek(secondBlock.StartMs + 20);
        var rewindToBlockStart = session.PreviousBlock();
        Assert.Equal(secondBlock.StartMs, rewindToBlockStart.ElapsedMs);
        Assert.Equal("Close", rewindToBlockStart.CurrentBlock?.Name);

        var rewindToPreviousBlock = session.PreviousBlock();
        Assert.Equal(script.Segments[0].Blocks[0].StartMs, rewindToPreviousBlock.ElapsedMs);
        Assert.Equal("Lead", rewindToPreviousBlock.CurrentBlock?.Name);
    }

    [Fact]
    public void PlaybackSession_HandlesEmptySnapshotsAndBoundaryNavigation()
    {
        var emptyScript = TpsRuntime.Compile(string.Empty).Script;
        using var emptySession = new TpsPlaybackSession(emptyScript, new TpsPlaybackSessionOptions { BaseWpm = 0 });

        var snapshot = emptySession.Snapshot;

        Assert.Equal(1d, snapshot.Tempo.PlaybackRate);
        Assert.Equal(0, snapshot.CurrentBlockIndex);
        Assert.Equal(0, snapshot.CurrentSegmentIndex);
        Assert.Null(snapshot.FocusedWord);
        Assert.Null(snapshot.CurrentWordDurationMs);
        Assert.Null(snapshot.CurrentWordRemainingMs);
        Assert.Empty(snapshot.VisibleWords);
        Assert.False(snapshot.Controls.CanNextWord);
        Assert.False(snapshot.Controls.CanPreviousWord);
        Assert.Equal(-1, emptySession.NextWord().CurrentWordIndex);
        Assert.Equal(-1, emptySession.PreviousWord().CurrentWordIndex);
        Assert.Equal(0, emptySession.NextBlock().ElapsedMs);
        Assert.Equal(0, emptySession.PreviousBlock().ElapsedMs);
    }

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
    public void PlaybackSession_ObserveSnapshot_ReplaysTheCurrentSnapshotForUiHosts()
    {
        var script = TpsRuntime.Compile("## [Signal]\n### [Body]\nReady now.").Script;
        using var session = new TpsPlaybackSession(script);
        var snapshots = new List<TpsPlaybackSnapshot>();

        using var subscription = session.ObserveSnapshot(snapshot => snapshots.Add(snapshot));
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

        var subscription = session.ObserveSnapshot(snapshot => snapshots.Add(snapshot));
        subscription.Dispose();
        context.Drain();

        Assert.Empty(snapshots);
    }

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

        using var subscription = player.ObserveSnapshot(snapshot => snapshots.Add(snapshot));
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
        using var subscription = player.ObserveSnapshot(snapshot => observedSnapshots.Add(snapshot));

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
        Assert.Equal("snapshotChanged", reported.EventName);
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

        Assert.Throws<ObjectDisposedException>(() => session.Play());
        Assert.Throws<ObjectDisposedException>(() => session.CreateSnapshot());
    }

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

    private sealed class RecordingSynchronizationContext : SynchronizationContext
    {
        public int PostCount { get; private set; }

        public override void Post(SendOrPostCallback d, object? state)
        {
            PostCount++;
            d(state);
        }
    }

    private sealed class QueuedSynchronizationContext : SynchronizationContext
    {
        private readonly Queue<(SendOrPostCallback Callback, object? State)> _queue = new();

        public override void Post(SendOrPostCallback d, object? state)
        {
            _queue.Enqueue((d, state));
        }

        public void Drain()
        {
            var previous = Current;
            SetSynchronizationContext(this);
            try
            {
                while (_queue.TryDequeue(out var workItem))
                {
                    workItem.Callback(workItem.State);
                }
            }
            finally
            {
                SetSynchronizationContext(previous);
            }
        }
    }
}

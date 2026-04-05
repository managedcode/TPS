using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlaybackSessionCoreTests
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
}

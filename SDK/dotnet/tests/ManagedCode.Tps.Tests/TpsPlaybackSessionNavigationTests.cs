using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

public sealed class TpsPlaybackSessionNavigationTests
{
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

        session.Seek(script.Segments[0].Blocks[1].StartMs + 10);
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
}

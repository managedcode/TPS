using System.Text.Json.Nodes;
using ManagedCode.Tps.Models;

namespace ManagedCode.Tps.Tests;

internal static class ExampleSnapshotPlaybackNormalizer
{
    public static JsonObject NormalizePlayerState(string label, PlayerState state) =>
        ExampleSnapshotSupport.Compact(new JsonObject
        {
            ["label"] = label,
            ["elapsedMs"] = state.ElapsedMs,
            ["remainingMs"] = state.RemainingMs,
            ["progress"] = ExampleSnapshotSupport.NormalizeNumber(state.Progress),
            ["isComplete"] = state.IsComplete,
            ["currentWordIndex"] = state.CurrentWordIndex,
            ["currentWordId"] = state.CurrentWord?.Id,
            ["currentWordText"] = state.CurrentWord?.CleanText,
            ["currentWordKind"] = state.CurrentWord?.Kind,
            ["previousWordId"] = state.PreviousWord?.Id,
            ["nextWordId"] = state.NextWord?.Id,
            ["currentSegmentId"] = state.CurrentSegment?.Id,
            ["currentBlockId"] = state.CurrentBlock?.Id,
            ["currentPhraseId"] = state.CurrentPhrase?.Id,
            ["nextTransitionMs"] = state.NextTransitionMs,
            ["presentation"] = ExampleSnapshotSupport.Compact(new JsonObject
            {
                ["segmentName"] = state.Presentation.SegmentName,
                ["blockName"] = state.Presentation.BlockName,
                ["phraseText"] = state.Presentation.PhraseText,
                ["visibleWordIds"] = ExampleSnapshotSupport.ToJsonArray(state.Presentation.VisibleWords.Select(word => word.Id)),
                ["visibleWordTexts"] = ExampleSnapshotSupport.ToJsonArray(state.Presentation.VisibleWords.Select(word => word.CleanText)),
                ["activeWordInPhrase"] = state.Presentation.ActiveWordInPhrase
            })
        });

    public static JsonArray BuildPlaybackSequence(TpsPlaybackSession session)
    {
        var checkpoints = new JsonArray
        {
            NormalizePlaybackSnapshot("initial", session.Snapshot)
        };

        session.NextWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextWord", session.Snapshot));
        session.PreviousWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousWord", session.Snapshot));
        session.NextBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextBlock", session.Snapshot));
        session.PreviousBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousBlock", session.Snapshot));
        session.IncreaseSpeed();
        checkpoints.Add(NormalizePlaybackSnapshot("afterIncreaseSpeed", session.Snapshot));
        session.DecreaseSpeed(session.Snapshot.Tempo.SpeedStepWpm);
        checkpoints.Add(NormalizePlaybackSnapshot("afterDecreaseSpeed", session.Snapshot));

        return checkpoints;
    }

    public static JsonArray BuildPlaybackSequence(TpsStandalonePlayer player)
    {
        var checkpoints = new JsonArray
        {
            NormalizePlaybackSnapshot("initial", player.Snapshot)
        };

        player.NextWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextWord", player.Snapshot));
        player.PreviousWord();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousWord", player.Snapshot));
        player.NextBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterNextBlock", player.Snapshot));
        player.PreviousBlock();
        checkpoints.Add(NormalizePlaybackSnapshot("afterPreviousBlock", player.Snapshot));
        player.IncreaseSpeed();
        checkpoints.Add(NormalizePlaybackSnapshot("afterIncreaseSpeed", player.Snapshot));
        player.DecreaseSpeed(player.Snapshot.Tempo.SpeedStepWpm);
        checkpoints.Add(NormalizePlaybackSnapshot("afterDecreaseSpeed", player.Snapshot));

        return checkpoints;
    }

    public static JsonObject NormalizePlaybackSnapshot(string label, TpsPlaybackSnapshot snapshot) =>
        ExampleSnapshotSupport.Compact(new JsonObject
        {
            ["label"] = label,
            ["status"] = snapshot.Status.ToString().ToLowerInvariant(),
            ["state"] = NormalizePlayerState("state", snapshot.State),
            ["tempo"] = ExampleSnapshotSupport.Compact(new JsonObject
            {
                ["baseWpm"] = snapshot.Tempo.BaseWpm,
                ["effectiveBaseWpm"] = snapshot.Tempo.EffectiveBaseWpm,
                ["speedOffsetWpm"] = snapshot.Tempo.SpeedOffsetWpm,
                ["speedStepWpm"] = snapshot.Tempo.SpeedStepWpm,
                ["playbackRate"] = ExampleSnapshotSupport.NormalizeNumber(snapshot.Tempo.PlaybackRate)
            }),
            ["controls"] = ExampleSnapshotSupport.Compact(new JsonObject
            {
                ["canPlay"] = snapshot.Controls.CanPlay,
                ["canPause"] = snapshot.Controls.CanPause,
                ["canStop"] = snapshot.Controls.CanStop,
                ["canNextWord"] = snapshot.Controls.CanNextWord,
                ["canPreviousWord"] = snapshot.Controls.CanPreviousWord,
                ["canNextBlock"] = snapshot.Controls.CanNextBlock,
                ["canPreviousBlock"] = snapshot.Controls.CanPreviousBlock,
                ["canIncreaseSpeed"] = snapshot.Controls.CanIncreaseSpeed,
                ["canDecreaseSpeed"] = snapshot.Controls.CanDecreaseSpeed
            }),
            ["focusedWordId"] = snapshot.FocusedWord?.Word.Id,
            ["focusedWordText"] = snapshot.FocusedWord?.Word.CleanText,
            ["currentWordDurationMs"] = snapshot.CurrentWordDurationMs,
            ["currentWordRemainingMs"] = snapshot.CurrentWordRemainingMs,
            ["currentSegmentIndex"] = snapshot.CurrentSegmentIndex,
            ["currentBlockIndex"] = snapshot.CurrentBlockIndex,
            ["visibleWords"] = new JsonArray(snapshot.VisibleWords
                .Select(word => ExampleSnapshotSupport.Compact(new JsonObject
                {
                    ["id"] = word.Word.Id,
                    ["text"] = word.Word.CleanText,
                    ["isActive"] = word.IsActive,
                    ["isRead"] = word.IsRead,
                    ["isUpcoming"] = word.IsUpcoming,
                    ["emotion"] = word.Emotion,
                    ["speaker"] = word.Speaker,
                    ["emphasisLevel"] = word.EmphasisLevel,
                    ["isHighlighted"] = word.IsHighlighted,
                    ["deliveryMode"] = word.DeliveryMode,
                    ["volumeLevel"] = word.VolumeLevel
                }))
                .ToArray())
        });
}

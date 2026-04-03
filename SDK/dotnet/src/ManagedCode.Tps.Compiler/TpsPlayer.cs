using ManagedCode.Tps.Compiler.Models;

namespace ManagedCode.Tps.Compiler;

public sealed class TpsPlayer(CompiledScript script)
{
    public PlayerState GetState(int elapsedMs)
    {
        var clampedElapsed = Math.Clamp(elapsedMs, 0, script.TotalDurationMs);
        var currentWord = FindCurrentWord(clampedElapsed);
        var currentSegment = currentWord is null
            ? script.Segments.FirstOrDefault()
            : script.Segments.FirstOrDefault(segment => string.Equals(segment.Id, currentWord.SegmentId, StringComparison.Ordinal));
        var currentBlock = currentWord is null
            ? currentSegment?.Blocks.FirstOrDefault()
            : currentSegment?.Blocks.FirstOrDefault(block => string.Equals(block.Id, currentWord.BlockId, StringComparison.Ordinal));
        var currentPhrase = currentWord is null
            ? currentBlock?.Phrases.FirstOrDefault()
            : currentBlock?.Phrases.FirstOrDefault(phrase => string.Equals(phrase.Id, currentWord.PhraseId, StringComparison.Ordinal));
        var currentWordIndex = currentWord?.Index ?? Math.Max(0, script.Words.Count - 1);
        var previousWord = currentWordIndex > 0 ? script.Words[currentWordIndex - 1] : null;
        var nextWord = currentWordIndex + 1 < script.Words.Count ? script.Words[currentWordIndex + 1] : null;

        return new PlayerState
        {
            ElapsedMs = clampedElapsed,
            RemainingMs = Math.Max(0, script.TotalDurationMs - clampedElapsed),
            Progress = script.TotalDurationMs == 0 ? 1d : clampedElapsed / (double)script.TotalDurationMs,
            IsComplete = clampedElapsed >= script.TotalDurationMs,
            CurrentWordIndex = currentWordIndex,
            CurrentWord = currentWord,
            PreviousWord = previousWord,
            NextWord = nextWord,
            CurrentSegment = currentSegment,
            CurrentBlock = currentBlock,
            CurrentPhrase = currentPhrase,
            NextTransitionMs = currentWord?.EndMs ?? script.TotalDurationMs,
            Presentation = new PlayerPresentationModel
            {
                SegmentName = currentSegment?.Name,
                BlockName = currentBlock?.Name,
                PhraseText = currentPhrase?.Text,
                VisibleWords = currentPhrase?.Words ?? [],
                ActiveWordInPhrase = currentPhrase is null || currentWord is null
                    ? -1
                    : currentPhrase.Words.FindIndex(word => string.Equals(word.Id, currentWord.Id, StringComparison.Ordinal))
            }
        };
    }

    public PlayerState Seek(int elapsedMs) => GetState(elapsedMs);

    private CompiledWord? FindCurrentWord(int elapsedMs) =>
        script.Words.FirstOrDefault(word => word.EndMs > elapsedMs && word.EndMs > word.StartMs) ??
        script.Words.LastOrDefault();
}

namespace ManagedCode.Tps.Compiler.Models;

public enum TpsSeverity
{
    Info,
    Warning,
    Error
}

public sealed record TpsPosition(int Line, int Column, int Offset);

public sealed record TpsRange(TpsPosition Start, TpsPosition End);

public sealed record TpsDiagnostic(
    string Code,
    TpsSeverity Severity,
    string Message,
    TpsRange Range,
    string? Suggestion = null);

public class TpsValidationResult
{
    public required bool Ok { get; init; }

    public required IReadOnlyList<TpsDiagnostic> Diagnostics { get; init; }
}

public sealed class TpsParseResult : TpsValidationResult
{
    public required TpsDocument Document { get; init; }
}

public sealed class TpsCompilationResult : TpsValidationResult
{
    public required TpsDocument Document { get; init; }

    public required CompiledScript Script { get; init; }
}

public sealed class TpsDocument
{
    public Dictionary<string, string> Metadata { get; init; } = new(StringComparer.OrdinalIgnoreCase);

    public List<TpsSegment> Segments { get; init; } = [];
}

public sealed class TpsSegment
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public string Content { get; set; } = string.Empty;

    public int? TargetWpm { get; init; }

    public string? Emotion { get; init; }

    public string? Speaker { get; init; }

    public string? Timing { get; init; }

    public string? BackgroundColor { get; init; }

    public string? TextColor { get; init; }

    public string? AccentColor { get; init; }

    public string? LeadingContent { get; set; }

    public List<TpsBlock> Blocks { get; init; } = [];
}

public sealed class TpsBlock
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public string Content { get; set; } = string.Empty;

    public int? TargetWpm { get; init; }

    public string? Emotion { get; init; }

    public string? Speaker { get; init; }
}

public sealed record WordMetadata
{
    public bool IsEmphasis { get; init; }

    public int EmphasisLevel { get; init; }

    public bool IsPause { get; init; }

    public int? PauseDurationMs { get; init; }

    public bool IsHighlight { get; init; }

    public bool IsBreath { get; init; }

    public bool IsEditPoint { get; init; }

    public string? EditPointPriority { get; init; }

    public string? EmotionHint { get; init; }

    public string? InlineEmotionHint { get; init; }

    public string? VolumeLevel { get; init; }

    public string? DeliveryMode { get; init; }

    public string? PhoneticGuide { get; init; }

    public string? PronunciationGuide { get; init; }

    public string? StressText { get; init; }

    public string? StressGuide { get; init; }

    public int? SpeedOverride { get; init; }

    public double? SpeedMultiplier { get; init; }

    public string? Speaker { get; init; }

    public string? HeadCue { get; init; }
}

public sealed class CompiledWord
{
    public required string Id { get; init; }

    public required int Index { get; init; }

    public required string Kind { get; init; }

    public required string CleanText { get; set; }

    public required int CharacterCount { get; set; }

    public required int OrpPosition { get; set; }

    public required int DisplayDurationMs { get; init; }

    public required int StartMs { get; init; }

    public required int EndMs { get; init; }

    public required WordMetadata Metadata { get; init; }

    public required string SegmentId { get; init; }

    public required string BlockId { get; init; }

    public required string PhraseId { get; set; }
}

public sealed class CompiledPhrase
{
    public required string Id { get; init; }

    public required string Text { get; init; }

    public required int StartWordIndex { get; init; }

    public required int EndWordIndex { get; init; }

    public required int StartMs { get; init; }

    public required int EndMs { get; init; }

    public required List<CompiledWord> Words { get; init; }
}

public sealed class CompiledBlock
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public required int TargetWpm { get; init; }

    public required string Emotion { get; init; }

    public string? Speaker { get; init; }

    public required bool IsImplicit { get; init; }

    public int StartWordIndex { get; set; }

    public int EndWordIndex { get; set; }

    public int StartMs { get; set; }

    public int EndMs { get; set; }

    public List<CompiledPhrase> Phrases { get; init; } = [];

    public List<CompiledWord> Words { get; init; } = [];
}

public sealed class CompiledSegment
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public required int TargetWpm { get; init; }

    public required string Emotion { get; init; }

    public string? Speaker { get; init; }

    public string? Timing { get; init; }

    public required string BackgroundColor { get; init; }

    public required string TextColor { get; init; }

    public required string AccentColor { get; init; }

    public int StartWordIndex { get; set; }

    public int EndWordIndex { get; set; }

    public int StartMs { get; set; }

    public int EndMs { get; set; }

    public List<CompiledBlock> Blocks { get; init; } = [];

    public List<CompiledWord> Words { get; init; } = [];
}

public sealed class CompiledScript
{
    public Dictionary<string, string> Metadata { get; init; } = new(StringComparer.OrdinalIgnoreCase);

    public int TotalDurationMs { get; set; }

    public List<CompiledSegment> Segments { get; init; } = [];

    public List<CompiledWord> Words { get; init; } = [];
}

public sealed class PlayerPresentationModel
{
    public string? SegmentName { get; init; }

    public string? BlockName { get; init; }

    public string? PhraseText { get; init; }

    public required IReadOnlyList<CompiledWord> VisibleWords { get; init; }

    public required int ActiveWordInPhrase { get; init; }
}

public sealed class PlayerState
{
    public required int ElapsedMs { get; init; }

    public required int RemainingMs { get; init; }

    public required double Progress { get; init; }

    public required bool IsComplete { get; init; }

    public required int CurrentWordIndex { get; init; }

    public CompiledWord? CurrentWord { get; init; }

    public CompiledWord? PreviousWord { get; init; }

    public CompiledWord? NextWord { get; init; }

    public CompiledSegment? CurrentSegment { get; init; }

    public CompiledBlock? CurrentBlock { get; init; }

    public CompiledPhrase? CurrentPhrase { get; init; }

    public int? NextTransitionMs { get; init; }

    public required PlayerPresentationModel Presentation { get; init; }
}

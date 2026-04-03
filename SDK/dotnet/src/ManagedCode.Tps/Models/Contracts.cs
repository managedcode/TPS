using System.Text.Json.Serialization;

namespace ManagedCode.Tps.Models;

[JsonConverter(typeof(TpsSeverityJsonConverter))]
public enum TpsSeverity
{
    Info,
    Warning,
    Error
}

internal interface ICompiledTimeRange
{
    int StartWordIndex { get; set; }

    int EndWordIndex { get; set; }

    int StartMs { get; set; }

    int EndMs { get; set; }
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
    public IReadOnlyDictionary<string, string> Metadata { get; init; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyList<TpsSegment> Segments { get; init; } = Array.Empty<TpsSegment>();
}

public sealed class TpsSegment
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public string Content { get; set; } = string.Empty;

    public int? TargetWpm { get; init; }

    public required string Emotion { get; init; }

    public string? Speaker { get; init; }

    public string? Timing { get; init; }

    public required string BackgroundColor { get; init; }

    public required string TextColor { get; init; }

    public required string AccentColor { get; init; }

    public string? LeadingContent { get; set; }

    public IReadOnlyList<TpsBlock> Blocks { get; init; } = Array.Empty<TpsBlock>();
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

    public required IReadOnlyList<CompiledWord> Words { get; init; }
}

public sealed class CompiledBlock : ICompiledTimeRange
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

    public IReadOnlyList<CompiledPhrase> Phrases { get; init; } = Array.Empty<CompiledPhrase>();

    public IReadOnlyList<CompiledWord> Words { get; init; } = Array.Empty<CompiledWord>();
}

public sealed class CompiledSegment : ICompiledTimeRange
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

    public IReadOnlyList<CompiledBlock> Blocks { get; init; } = Array.Empty<CompiledBlock>();

    public IReadOnlyList<CompiledWord> Words { get; init; } = Array.Empty<CompiledWord>();
}

public sealed class CompiledScript
{
    public IReadOnlyDictionary<string, string> Metadata { get; init; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    public int TotalDurationMs { get; set; }

    public IReadOnlyList<CompiledSegment> Segments { get; init; } = Array.Empty<CompiledSegment>();

    public IReadOnlyList<CompiledWord> Words { get; init; } = Array.Empty<CompiledWord>();
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
